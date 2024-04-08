import azure.functions as func
import logging
import json

app = func.FunctionApp()

class LongQuestion:
    def __init__(self, msg: func.ServiceBusMessage):
        self._msg = msg
        self.enqueued_time = msg.enqueued_time_utc
        payload = json.loads(msg.get_body().decode('utf-8'))
        self.topicId = payload["topicId"]
        self.taskId = payload["taskId"]
        
        

    def __str__(self):
        return f"Question: {self.question}, Question ID: {self.question_id}"

@app.service_bus_queue_trigger(arg_name="azservicebus", queue_name="long_questions",
                               connection="SERVICEBUS", is_sessions_enabled=True) 
def long_message_handler(azservicebus: func.ServiceBusMessage):
    body = azservicebus.get_body().decode('utf-8')
    
    logging.info('Python ServiceBus Queue trigger processed a message: %s',body)


@app.service_bus_queue_trigger(arg_name="azservicebus", queue_name="file_uploads",
                               connection="SERVICEBUS", is_sessions_enabled=True) 
def file_upload_handler(azservicebus: func.ServiceBusMessage):
    logging.info('Python ServiceBus Queue trigger processed a message: %s',
                azservicebus.get_body().decode('utf-8'))
