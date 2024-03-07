from dataclasses import dataclass
from .base import BaseClient
from .users_client import UsersCosmosClient
from typing import Literal

@dataclass
class Topic:
    topicId: str
    type: Literal["topic"]
    name: str
    description: str
    ownerIds: list[str]
    memberIds: list[str]

class TopicsCosmosClient(BaseClient):
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
            type="topic",
            partition_key="topicId",
            id_as_partition_key=True,
        )
        self.userClient = userClient

    async def get_topics_owned_by_userid(self, userId: str):
        query = f"""SELECT distinct c 
        FROM c JOIN owner IN c.ownerIds WHERE owner = @userId
        """
        return await self.query(query=query,params=[{"name":"@userId","value":userId}])
    
    async def get_topics_accessible_by_userid(self, userId: str):
        query = f"""SELECT distinct c 
        FROM c JOIN reader IN c.memberIds WHERE reader = @userId
        """
        return await self.query(query=query,params=[{"name":"@userId","value":userId}])
    
    async def get_all_user_topics(self, userId: str, show_deleted: bool = False):
        delete_qry = "AND (NOT IS_DEFINED(c.deleted) OR c.deleted != true) " if not show_deleted else ""
        
        query = f"""SELECT * FROM c 
        WHERE c.type = 'topic'
        AND (ARRAY_CONTAINS(c.ownerIds, @userId) OR ARRAY_CONTAINS(c.memberIds, @userId))
        {delete_qry}
        """
        return await self.query(query=query,params=[{"name":"@userId","value":userId}])
