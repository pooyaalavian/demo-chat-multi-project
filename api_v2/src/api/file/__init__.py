from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
import os 
from src.file_handler import FileHandler
from src.cosmos_utils import filesCosmosClient

files = Blueprint("files", __name__)


# working with chunking, doc intelligence
@files.post("/")
async def topic_add_file(topicId: str):
    data = await request.get_data()
    filename = request.headers["filename"]
    os.makedirs(f'tmp/{topicId}', exist_ok=True)
    fileHandler = FileHandler(topicId=topicId, filename=filename, fileClient=filesCosmosClient)
    result = await fileHandler(data)
    return jsonify(result.logs)


@files.get("/")
async def get_files(topicId: str):
    files = await filesCosmosClient.get_all(partition_key=topicId)
    return jsonify(files)



@files.delete("/<fileId>")
async def topic_delete_file(topicId: str, fileId: str):
    return jsonify({"message": f"delete file: {fileId} from topic: {topicId}"})
