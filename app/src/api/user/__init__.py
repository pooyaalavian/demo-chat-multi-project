from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import usersCosmosClient

users = Blueprint("users", __name__)


# working with chunking, doc intelligence
@users.post("/")
async def create_user():
    body = await request.get_json()
    email = body["email"]
    name = body["name"]
    payload = {
        "name": name,
        "email": email,
    }
    user = await usersCosmosClient.create(payload)
    return jsonify(user)



@users.delete("/<userId>")
async def get_user_info(userId: str):
    return jsonify({"message": f"delete file: {fileId} from topic: {topicId}"})
