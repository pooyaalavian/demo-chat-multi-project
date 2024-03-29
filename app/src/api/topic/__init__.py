import asyncio
from quart import Blueprint, jsonify, request

# from quart_schema import validate_response, validate_request
from .types import Topic, Conversation, Message
from src.cosmos_utils import topicsCosmosClient

topics = Blueprint("topics", __name__)


@topics.post("/")
# @validate_request(Topic)
async def create_topic():
    body = await request.get_json()

    userId = request.userId

    payload = {
        "type": "topic",
        "name": body["name"],
        "description": body["description"],
        "ownerIds": [userId],
        "memberIds": [],
    }

    doc = await topicsCosmosClient.create(payload)
    return jsonify(doc)


@topics.get("/")
# @validate_response(list[Topic])
async def get_topics():
    userId = request.userId
    if userId is None:
        return jsonify([])
    # docs1, docs2 = await asyncio.gather(
    #     topicsCosmosClient.get_topics_accessible_by_userid(userId),
    #     topicsCosmosClient.get_topics_owned_by_userid(userId),
    # )
    # return jsonify(docs1 + docs2)
    results = await topicsCosmosClient.get_all_user_topics(userId)
    return jsonify(results)


@topics.get("/<topicId>")
async def get_topic_details(topicId: str):
    topic = await topicsCosmosClient.get_by_id(topicId, topicId)
    return jsonify(topic)


@topics.delete("/<topicId>")
async def delete_topic(topicId: str):
    try:
        await topicsCosmosClient.soft_delete(topicId, topicId)
        return jsonify({"message": "Topic deleted"})
    except Exception as e:
        return jsonify({"message": f"Error deleting topic: {e}"}), 500
        


@topics.post("/<topicid>/search")
async def search_topic():
    return jsonify({"message": "Performing Search is not implemented yet"})
