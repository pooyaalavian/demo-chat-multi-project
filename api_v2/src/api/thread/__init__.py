import asyncio
from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import threadsCosmosClient
from src.chat_handler import ChatHandler

threads = Blueprint("threads", __name__)


@threads.post("/")
async def create_thread(topicId: str):
    body = await request.get_json()
    userId = request.userId
    
    payload = {
        "type": "thread",
        "topicId": topicId,
        "name": body["name"],
        "description": body["description"],
        "ownerId": userId,
    }
    doc = await threadsCosmosClient.create(payload)
    return jsonify(doc)
    # return jsonify({"message": f"created thread in topic: {topicId}"})


@threads.get("/")
async def get_topic_threads(topicId:str):
    docs = await threadsCosmosClient.get_all(partition_key=topicId) 
    return jsonify(docs)


@threads.get("/<threadId>")
async def get_thread_by_id(topicId:str, threadId:str):
    docs = await threadsCosmosClient.get_by_id(partition_key=topicId, id=threadId)
    return jsonify(docs)
    # return jsonify({"message": f"get {topicId}/{threadId}"})


# openai
@threads.post("/<threadId>/chat")
async def chat_with_thread(topicId:str, threadId:str):
    body = await request.get_json()
    message = {
        "content":body["message"],
        "role":"user",
        "agent":"human",
        "name": request.user.get("name"),
        "userId": request.userId,
    }
    chatHandler = ChatHandler(threadsCosmosClient, topicId, threadId, message)
    thread = await chatHandler()
    return jsonify(thread)
    # return jsonify({"message": f"chat with {topicId}/{threadId}", "payload": payload})


@threads.delete("/<threadId>")
async def delete_thread(topicId:str, threadId:str):
    feedback = await threadsCosmosClient.delete(partition_key=topicId, id=threadId)
    if feedback:
        return jsonify({"message": f"deleted thread {topicId}/{threadId}"})
    else:
        return jsonify({"message": f"delete thread {topicId}/{threadId} did not work"})
