import os
from os.path import dirname, join, realpath
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
# from openai.types.chat import ChatCompletion
# import json
# from src.cosmos import create_jobresult, update_job, get_job, get_setting
# import logging



class Processor:
    def __init__(self, job, files:list) -> None:
        self.job = job
        self.files = files

        self.topicId = job["topicId"]
        self.jobId = job["id"]
        self.jobType = job["jobType"]

        self.oai_client = AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        )
        self.blob_client = BlobServiceClient(
            account_url=f"https://{os.getenv('StorageAccountName')}.blob.core.windows.net",
            credential=os.getenv("StorageAccountKey"),
        )
        self.usage = {
            "completion_tokens": 0,
            "prompt_tokens": 0,
            "total_tokens": 0,
        }
        # if 'usage' in job:
        #     self.usage = job['usage']
        return 
    
    def read_prompt(self, file_name: str,**kwargs) -> str:
        text =open(
            join(dirname(realpath(__file__)), "prompts", file_name)
        ).read()
        for key, value in kwargs.items():
            text = text.replace(f'%{key}%', value)
        return text
    
    def process(self):
        raise NotImplementedError("Subclasses must implement this method")
    
    def add_usage(self, usage1, usage2):
        if usage1 is None:
            usage1 = {}
        if usage2 is None:
            usage2 = {}
        return {
            "completion_tokens": usage1.get("completion_tokens", 0) + usage2.get("completion_tokens", 0),
            "prompt_tokens": usage1.get("prompt_tokens", 0) + usage2.get("prompt_tokens", 0),
            "total_tokens": usage1.get("total_tokens", 0) + usage2.get("total_tokens", 0),
        }
        
    def log_usage(self, usage):
        self.usage["completion_tokens"] += usage["completion_tokens"]
        self.usage["prompt_tokens"] += usage["prompt_tokens"]
        self.usage["total_tokens"] += usage["total_tokens"]
        return

