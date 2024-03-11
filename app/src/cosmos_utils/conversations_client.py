from .base import BaseClient
from dataclasses import dataclass
from typing import Literal


@dataclass
class Conversation:
    conversationId: str
    type: Literal["conversation"]
    topicId: str
    title: str
    authorId: str
    createdAt: str
    modifiedAt: str


class ConversationCosmosClient(BaseClient):
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
            type="conversation",
            partition_key="topicId",
        )

