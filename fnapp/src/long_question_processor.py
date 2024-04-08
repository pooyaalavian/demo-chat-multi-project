import os 
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
from openai.types.chat import ChatCompletion
import json 
from src.cosmos import create_jobresult, update_job, get_job

oai_client = AzureOpenAI(
       azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
)

SYSTEM_PROMPT='''You are a diligent analyst. User A provides a document as context and User B asks a question. 
You need to read the document and answer the question.
You must respond in JSON format.
The JSON must follow this format:
{
    "contextAnswersQuestion": boolean,
    "answer": ["string", "string"],
    "error": "optional string" 
}

* If the answer to the question is not in the context document, set contextAnswersQuestion to false and respond. 
For example if user B is looking for word "apple" and the word "apple" or its synonyms are not in the context document, set contextAnswersQuestion to false and provide an empty array for answer.
* **IMPORTANT** If the context document does not contain relevant information, set contextAnswersQuestion to false and provide an empty array for answer.
* If context answers the question, set contextAnswersQuestion to true and provide the answer.
* If the answer to the question is not in the context document, respond with error explaining why.
* Do NOT generate an answer if it is not in the context document.
'''
GPT_MODEL = "gpt-35-turbo"

class LongQuestionProcessor:
    def __init__(self, job, files):
        self.job = job
        self.question = job["question"]
        self.topicId = job["topicId"]
        self.jobId = job["id"]
        self.files = files
        self.blob_client = BlobServiceClient(
            account_url=f"https://{os.getenv('StorageAccountName')}.blob.core.windows.net", 
            credential=os.getenv('StorageAccountKey')
        )
    
    def call_openai(self, context, *, model=GPT_MODEL, force_json=True, retry_count=1):
        response: ChatCompletion = oai_client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT}, 
                {"role": "user", "name":"A", "content": context},
                {"role": "user", "name":"B", "content": self.question},
            ],
            model=model,
            # deployment=GPT_MODEL,
            max_tokens=1000,
            temperature=0.2,
            # response_format={"type":'json_object'},
        )
        answer = response.choices[0].message.content
        if force_json:
            try:
                answer = json.loads(answer)
            except json.JSONDecodeError:
                if retry_count < 3:
                    return self.call_openai(context, model=model, force_json=force_json, retry_count=retry_count+1)
                else:
                    answer= {
                        "contextAnswersQuestion": False, 
                        "answer": [], 
                        "error": "Failed to parse JSON"
                    }
        usage = response.usage
        return answer, usage
    
    def get_pages(self, payload):
        pages = [p['page_number'] for p in  payload['pages']]
        return pages
    
    def get_text_for_page(self, payload, page):
        paras = [
            p
            for p in payload['paragraphs']
            if p['bounding_regions'][0]['page_number'] == page
            and (
                p['role'] is None
                or p['role'] in ['title','sectionHeading','pageHeader']
            )
        ]
        text = "\n\n".join([p['content'] for p in paras])
        return text
    
    def process(self):
        tmp = get_job(self.topicId, self.jobId)
        if tmp['status'] != 'queued':
            return 
        update_job(self.topicId, self.jobId, [
            {"op":"add", "path":"/status", "value":"running"},
        ])
        
        try:
            for file in self.files:
                if type(file['doc_intel']) == str:
                    file['doc_intel'] = [file['doc_intel']]
                for chunk in file['doc_intel']:
                    chunk_path = chunk.split('/files/')[1]
                    data = self.blob_client.get_blob_client('files',chunk_path).download_blob().readall()
                    payload = json.loads(data)
                    pages = self.get_pages(payload)
                    for page in pages:
                        text = self.get_text_for_page(payload, page)
                        answer, usage = self.call_openai(text, model=self.job['llm'])
                        create_jobresult(self.topicId, self.jobId, page, answer, usage.model_dump())
            update_job(self.topicId, self.jobId, [
                {"op":"add", "path":"/status", "value":"finished"},
            ])
        except Exception as e:
            update_job(self.topicId, self.jobId, [
                {"op":"add", "path":"/status", "value":"failed"},
                {"op":"add", "path":"/error", "value":str(e)},
            ])