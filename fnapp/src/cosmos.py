import os 
from azure.cosmos import CosmosClient

cosmosdb_client: CosmosClient = CosmosClient(
    os.getenv('CosmosDbEndpoint'), 
    credential=os.getenv('CosmosDbApiKey')
)
container_client = (
    cosmosdb_client
        .get_database_client(os.getenv('CosmosDbDatabaseName'))
        .get_container_client(os.getenv('CosmosDbCollectionName'))
)
settings_container_client = (
    cosmosdb_client
        .get_database_client(os.getenv('CosmosDbDatabaseName'))
        .get_container_client(os.getenv('CosmosDbSettingsCollectionName'))
)

def get_job(topicId, jobId):
    results = container_client.query_items(
        f"SELECT * FROM c WHERE c.type='job' AND c.id = @jobId",
        [ {"name": "@jobId", "value": jobId}],
        topicId
    )
    for item in results:
        return item
    raise ValueError(f"Job {jobId} not found")

def update_job(topicId, jobId, patches):
    container_client.patch_item(jobId, topicId, patches)

def create_jobresult(topicId, jobId, page, result, usage, **kwargs):
    container_client.create_item(
        {
            "id": f"{jobId}-{kwargs['file']['id']}-{page}",
            "type": "jobresult",
            "topicId": topicId,
            "jobId": jobId,
            "page": page,
            "result": result,
            "usage": usage,
            **kwargs
        }
    )

def get_file(topicId, fileId):
    results = container_client.query_items(
        f"SELECT * FROM c WHERE c.type='file' AND c.id = @fileId",
        [ {"name": "@fileId", "value": fileId}],
        topicId
    )
    ans = []
    for item in results:
        return item
    raise ValueError(f"File {fileId} not found")

def get_setting(setting):
    results = settings_container_client.query_items(
        f"SELECT * FROM c WHERE c.id = @setting",
        [ {"name": "@setting", "value": setting}],
        setting
    )
    for item in results:
        return item
    raise ValueError(f"App setting {setting} not found")

