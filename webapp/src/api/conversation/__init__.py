import asyncio
from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import conversationsCosmosClient
from src.chat_handler import ChatHandler

conversations = Blueprint("conversations", __name__)


@conversations.post("/")
async def create_conversation(topicId: str):
    body = await request.get_json()
    userId = request.userId
    
    payload = {
        "type": "conversation",
        "topicId": topicId,
        "name": body["name"],
        "description": body["description"],
        "ownerId": userId,
        "messages": [],
        "usage":[],
    }
    doc = await conversationsCosmosClient.create(payload)
    return jsonify(doc)
    # return jsonify({"message": f"created conversation in topic: {topicId}"})


@conversations.get("/")
async def get_topic_conversations(topicId:str):
    docs = await conversationsCosmosClient.get_all(partition_key=topicId) 
    return jsonify(docs)


@conversations.get("/<conversationId>")
async def get_conversation_by_id(topicId:str, conversationId:str):
    docs = await conversationsCosmosClient.get_by_id(partition_key=topicId, id=conversationId)
    return jsonify(docs)
    # return jsonify({"message": f"get {topicId}/{conversationId}"})


# openai
@conversations.post("/<conversationId>/chat")
async def chat_with_conversation(topicId:str, conversationId:str):
    body = await request.get_json()
    user_name = f"{request.user.get('firstName')} {request.user.get('lastName')}"
    message = {
        "content":body["message"],
        "role":"user",
        "agent":"human",
        "name": user_name,
        "userId": request.userId,
    }
    chatHandler = ChatHandler(conversationsCosmosClient, topicId, conversationId, message)
    conversation = await chatHandler()
    return jsonify(conversation)
    # return jsonify({"message": f"chat with {topicId}/{conversationId}", "payload": payload})


@conversations.delete("/<conversationId>")
async def delete_conversation(topicId:str, conversationId:str):
    feedback = await conversationsCosmosClient.delete(partition_key=topicId, id=conversationId)
    if feedback:
        return jsonify({"message": f"deleted conversation {topicId}/{conversationId}"})
    else:
        return jsonify({"message": f"delete conversation {topicId}/{conversationId} did not work"})
