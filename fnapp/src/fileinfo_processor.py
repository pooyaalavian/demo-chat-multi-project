import os
from os.path import join, dirname, realpath
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
from openai.types.chat import ChatCompletion
import logging
import json 

from azure.identity import DefaultAzureCredential, get_bearer_token_provider

# Initialize credentials
credentials = DefaultAzureCredential()
token_provider = get_bearer_token_provider(credentials, "https://cognitiveservices.azure.com/.default")

oai_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_ad_token_provider=token_provider() #api_key=os.getenv("AZURE_OPENAI_API_KEY"),
)

class FileInfoProcessor:
    def __init__(self, path_to_docintel_firstpage:str):
        self.path_to_docintel_firstpage=path_to_docintel_firstpage.split('/files/')[1]
        self.blob_client = BlobServiceClient(
            account_url=f"https://{os.getenv('StorageAccountName')}.blob.core.windows.net", 
            credential=credentials #os.getenv('StorageAccountKey')
        )
        self.get_prereqs()
        return 
    
    def get_prereqs(self):
        tmp = self.blob_client.get_blob_client('files',self.path_to_docintel_firstpage).download_blob().readall()
        self.data = json.loads(tmp)
        with open(join(
            dirname(realpath(__file__)),
            'prompts/extract_file_info_from_first_page.system.prompt'
        )) as f:
            self.system_prompt = f.read()

    def call_openai(self, page_contents:list[str], *,  retry_count=1):  
        response: ChatCompletion = oai_client.chat.completions.create(
            messages=[
                {"role": "system", "content": self.system_prompt}, 
                *[{"role": "user", "name":f"Page_{i+1}", "content": p} for i,p in enumerate(page_contents)],
            ],
            model='gpt-4',
            max_tokens=1000,
            temperature=0.2,
            response_format={"type":'json_object'},
        )
        answer = response.choices[0].message.content
        logging.info(answer)

        try:
            answer = json.loads(answer)
        except json.JSONDecodeError:
            if retry_count < 3:
                answer = self.call_openai(page_contents, retry_count=retry_count+1)
            
        usage = response.usage
        return answer, usage

    def process(self):
        pages = self.data['pages'][0:4]
        contents = [
            '\n'.join([ l['content'] for l in p['lines'] ])
            for p in pages
        ]
        answer, usage = self.call_openai(contents)
        
        return answer