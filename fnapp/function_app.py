import azure.functions as func
import logging
import json
from src.cosmos import get_job, get_file
from src.long_question_processor import LongQuestionProcessor

app = func.FunctionApp()


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
    logging.info(f"Processing {topicId}/jobs/{jobId}")
    job = get_job(topicId, jobId)
    files = [get_file(topicId, f['fileId']) for f in job["selectedFiles"]]
    processor = LongQuestionProcessor(job, files)
    processor.process()

@app.service_bus_queue_trigger(
    arg_name="azservicebus", 
    queue_name="file_uploads",
    connection="ServiceBusConnStr", 
    is_sessions_enabled=True
) 
def file_upload_handler(azservicebus: func.ServiceBusMessage):
    logging.info('Python ServiceBus Queue trigger processed a message: %s',
                azservicebus.get_body().decode('utf-8'))
