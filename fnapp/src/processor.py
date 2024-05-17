import os
from os.path import dirname, join, realpath
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
from openai.types.chat import ChatCompletion
import json
from src.cosmos import create_jobresult, update_job, get_job, get_setting
import logging



class Processor:
    def __init__(self, job, files:list, system_prompt_file_name: str) -> None:
        self.job = job
        self.files = files

        self.topicId = job["topicId"]
        self.jobId = job["id"]
        self.jobType = job["jobType"]

        self.system_prompt = open(
            join(dirname(realpath(__file__)), "prompts", system_prompt_file_name)
        ).read()
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
    
    def process(self):
        raise NotImplementedError("Subclasses must implement this method")
    
    def log_usage(self, usage):
        self.usage["completion_tokens"] += usage["completion_tokens"]
        self.usage["prompt_tokens"] += usage["prompt_tokens"]
        self.usage["total_tokens"] += usage["total_tokens"]
        return

