import uuid
from datetime import datetime
from azure.cosmos.aio import CosmosClient
from azure.cosmos import exceptions


class BaseClient:

    def __init__(
        self,
        cosmosdb_endpoint: str,
        credential: any,
        database_name: str,
        container_name: str,
        *,
        partition_key: str = None,
        id_as_partition_key: bool = False,
        type: str = None,
    ):
        self.cosmosdb_endpoint = cosmosdb_endpoint
        self.credential = credential
        self.database_name = database_name
        self.container_name = container_name
        self.partition_key = partition_key
        self.id_as_partition_key = id_as_partition_key
        self.type = type

        try:
            self.cosmosdb_client: CosmosClient = CosmosClient(
                self.cosmosdb_endpoint, credential=credential
            )
        except exceptions.CosmosHttpResponseError as e:
            if e.status_code == 401:
                raise ValueError("Invalid credentials") from e
            else:
                raise ValueError("Invalid CosmosDB endpoint") from e

        try:
            self.database_client = self.cosmosdb_client.get_database_client(
                database_name
            )
        except exceptions.CosmosResourceNotFoundError:
            raise ValueError("Invalid CosmosDB database name")

        try:
            self.container_client = self.database_client.get_container_client(
                container_name
            )
        except exceptions.CosmosResourceNotFoundError:
            raise ValueError("Invalid CosmosDB container name")

    async def ensure(self):
        if (
            not self.cosmosdb_client
            or not self.database_client
            or not self.container_client
        ):
            return False, "CosmosDB client not initialized correctly"

        try:
            database_info = await self.database_client.read()
        except:
            return (
                False,
                f"CosmosDB database {self.database_name} on account {self.cosmosdb_endpoint} not found",
            )

        try:
            container_info = await self.container_client.read()
        except:
            return False, f"CosmosDB container {self.container_name} not found"

        return True, "CosmosDB client initialized successfully"

    async def create(self, doc: dict):
        id = str(uuid.uuid4())
        document = {
            "id": id,
            "type": self.type,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            **doc,
        }
        if self.id_as_partition_key:
            document[self.partition_key] = id

        ## TODO: add some error handling based on the output of the upsert_item call
        resp = await self.container_client.upsert_item(document)
        if resp:
            return resp
        else:
            return False

    async def upsert(self, doc: dict):
        document = {
            "type": self.type,
            "updatedAt": datetime.now().isoformat(),
            **doc,
        }
        resp = await self.container_client.upsert_item(document)
        if resp:
            return resp
        else:
            return False

    async def delete(self, partition_key, id):
        document = await self.container_client.read_item(
            item=id,
            partition_key=partition_key,
        )
        if document:
            if document.get("type") != self.type:
                raise ValueError(
                    f"Cannot delete document with this client. Detected {document.get('type')} instead of {self.type}"
                )
            resp = await self.container_client.delete_item(
                item=id, partition_key=partition_key
            )
            return resp
        else:
            return True

    async def soft_delete(self, partition_key, id):
        document = await self.container_client.read_item(
            item=id, partition_key=partition_key
        )
        if document:
            if document.get("type") != self.type:
                raise ValueError(
                    f"Cannot delete document with this client. Detected {document.get('type')} instead of {self.type}"
                )
            resp = await self.container_client.patch_item(
                document, partition_key, 
                [{"op": "add", "path": "/deleted", "value": True}]
            )
            return resp
        else:
            return True
    
    async def get_by_id(self, partition_key, id):
        document = await self.container_client.read_item(
            item=id, partition_key=partition_key
        )
        if document:
            if document.get("type") != self.type:
                raise ValueError(
                    f"Cannot get document with this client. Detected {document.get('type')} instead of {self.type}"
                )
            return document
        raise ValueError(f"Document with id {id} not found")

    async def get_all(self, *, partition_key=None, get_deleted_records=False):
        query = "SELECT * FROM c WHERE c.type = @type"
        if get_deleted_records==False:
            query += " AND NOT IS_DEFINED(c.deleted)"
        params = [{"name": "@type", "value": self.type}]
        # if partition_key:
        #     query += f" AND c.{self.partition_key} = @partition_key"
        #     params.append({"name": "@partition_key", "value": partition_key})
        return await self.query(query=query, params=params, partition_key=partition_key)

    async def query(self, *, query: str, params: list, partition_key=None):
        documents = []
        async for doc in self.container_client.query_items(
            query=query, parameters=params, partition_key=partition_key
        ):
            if doc.get("id") is not None:
                documents.append(doc)
            else:
                for key in doc:
                    unwrapped_doc = doc[key]
                    documents.append(unwrapped_doc)
        return documents
    
    async def patch(self, partition_key, id, patches: list):
        document = await self.container_client.patch_item(id, partition_key, patches)
        return document
