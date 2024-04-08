from dotenv import load_dotenv
load_dotenv()
from src import app

if __name__ == "__main__":
    app.run(port=5000, debug=False)
    