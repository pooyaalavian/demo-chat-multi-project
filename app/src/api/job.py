from quart import Blueprint, jsonify, request
from src.cosmos_utils import filesCosmosClient
from datetime import datetime, timedelta, UTC

jobs = Blueprint("jobs", __name__)


# working with chunking, doc intelligence
@jobs.post("/")
async def topic_create_job(topicId: str):
    data = await request.get_data()
    return jsonify({})


@jobs.get("/")
async def get_jobs(topicId: str):
    files = await filesCosmosClient.get_all(partition_key=topicId)
    return jsonify(files)


@jobs.get("/<jobId>")
async def get_job_by_id(topicId: str, jobId: str):
    file = await filesCosmosClient.get_by_id(topicId, jobId)
    return jsonify(file)


@jobs.delete("/<jobId>")
async def topic_delete_job(topicId: str, jobId: str):
    file = await filesCosmosClient.get_by_id(topicId, jobId)
    return jsonify({"message": f"delete file: {jobId} from topic: {topicId}"})
