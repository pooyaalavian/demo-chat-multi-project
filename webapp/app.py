from dotenv import load_dotenv
load_dotenv()
from src import app
from src.scheduler import schedule_task, delete_xlsx_files

if __name__ == "__main__":
    schedule_task(delete_xlsx_files, 30)
    app.run(port=5000, debug=False, use_reloader=False)
    