import os
from .topics_client import TopicsCosmosClient
from .threads_client import TopicThreadsCosmosClient
from .files_client import TopicFilesCosmosClient
from .users_client import UsersCosmosClient

ENDPOINT = os.getenv("AZURE_COSMOSDB_ENDPOINT")
API_KEY = os.getenv("AZURE_COSMOSDB_API_KEY")
DATABASE = os.getenv("AZURE_COSMOSDB_DATABASE")
COLLECTION_USERS = os.getenv("AZURE_COSMOSDB_COLLECTION_USERS")
COLLECTION_TOPICS = os.getenv("AZURE_COSMOSDB_COLLECTION_TOPICS")
STORAGE_ACCOUNT = os.getenv("AZURE_STORAGE_ACCOUNT")
STORAGE_KEY = os.getenv("AZURE_STORAGE_KEY")
STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")


usersCosmosClient = UsersCosmosClient(ENDPOINT,API_KEY,DATABASE, COLLECTION_USERS)
topicsCosmosClient = TopicsCosmosClient(ENDPOINT,API_KEY,DATABASE, COLLECTION_TOPICS,userClient=usersCosmosClient)
threadsCosmosClient = TopicThreadsCosmosClient(ENDPOINT,API_KEY,DATABASE, COLLECTION_TOPICS)
filesCosmosClient = TopicFilesCosmosClient(
    ENDPOINT,API_KEY,DATABASE, COLLECTION_TOPICS,
    STORAGE_ACCOUNT,STORAGE_KEY,STORAGE_CONTAINER,
)

__all__ = [
    "topicsCosmosClient",
    "threadsCosmosClient",
    "filesCosmosClient",
    "usersCosmosClient",
]