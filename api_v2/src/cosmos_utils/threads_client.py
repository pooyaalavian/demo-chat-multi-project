from .base import BaseClient
from dataclasses import dataclass
from typing import Literal


@dataclass
class TopicThread:
    threadId: str
    type: Literal["thread"]
    topicId: str
    title: str
    authorId: str
    createdAt: str
    modifiedAt: str


class TopicThreadsCosmosClient(BaseClient):
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
            type="thread",
            partition_key="topicId",
        )

