from dataclasses import dataclass
from typing import Optional
from quart import Quart, jsonify, Response, request

# from quart_schema import QuartSchema, validate_request, validate_response
from quart_cors import cors
from src.cosmos_utils import usersCosmosClient

app = Quart(__name__)
# QuartSchema(app)
# app = cors(app, allow_origin=["*","http://localhost:5173"], allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])


@dataclass
class IWelcomeResponse:
    message: str
    error: Optional[str] = None


@app.route("/")
# @validate_response(IWelcomeResponse, 200)
async def welcome():
    print("welcome")
    return {"message": "Welcome to our quart app!"}


@app.before_request
async def extract_user():
    request.userId = None
    request.user = None
    try:
        authn = request.headers["Authorization"]
        token = authn.split("Bearer ")[1]
        request.userId = token
        request.user = await usersCosmosClient.get_by_id(token, token)
    except:
        pass


from .api.topic import topics
from .api.file import files
from .api.thread import threads
from .api.user import users

app.register_blueprint(topics, url_prefix="/api/topics")
app.register_blueprint(files, url_prefix="/api/topics/<topicId>/files")
app.register_blueprint(threads, url_prefix="/api/topics/<topicId>/threads")
app.register_blueprint(users, url_prefix="/api/users")

app = cors(app, allow_origin="*")


if __name__ == "__main__":
    app.run(port=5000, debug=True)
