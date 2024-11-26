from dataclasses import dataclass
from .base import BaseClient
from typing import Literal
import json
from azure.servicebus.aio import ServiceBusClient
from azure.servicebus import ServiceBusMessage

from azure.identity.aio import DefaultAzureCredential


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
        SERVICE_BUS_NAMESPACE: str,
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
        self.SERVICE_BUS_NAMESPACE = SERVICE_BUS_NAMESPACE
        self.SERVICE_BUS_QUEUE_NAME = SERVICE_BUS_QUEUE_NAME


    async def submit_to_service_bus(self, topicId: str, jobId: str):
        # Initialize Managed Identity credentials
        credentials = DefaultAzureCredential()

        #sb_client = ServiceBusClient.from_connection_string(conn_str=self.SERVICE_BUS_CONNECTION_STRING,logging_enable=True)
        sb_client = ServiceBusClient(
            fully_qualified_namespace=self.SERVICE_BUS_NAMESPACE,
            credential=credentials,
            logging_enable=True
        )

        async with sb_client:
            sb_sender = sb_client.get_queue_sender(queue_name=self.SERVICE_BUS_QUEUE_NAME)
            
            payload = json.dumps({"topicId": topicId, "jobId": jobId})
            
            #with sb_sender as sender:
            async with sb_sender:
                message = ServiceBusMessage(payload, session_id="1")
                await sb_sender.send_messages(message)

        await credentials.close()
    
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
    
    async def get_job_result(self, topicId:str, resultId: str):
        results = await self.query(
            query=f"SELECT * FROM c WHERE c.type=@type AND c.id=@resultId",
            params=[
                {"name":"@type","value":"jobresult"},
                {"name":"@resultId","value":resultId}
            ],
            partition_key=topicId
        )
        return results[0] if results else None 
    
    async def delete_finding_from_job_result(self, topicId:str, resultId: str, findingId: str):
        results = await self.container_client.patch_item(resultId, topicId, [
            {"op":"remove","path": f"/result/findings/{findingId}"}
        ])
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