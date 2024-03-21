import os
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError
from azure.ai.formrecognizer import DocumentAnalysisClient, AnalyzeResult
import asyncio

endpoint = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT")
key = os.getenv("AZURE_DOC_INTELLIGENCE_API_KEY")
TRANSACTION_PER_SECOND = 10

document_analysis_client = DocumentAnalysisClient(
    endpoint=endpoint, credential=AzureKeyCredential(key)
)


async def doc_intelligence_process_doc_url(formUrl: str, pages: str=None) -> AnalyzeResult:
    poller = document_analysis_client.begin_analyze_document_from_url(
        "prebuilt-document", formUrl, pages=pages
    )
    while not poller.done():
        await asyncio.sleep(3)
        print(f"Polling pages {pages}... {poller.status()}")
    result = poller.result()
    return result


async def _doc_intelligence_process_doc_batch(formUrl: str, pages: list[str]) -> list[AnalyzeResult]:
    pollers = {}
    results = {}
    for page in pages:
        pollers[page] = document_analysis_client.begin_analyze_document_from_url(
            "prebuilt-document", formUrl, pages=page
        )
    
    while True:
        await asyncio.sleep(3)
        print(f"Polling pages {pages}... ")
        for page in pages:
            if page in pollers:
                if pollers[page].done():
                    results[page] = pollers[page].result()
                    print(f"Page {page} done")
                    del pollers[page]
        if not bool(pollers):
            break
            
    arr = [results[page] for page in pages]
    return arr

async def doc_intelligence_process_doc_batch(formUrl: str, pages: list[str]) -> list[AnalyzeResult]:
    results = []
    while len(pages) > 0:
        batch = pages[:TRANSACTION_PER_SECOND]
        pages = pages[TRANSACTION_PER_SECOND:]
        results += await _doc_intelligence_process_doc_batch(formUrl, batch)
    return results

    
async def doc_intelligence_get_num_pages(formUrl: str, min=0, max=1024) -> int:
    if min==max:
        return min
    delta = (max - min)//2
    if delta <1: 
        delta = 1
    try:
        document_analysis_client.begin_analyze_document_from_url(
            "prebuilt-read", formUrl, pages=f"{max}"
        )
        return await doc_intelligence_get_num_pages(formUrl, max, max + delta)
    except HttpResponseError as e:
        if e.error.code == "InvalidArgument":
            return await doc_intelligence_get_num_pages(formUrl, min, max - delta)
    except Exception as e:
        print(e)
        return None


async def doc_intelligence_process_doc(file_path: str, pages: str=None) -> AnalyzeResult:
    with open(file_path, "rb") as f:
        poller = document_analysis_client.begin_analyze_document(
            "prebuilt-document", document=f, pages=pages
        )
        while not poller.done():
            await asyncio.sleep(3)
        result = poller.result()
        return result


def json_to_analyze_result(json: dict) -> AnalyzeResult:
    return AnalyzeResult.from_dict(json)
