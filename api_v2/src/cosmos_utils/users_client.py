from .base import BaseClient
from dataclasses import dataclass

@dataclass
class User:
    userId: str
    email: str
    firstName: str
    lastName: str
    ownerOfTopicIds: list[str]
    memberOfTopicIds: list[str]

class UsersCosmosClient(BaseClient):
    def __init__(
        self,
        cosmosdb_endpoint: str,
        credential: any,
        database_name: str,
        container_name: str,
    ):
        super().__init__(
            cosmosdb_endpoint,
            credential,
            database_name,
            container_name,
            type="user",
            partition_key="userId",
            id_as_partition_key=True,
        )

