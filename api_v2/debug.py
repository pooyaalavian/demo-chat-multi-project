from dotenv import load_dotenv
import os
load_dotenv()

from src import app

app.run(port=5000, debug=False)