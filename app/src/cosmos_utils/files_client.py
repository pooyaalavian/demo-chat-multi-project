from .base import BaseClient
from azure.storage.blob.aio import BlobServiceClient
from azure.core.credentials import AzureKeyCredential



class TopicFilesCosmosClient(BaseClient):
    def __init__(
        self,
        cosmosdb_endpoint: str,
        credential: any,
        database_name: str,
        cosmos_container_name: str,
        storage_account_name: str,
        storage_account_key: str,
        storage_container_name: str,
    ):
        super().__init__(
            cosmosdb_endpoint,
            credential,
            database_name,
            cosmos_container_name,
            type="file",
            partition_key="topicId",
        )
        self._storage_account_name = storage_account_name
        self._storage_container_name = storage_container_name
        self._storage_account_key = (storage_account_key)
        self._blob_service_client = BlobServiceClient(
            account_url=f"https://{self._storage_account_name}.blob.core.windows.net", 
            credential=self._storage_account_key
        )
    
    async def get_file(self, topicId:str, file_name: str):
        blob_client = self._blob_service_client.get_blob_client(
            container=self._storage_container_name,
            blob=f"{topicId}/{file_name}"
        )
        try:
            download_stream = await blob_client.download_blob()
            return download_stream.readall()
        except:
            return None
        
    async def upload_file(self, topicId:str, destination_path: str, data: bytes, friendly_name: str):
        if topicId not in destination_path:
            destination_path = f"{topicId}/{destination_path}"
            
        blob_client = self._blob_service_client.get_blob_client(
            container=self._storage_container_name,
            blob=destination_path
        )
        await blob_client.upload_blob(data,headers={'x-ms-blob-content-disposition': f'inline; filename="{friendly_name}"'})
            