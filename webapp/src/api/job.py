from quart import Blueprint, jsonify, request, send_file, after_this_request
import os
from src.cosmos_utils import jobsCosmosClient
from datetime import datetime, timedelta, UTC
from src.job_download import generate_xlsx_from_job_results, process_job_results

jobs = Blueprint("jobs", __name__)


# working with chunking, doc intelligence
@jobs.post("/")
async def topic_create_job(topicId: str):
    body = await request.get_json()
    for key in ['question','selectedFiles']:
        if not body.get(key):
            return jsonify({"error": f"missing key {key}"}), 400
    if len(body["selectedFiles"]) == 0:
        return jsonify({"error": "selectedFiles must not be empty"}), 400
    
    
    
    payload = {
        "type": "job",
        "jobType":body.get("jobType",None), 
        "topicId": topicId,
        "llm": body.get("llm","gpt-35-turbo"),
        "question": body["question"],
        "systemPrompt": body.get("systemPrompt",None),
        "selectedFiles": body["selectedFiles"],
        "status":"queued", # "queued", "running", "completed", "failed
        "ownerId": request.userId,
        "usage":[],
    }
    doc = await jobsCosmosClient.create(payload)
    await jobsCosmosClient.submit_to_service_bus(topicId, doc["id"])
    return jsonify(doc)


@jobs.get("/")
async def get_jobs(topicId: str):
    jobs = await jobsCosmosClient.get_all(partition_key=topicId, get_deleted_records=False)
    return jsonify(jobs)


@jobs.get("/<jobId>")
async def get_job_by_id(topicId: str, jobId: str):
    job = await jobsCosmosClient.get_by_id(topicId, jobId)
    results = await jobsCosmosClient.get_job_results(topicId, jobId)
    job["results"] = results
    return jsonify(job)


@jobs.delete("/<jobId>")
async def topic_delete_job(topicId: str, jobId: str):
    await jobsCosmosClient.soft_delete(topicId, jobId)
    return jsonify({"message": f"delete file: {jobId} from topic: {topicId}"})


@jobs.put("/<jobId>")
async def resubmit_job(topicId: str, jobId: str):
    job = await jobsCosmosClient.get_by_id(topicId, jobId)
    if job['status'] in ['finished','failed']:
        pathes = [
            {'op':'add','path':'/status','value':'queued'},
            {'op':'add','path':'/updatedAt','value':datetime.now().isoformat()},
        ]
        if job.get('error'):
            pathes.append({'op':'remove','path':'/error'})    
        await jobsCosmosClient.patch(topicId,jobId, pathes)
        await jobsCosmosClient.delete_job_results(topicId, jobId)
        await jobsCosmosClient.submit_to_service_bus(topicId, jobId)
    job = await jobsCosmosClient.get_by_id(topicId, jobId)
    results = await jobsCosmosClient.get_job_results(topicId, jobId)
    job["results"] = results
    return jsonify(job)

@jobs.get("/<jobId>/results.xlsx")
async def get_job_results_xlsx(topicId: str, jobId: str):
    job = await jobsCosmosClient.get_by_id(topicId, jobId)
    results = await jobsCosmosClient.get_job_results(topicId, jobId)
    if not results:
        return jsonify({"error": "no results found"}), 404
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    tmp_file_identifier = f"{topicId}_{jobId}_{timestamp}"
    _res = process_job_results(job, results)
    filename = generate_xlsx_from_job_results(_res, tmp_file_identifier)
    
    return await send_file(filename, as_attachment=True, attachment_filename=f"results-{jobId}.xlsx", cache_timeout=0)

@jobs.delete("/<jobId>/results/<resultId>/findings/<findingId>")
async def topic_delete_jobresult_finding(topicId: str, jobId: str, resultId: str, findingId: int):
    await jobsCosmosClient.delete_finding_from_job_result(topicId, resultId, findingId)
    return jsonify({"message": f"delete finding {findingId} from result {resultId}, job {jobId}, topic: {topicId}"})

