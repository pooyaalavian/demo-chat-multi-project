from dataclasses import dataclass
from .base import BaseClient
from .users_client import UsersCosmosClient
from typing import Literal

@dataclass
class Job:
    topicId: str
    type: Literal["job"]
    name: str
    description: str

class JobsCosmosClient(BaseClient):
    def __init__(
        self,
        cosmosdb_endpoint: str,
        credential: any,
        database_name: str, 
        container_name :str,*,
        userClient: UsersCosmosClient
    ):
        super().__init__(
            cosmosdb_endpoint,
            credential,
            database_name,
            container_name,
            type="job",
            partition_key="topicId",
            id_as_partition_key=True,
        )
        self.userClient = userClient
