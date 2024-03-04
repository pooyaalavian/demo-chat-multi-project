from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import usersCosmosClient

users = Blueprint("users", __name__)



@users.get("/<userId>")
async def get_user_info(userId: str):
    user = await usersCosmosClient.get_by_id(userId, userId)
    return jsonify(user)
