from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
import os 
from src.file_handler import FileHandler
from src.cosmos_utils import filesCosmosClient
from src.ai_search import search_by_document_id
from azure.storage.blob import generate_blob_sas
from datetime import datetime, timedelta
import asyncio

files = Blueprint("files", __name__)


# working with chunking, doc intelligence
@files.post("/")
async def topic_add_file(topicId: str):
    data = await request.get_data()
    filename = request.headers["filename"]
    os.makedirs(f'tmp/{topicId}', exist_ok=True)
    fileHandler = FileHandler(topicId=topicId, filename=filename, fileClient=filesCosmosClient, user=request.user)
    await fileHandler.prepare(data)
    asyncio.create_task( fileHandler.main_task())
    return jsonify(fileHandler.file_object)


@files.get("/")
async def get_files(topicId: str):
    files = await filesCosmosClient.get_all(partition_key=topicId)
    return jsonify(files)


@files.get("/sas-token")
async def get_file_sas(topicId: str):
    f = filesCosmosClient
    url = request.args.get('url')
    blob_name = url.split(f'/{f._storage_container_name}/',1)[1]
    result = generate_blob_sas(
        account_name=f._storage_account_name,
        container_name=f._storage_container_name,
        blob_name=blob_name,
        account_key=f._storage_account_key,
        permission="r",
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    return jsonify(result)


@files.get("/<fileId>")
async def get_file_from_refrence(topicId: str, fileId: str):
    file = await filesCosmosClient.get_by_id(topicId, fileId)
    return jsonify(file)



@files.delete("/<fileId>")
async def topic_delete_file(topicId: str, fileId: str):
    return jsonify({"message": f"delete file: {fileId} from topic: {topicId}"})
