from quart import Blueprint, jsonify, request
from quart_schema import validate_response, validate_request
from src.cosmos_utils import usersCosmosClient

settings  = Blueprint("settings", __name__)



@settings.get("/frontend")
async def get_frontend_settings():
    return jsonify({
        
    })
