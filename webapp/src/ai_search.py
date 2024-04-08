import requests
import time
import os
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents import SearchClient

AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
AZURE_SEARCH_API_KEY = os.getenv("AZURE_SEARCH_API_KEY")
search_creds = AzureKeyCredential(AZURE_SEARCH_API_KEY)


def search_rest(method, endpoint, json):
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_SEARCH_API_KEY,
    }
    url = f"{AZURE_SEARCH_ENDPOINT}{endpoint}?api-version=2023-11-01"
    response = requests.request(method, url, headers=headers, json=json)
    if response.ok:
        return True
    return response.text


def get_index_client():
    index_client = SearchIndexClient(
        endpoint=AZURE_SEARCH_ENDPOINT, credential=search_creds
    )
    return index_client


def get_search_client(index_name):
    search_client = SearchClient(
        endpoint=AZURE_SEARCH_ENDPOINT, credential=search_creds, index_name=index_name
    )
    return search_client


def create_search_index(index_name, index_client):
    print(f"Ensuring search index {index_name} exists")
    if index_name not in index_client.list_index_names():
        index = {
            "name": index_name,
            "fields": [
                {
                    "name": "id",
                    "type": "Edm.String",
                    "key": True,
                    "searchable": False,
                },
                {"name": "content", "type": "Edm.String", "analyzer": "en.lucene"},
                {"name": "title", "type": "Edm.String", "analyzer": "en.lucene"},
                {"searchable": False, "name": "url", "type": "Edm.String"},
                {"searchable": False, "name": "type", "type": "Edm.String"},
                {"searchable": False, "name": "truncatedStart", "type": "Edm.Boolean"},
                {"searchable": False, "name": "truncatedEnd", "type": "Edm.Boolean"},
                {"searchable": False, "name": "pageNumber", "type": "Edm.String"},
                {"searchable": False, "name": "fileId", "type": "Edm.String"},
                {"searchable": False, "name": "metadata", "type": "Edm.String"},
                {
                    "name": "contentVector",
                    "type": "Collection(Edm.Single)",
                    "searchable": True,
                    "retrievable": False,
                    "dimensions": 1536,
                    "vectorSearchProfile": "default",
                },
            ],
            "semantic": {
                "configurations": [
                    {
                        "name": "my-semantic-config",
                        "prioritizedFields": {
                            "prioritizedContentFields": [{"fieldName": "content"}],
                            "prioritizedKeywordsFields": [],
                            "titleField": {"fieldName": "title"},
                        },
                    }
                ],
            },
            "vectorSearch": {
                "algorithms": [
                    {
                        "name": "myHnswAlgorithm",
                        "kind": "hnsw",
                        "hnswParameters": {
                            "metric": "cosine",
                            "m": 4,
                            "efConstruction": 400,
                            "efSearch": 500,
                        },
                    }
                ],
                "profiles": [
                    {
                        "name": "default",
                        "algorithm": "myHnswAlgorithm",
                    }
                ],
            },
        }
        print(f"Creating {index_name} search index")
        # index_client.create_index(index)
        res = search_rest("post", "indexes", index)
        print(res)
    else:
        print(f"Search index {index_name} already exists")


def upload_documents_to_index(docs, search_client, upload_batch_size=50):
    to_upload_dicts = []

    id = 0
    for d in docs:
        doc = {
            **d,
            "@search.action": "upload",
        }
        if "contentVector" in d and d["contentVector"] is None:
            del d["contentVector"]
        to_upload_dicts.append(d)
        id += 1

    # Upload the documents in batches of upload_batch_size
    for i in range(0, len(to_upload_dicts), upload_batch_size):
        batch = to_upload_dicts[i : i + upload_batch_size]
        results = search_client.upload_documents(documents=batch)
        num_failures = 0
        errors = set()
        for result in results:
            if not result.succeeded:
                print(
                    f"Indexing Failed for {result.key} with ERROR: {result.error_message}"
                )
                num_failures += 1
                errors.add(result.error_message)
        if num_failures > 0:
            raise Exception(
                f"INDEXING FAILED for {num_failures} documents. Please recreate the index."
                f"To Debug: PLEASE CHECK chunk_size and upload_batch_size. \n Error Messages: {list(errors)}"
            )


def validate_index(index_name, index_client):
    for retry_count in range(5):
        stats = index_client.get_index_statistics(index_name)
        num_chunks = stats["document_count"]
        if num_chunks == 0 and retry_count < 4:
            print("Index is empty. Waiting 60 seconds to check again...")
            time.sleep(60)
        elif num_chunks == 0 and retry_count == 4:
            print("Index is empty. Please investigate and re-index.")
        else:
            print(f"The index contains {num_chunks} chunks.")
            average_chunk_size = stats["storage_size"] / num_chunks
            print(f"The average chunk size of the index is {average_chunk_size} bytes.")
            break


def search_by_document_id(topicId:str, documentId:str):
    index_name = f'idx-{topicId}'
    client = get_search_client(index_name)
    results = client.search(
        filter=f"id eq '{documentId}'",
    )
    for result in results:
        return result
    return None

def search_semantic(topicId:str, query:str,*, top_n:int=5):
    index_name = f'idx-{topicId}'
    client = get_search_client(index_name)
    results = client.search(
        search_text=query,
        query_type="semantic",
        top=top_n,
        semantic_configuration_name="my-semantic-config",
    )
    return results


def search_vector(topicId:str, vector:list[float], *, top_n:int=5):
    index_name = f'idx-{topicId}'
    client = get_search_client(index_name)
    results = client.search(
        top=top_n,
        vector_queries=[
            {
                "kind": "vector",
                "vector": vector,
                "exhaustive": False,
                "fields": "contentVector",
                "k": top_n,
            }
        ],
    )
    return results


def search_hybrid(topicId:str, query:str, vector:list[float],*, top_n:int=5):
    index_name = f'idx-{topicId}'
    client = get_search_client(index_name)
    results = client.search(
        search_text=query,
        query_type="semantic",
        top=top_n,
        semantic_configuration_name="my-semantic-config",
        vector_queries=[
            {
                "kind": "vector",
                "vector": vector,
                "exhaustive": False,
                "fields": "contentVector",
                "k": top_n,
            }
        ],
    )
    return results


def delete_records_by_id(topicId:str, recordIds:list[str]):
    index_name = f'idx-{topicId}'
    client = get_search_client(index_name)
    records = [ {"id": recordId, "@search.action": "delete"} for recordId in recordIds]
    return client.delete_documents(records)