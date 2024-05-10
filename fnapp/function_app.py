__VERSION__ = "1.3.1"

import azure.functions as func
import logging
import json
from src.cosmos import get_job, get_file
from src.long_question_processor import LongQuestionProcessor

app = func.FunctionApp()


def handle_job(topicId, jobId):
    logging.info(f"Processing {topicId}/jobs/{jobId}")
    job = get_job(topicId, jobId)
    files = [get_file(topicId, f['fileId']) for f in job["selectedFiles"]]
    processor = LongQuestionProcessor(job, files)
    processor.process()
    return processor

@app.service_bus_queue_trigger(
    arg_name="azservicebus", 
    queue_name="long_questions", 
    connection="ServiceBusConnStr", 
    is_sessions_enabled=True
) 
def long_message_handler(azservicebus: func.ServiceBusMessage):
    body = azservicebus.get_body().decode('utf-8')
    payload = json.loads(body)
    topicId = payload["topicId"]
    jobId = payload["jobId"]
    handle_job(topicId, jobId)
    

@app.service_bus_queue_trigger(
    arg_name="azservicebus", 
    queue_name="file_uploads",
    connection="ServiceBusConnStr", 
    is_sessions_enabled=True
) 
def file_upload_handler(azservicebus: func.ServiceBusMessage):
    logging.info('Python ServiceBus Queue trigger processed a message: %s',
                azservicebus.get_body().decode('utf-8'))


@app.route(route="version", auth_level=func.AuthLevel.ANONYMOUS)
def get_fn_version(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request for /api/version.')

    return func.HttpResponse(__VERSION__,status_code=200)


@app.route(route="process_job", auth_level=func.AuthLevel.ANONYMOUS)
def get_fn_process(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request for /api/process_job.')
    topicId = req.params.get('topicId')
    jobId = req.params.get('jobId')
    processor = handle_job(topicId, jobId)
    job = json.dumps(processor.job)
    return func.HttpResponse(job, status_code=200)


@app.route(route="file_info", auth_level=func.AuthLevel.ANONYMOUS)
def get_file_info(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request for /api/file_info.')
    filepath = req.params.get('path')
    from src.fileinfo_processor import FileInfoProcessor
    processor = FileInfoProcessor(filepath)
    obj = processor.process()
    return func.HttpResponse(json.dumps(obj), status_code=200, mimetype='application/json')
