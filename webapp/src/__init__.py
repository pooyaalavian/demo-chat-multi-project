__version__ = "1.5.0"


from quart import Quart, request, send_from_directory, render_template, send_file,jsonify
# from quart_schema import QuartSchema, validate_request, validate_response
from quart_cors import cors
from src.cosmos_utils import usersCosmosClient, settingsCosmosClient
import os 
import requests
from datetime import datetime, timedelta

app = Quart(__name__, static_folder="../static", template_folder="../static")
# QuartSchema(app)
# app = cors(app, allow_origin=["*","http://localhost:5173"], allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
APP_TITLE = os.getenv('APP_TITLE', "My App")

async def render_index():
    return await render_template(
        'index.html', 
        title=APP_TITLE, 
        favicon="/vite.svg",
        serverVersion=__version__,
        clientId=os.getenv("ENTRA_CLIENT_ID"),
        tenantId=os.getenv("ENTRA_TENANT_ID"),    
    )

@app.route("/")
async def render_root():
    return await render_index()

@app.route("/favicon.ico")
async def render_favicon():
    return await send_file('static/vite.svg')

@app.route('/assets/<path:path>')
async def send_static_folder(path):
    return await send_from_directory('static/assets', path)

@app.route('/img/<path:path>')
async def send_static_image(path):
    return await send_from_directory('static/img', path)

cached_version = {"webapp": __version__,}
@app.get('/api/settings/version')
async def send_version():
    global cached_version
    fetched_before = cached_version.get("_fnapp_fetch_ts") is not None
    fetch_too_old = fetched_before and cached_version.get("_fnapp_fetch_ts") < datetime.now() - timedelta(hours=1)
    
    if not fetched_before or fetch_too_old:
        url = os.getenv("AZURE_FNAPP_ENDPOINT", None)
        if url is not None:
            res = requests.get(f"{url}/api/version")
            cached_version['fnapp'] = res.text
            cached_version['_fnapp_fetch_ts'] = datetime.now()
    payload = {k:v for k,v in cached_version.items() if not k.startswith("_")}  
    return jsonify(payload)

@app.get('/api/settings/<settingid>')
async def send_settings(settingid):
    if settingid not in ["homepage"]:
        return jsonify({})
    setting = await settingsCosmosClient.get_by_id(settingid, settingid)
    return jsonify(setting)


from src.extract_user import extractUser
@app.before_request
async def append_user_info():
    request.authenticated = False
    request.userId = None
    request.user = None
    try:
        token = request.headers.get("Authorization").split(" ")[1]
        user = await extractUser(token)
        if user:
            request.authenticated = True
            request.userId = user["userId"]
            request.user = await usersCosmosClient.upsert(user)            
    except:
        pass


from .api.topic import topics
from .api.file import files
from .api.conversation import conversations
from .api.job import jobs
from .api.user import users
from .api.settings import settings
from .api.search import search

app.register_blueprint(topics, url_prefix="/api/topics")
app.register_blueprint(files, url_prefix="/api/topics/<topicId>/files")
app.register_blueprint(conversations, url_prefix="/api/topics/<topicId>/conversations")
app.register_blueprint(jobs, url_prefix="/api/topics/<topicId>/jobs")
app.register_blueprint(users, url_prefix="/api/users")
app.register_blueprint(settings, url_prefix="/api/settings")
app.register_blueprint(search, url_prefix="/api/search")

@app.route('/<path:path>')
async def catch_all(path):
    return await render_index()

app = cors(app, allow_origin="*")


if __name__ == "__main__":
    app.run(port=5000, debug=True)
