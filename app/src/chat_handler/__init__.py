from src.cosmos_utils.threads_client import TopicThreadsCosmosClient
from openai import AsyncAzureOpenAI
import os
from datetime import datetime
from src.ai_search import search_vector, search_semantic, search_hybrid 
from src.embedding import get_content_embedding
from .messages import UserMessage, SystemMessage, SourceMessage, AssistantMessage, message_maker

oai_client = AsyncAzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
)
CHAT_MODEL = os.getenv("AZURE_OPENAI_CHAT_MODEL")
EMBEDDING_MODEL = os.getenv("AZURE_OPENAI_EMBEDDING_MODEL")

GET_CONTEXT_PROMPT = open(os.path.dirname(__file__)+"/get-context.system.prompt").read()
MAIN_PROMPT = open(os.path.dirname(__file__)+"/main-chat.system.prompt").read()

SEARCH_TYPE = os.getenv("SEARCH_TYPE")
if SEARCH_TYPE not in ["vector", "semantic", "hybrid"]:
    print("Invalid search type. Defaulting to 'vector'")
    SEARCH_TYPE = "vector"

TOP_N = int(os.getenv("SEARCH_TOP_N", "10"))

  
class ChatHandler:
    def __init__(
        self,
        threadsClient: TopicThreadsCosmosClient,
        topicId: str,
        threadId: str,
        recent_user_message: dict,
    ):
        self.threadsCosmosClient = threadsClient
        self.topicId = topicId
        self.threadId = threadId
        self.new_messages = [message_maker(recent_user_message)]

    def get_messages(self, return_human=True, return_assistant=True, return_search_assistant=True):
        '''Returns all messages in the history plus all messages created so far (but not saved yet). 
        Excludes system prompts, as they must be produced by use-case.'''
        
        all_msgs = [message_maker(m) for m in self.thread["messages"]] + self.new_messages
        msgs = []
        for msg in all_msgs:
            if msg.role == "user" and msg.agent == "human" and return_human:
                msgs.append(msg)
            elif msg.role == "assistant" and return_assistant:
                msgs.append(msg)
            elif msg.role == "user" and msg.agent == "search-assistant" and return_search_assistant:
                msgs.append(msg)
        return msgs

    async def get_context(self):
        openai_model = CHAT_MODEL
        messages = self.get_messages(return_search_assistant=False)
        my_messages = [message_maker({"content":GET_CONTEXT_PROMPT, "role":"system"})] + messages
        my_messages = [m.to_llm() for m in my_messages]
        response = await oai_client.chat.completions.create(
            messages=my_messages,
            model=openai_model,
            max_tokens=750,
            temperature=0.7,
        )
        self.context_query = response.choices[0].message.content
        search_type = SEARCH_TYPE
        self.thread['usage'].append({
            "type":"search",
            "model":openai_model,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        })
        
        if search_type == 'vector':
            vector = await get_content_embedding(self.context_query)
            _results = search_vector(self.topicId, vector, top_n=TOP_N)
        elif search_type == 'semantic':
            _results = search_semantic(self.topicId, self.context_query, top_n=TOP_N)
        elif search_type == 'hybrid':
            vector = await get_content_embedding(self.context_query)
            _results = search_hybrid(self.topicId, vector, self.context_query, top_n=TOP_N)

        results = []
        count = 0
        for r in _results:
            results.append(r)
            count += 1
            if count >= 4:
                break

        self.new_messages.append(SourceMessage(
            agent="search-assistant",
            input=self.context_query,
            search_type=search_type,
            results=results,
        ))
        return 
    
    async def __call__(self):
        print("ChatHandler called")
        await self.init_history()
        print("History initialized")
        await self.get_context()
        print("Context retrieved")
        
        messages = [SystemMessage(content=MAIN_PROMPT)] + self.get_messages()
        messages = [m.to_llm() for m in messages]
        
        response = await oai_client.chat.completions.create(
            messages=messages,
            model=CHAT_MODEL,
            max_tokens=750,
            temperature=0.7,
        )
        metadata = {
            "choice":response.choices[0].model_dump(),
            "usage": response.usage.model_dump(),
        }
        self.thread['usage'].append({
            "type":"search",
            "model":CHAT_MODEL,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        })
        self.new_messages.append(
            AssistantMessage(content=response.choices[0].message.content, metadata=metadata)
        )
        await self.update_history()
        print("History updated")
        return self.thread

    async def init_history(self):
        '''Retrieves the thread from the database and sets the thread attribute.'''
        self.thread = await self.threadsCosmosClient.get_by_id(
            self.topicId, self.threadId
        )
        self.thread["messages"] = self.thread.get("messages", [])
        return self.thread["messages"]

    async def update_history(self):
        
        thread = {}
        for k in self.thread.keys():
            if k.startswith("_"):
                continue 
            if k=='createdAt':
                continue
            thread[k] = self.thread[k]
                
        thread["messages"]= [m.to_dict() for m in self.get_messages()]
        thread["updatedAt"] = datetime.utcnow().isoformat()
        self.thread = thread

        try:
            self.thread = await self.threadsCosmosClient.upsert(self.thread)
        except Exception as e:
            print("Error updating thread")
            print(e)
        return
