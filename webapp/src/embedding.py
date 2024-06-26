from openai import AsyncAzureOpenAI, APITimeoutError
import os
import asyncio

from azure.identity import ManagedIdentityCredential, get_bearer_token_provider

# Initialize Managed Identity credentials
credentials = ManagedIdentityCredential()
token_provider = get_bearer_token_provider(credentials, "https://cognitiveservices.azure.com/.default")

oai_client = AsyncAzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_ad_token=token_provider #api_key=os.getenv("AZURE_OPENAI_API_KEY"),
)
CHAT_MODEL = os.getenv("AZURE_OPENAI_CHAT_MODEL")
EMBEDDING_MODEL = os.getenv("AZURE_OPENAI_EMBEDDING_MODEL")

async def get_content_embedding(content: str,*, retries:int=0)->list[float]:
    if not content:
        return None
    try:
        response = await oai_client.embeddings.create(
            input=[content],
            model=EMBEDDING_MODEL,
            timeout=20,
        )
        return response.data[0].embedding
    except APITimeoutError:
        await asyncio.sleep(1)
        if retries > 3:
            raise
        return await get_content_embedding(content, retries=retries+1)