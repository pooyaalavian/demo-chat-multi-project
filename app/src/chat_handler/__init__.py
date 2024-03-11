from src.cosmos_utils.conversations_client import ConversationCosmosClient
from openai import AsyncAzureOpenAI
import os
import re 
import json
from datetime import datetime
from src.ai_search import search_vector, search_semantic, search_hybrid , get_index_client
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
        conversationsClient: ConversationCosmosClient,
        topicId: str,
        conversationId: str,
        recent_user_message: dict,
    ):
        self.conversationsCosmosClient = conversationsClient
        self.topicId = topicId
        self.conversationId = conversationId
        self.new_messages = [message_maker(recent_user_message)]
        self.finished = False

    def get_messages(self, return_human=True, return_assistant=True, return_search_assistant=True):
        '''Returns all messages in the history plus all messages created so far (but not saved yet). 
        Excludes system prompts, as they must be produced by use-case.'''
        
        all_msgs = [message_maker(m) for m in self.conversation["messages"]] + self.new_messages
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
        try:
            _client = get_index_client()
            index_name = f'idx-{self.topicId}'
            _client.get_index(index_name)
        except:
            print("No search client found. Exiting...")
            return
        openai_model = CHAT_MODEL
        messages = self.get_messages(return_search_assistant=False)
        my_messages = [message_maker({"content":GET_CONTEXT_PROMPT, "role":"system"})] + messages
        my_messages = [m.to_llm() for m in my_messages]
        response = await oai_client.chat.completions.create(
            messages=my_messages,
            model=openai_model,
            max_tokens=750,
            temperature=0.2,
            response_format={'type':'json_object'}
        )
        self.context_query = response.choices[0].message.content
        try:
            parsed_result = json.loads(self.context_query)
        except:
            print("Error parsing context query")
            print(self.context_query)
            return
        if parsed_result.get('response','') == 'request_info':
            self.new_messages.append(AssistantMessage(
                content=parsed_result.get('message','Please clarify'),
                agent="search-assistant",
                metadata={
                    'input':self.context_query,
                    'agent':'search-assistant',
                },
            ))
            self.finished = True
            return  
        if parsed_result.get('response','') != 'query':
            print('Invalid response')
            print(parsed_result)
            return
        
        query = parsed_result.get('query','')
        vector_text = parsed_result.get('question','')
        print("Query:", query)
        print("Vector Text:", vector_text)
                
        search_type = SEARCH_TYPE
        self.conversation['usage'].append({
            "type":"search",
            "model":openai_model,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        })
        
        if search_type == 'vector':
            vector = await get_content_embedding(vector_text)
            _results = search_vector(self.topicId, vector, top_n=TOP_N)
        elif search_type == 'semantic':
            _results = search_semantic(self.topicId, query, top_n=TOP_N)
        elif search_type == 'hybrid':
            vector = await get_content_embedding(vector_text)
            _results = search_hybrid(self.topicId, vector, query, top_n=TOP_N)

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
        if not self.finished:
            await self.generate_reply()
            print("Reply generated")
        await self.update_history()
        print("History updated")
        return self.conversation

    async def generate_reply(self):
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
        self.conversation['usage'].append({
            "type":"search",
            "model":CHAT_MODEL,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        })
        content, references = await self.transform_response(response.choices[0].message.content)
        self.new_messages.append(
            AssistantMessage(content=content,references=references, metadata=metadata)
        )
        self.finished = True
    
    async def init_history(self):
        '''Retrieves the conversation from the database and sets the conversation attribute.'''
        self.conversation = await self.conversationsCosmosClient.get_by_id(
            self.topicId, self.conversationId
        )
        self.conversation["messages"] = self.conversation.get("messages", [])
        return self.conversation["messages"]

    async def transform_response(self, response:str):
        references = []
        matches = re.findall(f'<ref id="([^"]*)"/>', response)
        for match in matches:
            if match in references:
                continue
            references.append(match)
            idx = len(references)
            response = response.replace(f'<ref id="{match}"/>', f'^{idx}^')
        print(matches)
        return response, references
    
    async def update_history(self):
        
        conversation = {}
        for k in self.conversation.keys():
            if k.startswith("_"):
                continue 
            if k=='createdAt':
                continue
            conversation[k] = self.conversation[k]
                
        conversation["messages"]= [m.to_dict() for m in self.get_messages()]
        conversation["updatedAt"] = datetime.utcnow().isoformat()
        self.conversation = conversation

        try:
            self.conversation = await self.conversationsCosmosClient.upsert(self.conversation)
        except Exception as e:
            print("Error updating conversation")
            print(e)
        return
