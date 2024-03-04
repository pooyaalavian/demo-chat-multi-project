from quart import Quart, request, send_from_directory, render_template, send_file
# from quart_schema import QuartSchema, validate_request, validate_response
from quart_cors import cors
from src.cosmos_utils import usersCosmosClient

app = Quart(__name__, static_folder="../static", template_folder="../static")
# QuartSchema(app)
# app = cors(app, allow_origin=["*","http://localhost:5173"], allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])



@app.route("/")
async def render_index():
    return await render_template('index.html', title="Pooya's App", favicon="/vite.svg")

@app.route("/favicon.ico")
async def render_favicon():
    return await send_file('static/vite.svg')

@app.route('/assets/<path:path>')
async def send_static_folder(path):
    return await send_from_directory('static/assets', path)



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

@app.route('/<path:path>')
async def catch_all(path):
    return await render_template('index.html', title="Pooya's App", favicon="/vite.svg")

app = cors(app, allow_origin="*")


if __name__ == "__main__":
    app.run(port=5000, debug=True)
