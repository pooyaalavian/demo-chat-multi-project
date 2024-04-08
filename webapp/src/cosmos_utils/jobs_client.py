from dataclasses import dataclass
from .base import BaseClient
from typing import Literal
import json 
from azure.servicebus.aio import ServiceBusClient
from azure.servicebus import ServiceBusMessage

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
        container_name :str,
        SERVICE_BUS_CONNECTION_STRING: str,
        SERVICE_BUS_QUEUE_NAME: str,
    ):
        super().__init__(
            cosmosdb_endpoint,
            credential,
            database_name,
            container_name,
            type="job",
            partition_key="topicId",
        )
        self.SERVICE_BUS_CONNECTION_STRING = SERVICE_BUS_CONNECTION_STRING
        self.SERVICE_BUS_QUEUE_NAME = SERVICE_BUS_QUEUE_NAME


    async def submit_to_service_bus(self, topicId: str, jobId: str):
        sb_client = ServiceBusClient.from_connection_string(conn_str=self.SERVICE_BUS_CONNECTION_STRING,logging_enable=True)
        sb_sender = sb_client.get_queue_sender(queue_name=self.SERVICE_BUS_QUEUE_NAME)
        payload = json.dumps({"topicId": topicId, "jobId": jobId})
        async with sb_sender as sender:
            message = ServiceBusMessage(payload, session_id="1")
            await sender.send_messages(message)
    
    async def get_job_results(self, topicId:str, jobId: str):
        results = await self.query(
            query=f"SELECT * FROM c WHERE c.type=@type AND c.jobId=@jobId",
            params=[
                {"name":"@type","value":"jobresult"},
                {"name":"@jobId","value":jobId}
            ],
            partition_key=topicId
        )
        return results   
    
    async def delete_job_results(self, topicId:str, jobId: str):
        results = await self.query(
            query=f"SELECT * FROM c WHERE c.type=@type AND c.jobId=@jobId",
            params=[
                {"name":"@type","value":"jobresult"},
                {"name":"@jobId","value":jobId}
            ],
            partition_key=topicId
        )
        for r in results:
            print(f'deleting job result {r["id"]}')
            await self.container_client.delete_item( r['id'], topicId)
        return results        