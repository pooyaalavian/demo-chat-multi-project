from dotenv import load_dotenv
import os
load_dotenv()

from azure.cosmos import CosmosClient


def main():
    cosmosdb_client: CosmosClient = CosmosClient(
                os.getenv('AZURE_COSMOSDB_ENDPOINT'), 
                credential=os.getenv('AZURE_COSMOSDB_API_KEY')
            )
    database_client = cosmosdb_client.get_database_client(
        os.getenv('AZURE_COSMOSDB_DATABASE')
    )
    settings_client = database_client.create_container_if_not_exists(
        id=os.getenv('AZURE_COSMOSDB_COLLECTION_SETTINGS'),
        partition_key=('/id')
    )
    print('settings_client:',settings_client)
    users_client = database_client.create_container_if_not_exists(
        id=os.getenv('AZURE_COSMOSDB_COLLECTION_USERS'),
        partition_key=('/userId')
    )
    print('users_client:',users_client)
    topics_client = database_client.create_container_if_not_exists(
        id=os.getenv('AZURE_COSMOSDB_COLLECTION_TOPICS'),
        partition_key=('/topicId')
    )
    print('topics_client:',topics_client)
    settings = database_client.get_container_client(os.getenv('AZURE_COSMOSDB_COLLECTION_SETTINGS'))
    settings.upsert_item({
        "id":"homepage",
        "content":"""# Welcome to The tool"""
    })
    
if __name__ == "__main__":
    main()