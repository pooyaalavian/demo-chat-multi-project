from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import usersCosmosClient
from src.ai_search import get_search_client

search  = Blueprint("search", __name__)



@search.get("/<topicId>/<searchId>")
async def get_frontend_settings(topicId:str, searchId:str):
    client = get_search_client(f'idx-{topicId}')
    try:
        result = client.get_document(searchId)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error":str(e)}), 404
