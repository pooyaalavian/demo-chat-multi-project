from openai import AsyncAzureOpenAI, APITimeoutError
import os
import asyncio

oai_client = AsyncAzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
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