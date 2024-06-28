import os
from .topics_client import TopicsCosmosClient
from .conversations_client import ConversationCosmosClient
from .files_client import TopicFilesCosmosClient
from .jobs_client import JobsCosmosClient
from .users_client import UsersCosmosClient
from .base import BaseClient

ENDPOINT = os.getenv("AZURE_COSMOSDB_ENDPOINT")
#API_KEY = os.getenv("AZURE_COSMOSDB_API_KEY")
DATABASE = os.getenv("AZURE_COSMOSDB_DATABASE")
COLLECTION_USERS = os.getenv("AZURE_COSMOSDB_COLLECTION_USERS")
COLLECTION_TOPICS = os.getenv("AZURE_COSMOSDB_COLLECTION_TOPICS")
COLLECTION_SETTINGS = os.getenv("AZURE_COSMOSDB_COLLECTION_SETTINGS")
STORAGE_ACCOUNT = os.getenv("AZURE_STORAGE_ACCOUNT")
STORAGE_KEY = os.getenv("AZURE_STORAGE_KEY")
STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER")
SERVICE_BUS_CONNECTION_STRING = os.getenv("AZURE_SERVICE_BUS_CONNECTION_STRING") 
SERVICE_BUS_QUEUE_NAME = os.getenv("AZURE_SERVICE_BUS_QUEUE_NAME")
SERVICE_BUS_NAMESPACE = os.getenv("AZURE_SERVICE_BUS_NAMESPACE")

from azure.identity import DefaultAzureCredential

# Initialize Managed Identity credentials
credentials = DefaultAzureCredential()

usersCosmosClient = UsersCosmosClient(ENDPOINT,credentials,DATABASE, COLLECTION_USERS)
topicsCosmosClient = TopicsCosmosClient(ENDPOINT,credentials,DATABASE, COLLECTION_TOPICS,userClient=usersCosmosClient)
conversationsCosmosClient = ConversationCosmosClient(ENDPOINT,credentials,DATABASE, COLLECTION_TOPICS)
filesCosmosClient = TopicFilesCosmosClient(
    ENDPOINT,credentials,DATABASE, COLLECTION_TOPICS,
    STORAGE_ACCOUNT,STORAGE_KEY,credentials,STORAGE_CONTAINER,
)
jobsCosmosClient = JobsCosmosClient(ENDPOINT,credentials,DATABASE, COLLECTION_TOPICS, SERVICE_BUS_NAMESPACE, SERVICE_BUS_QUEUE_NAME)
settingsCosmosClient = BaseClient(ENDPOINT,credentials,DATABASE, COLLECTION_SETTINGS)

__all__ = [
    "topicsCosmosClient",
    "conversationsCosmosClient",
    "filesCosmosClient",
    "jobsCosmosClient",
    "usersCosmosClient",
    "settingsCosmosClient",
]