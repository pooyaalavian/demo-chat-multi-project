from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
import os 
from src.file_handler import FileHandler
from src.cosmos_utils import filesCosmosClient
from src.ai_search import search_by_document_id, delete_records_by_id
from azure.storage.blob import generate_blob_sas
from datetime import datetime, timedelta
import asyncio
import re 

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


def get_step(progress_list, step:str):
    for p in progress_list:
        if p['step'] == step:
            return p
    return None

def extract_n_paragraphs(text):
    match = re.search(r'Created (\d+) paragraph', text)
    if match:
        return int(match.group(1))
    return None

def extract_n_tables(text):
    match = re.search(r'and (\d+) table', text)
    if match:
        return int(match.group(1))
    return None

@files.delete("/<fileId>")
async def topic_delete_file(topicId: str, fileId: str):
    file = await filesCosmosClient.get_by_id(topicId, fileId)
    progress = file.get('progress') or []

    # Delete AI Search docs
    if get_step(progress, "upload_to_ai_search"):
        print('deleting from ai search')
        record_id_format = '{name}-{obj_type}-{number}'
        name = file['file_blob_path'].split('/')[-1].split('.')[0]
        txt = get_step(progress, "perform_chunking")['message']
        n_p = extract_n_paragraphs(txt)
        n_t = extract_n_tables(txt)
        records = []
        if n_p and n_p>0:
            records = [record_id_format.format(name=name, obj_type='p', number=i) for i in range(n_p)]
            print(records[-1])
        if n_t and n_t>0:
            records += [record_id_format.format(name=name, obj_type='t', number=i) for i in range(n_t)]
            print(records[-1])
        delete_records_by_id(topicId, records)
    
    # Delete blobs for doc intelligence
    if get_step(progress, "upload_doc_intelligence"):
        print('deleting from doc intelligence')
        file_paths = file['doc_intel']
        if type(file_paths) == str:
            file_paths = [file_paths]
        for file_path in file_paths:
            print(file_path)
            await filesCosmosClient.delete_blob(topicId, file_path)
    
    # Delete Blob for raw file from storage
    if get_step(progress, "upload_to_blob"):
        print('deleting raw blob')
        file_paths = file['file']
        if type(file_paths) == str:
            file_paths = [file_paths]
        for file_path in file_paths:
            print(file_path)
            await filesCosmosClient.delete_blob(topicId, file_path)
    
    # Delete record from cosmos
    await filesCosmosClient.delete(topicId, fileId)
    
    return jsonify({"message": f"delete file: {fileId} from topic: {topicId}"})
