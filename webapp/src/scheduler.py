from apscheduler.schedulers.background import BackgroundScheduler
import os 
from glob import glob

def delete_xlsx_files():
    print("Running delete_xlsx_files")
    glob_path = os.path.join(os.getcwd(), '**', '*.xlsx')
    for f in glob(glob_path, recursive=True):
        print(f)
        os.remove(f)

def schedule_task(job_fn:callable, interval_mins:int=30):
    print(f"Scheduling task {job_fn.__name__} every {interval_mins} minutes")
    scheduler = BackgroundScheduler()
    job = scheduler.add_job(job_fn, 'interval', minutes=interval_mins)
    scheduler.start()