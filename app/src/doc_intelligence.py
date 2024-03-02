import os
from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient, AnalyzeResult

endpoint = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT")
key = os.getenv("AZURE_DOC_INTELLIGENCE_API_KEY")

# sample document
formUrl = "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-layout.pdf"

document_analysis_client = DocumentAnalysisClient(
    endpoint=endpoint, credential=AzureKeyCredential(key)
)


def doc_intelligence_process_doc_url(formUrl: str):
    poller = document_analysis_client.begin_analyze_document_from_url(
        "prebuilt-document", formUrl
    )
    result = poller.result()
    return result


def doc_intelligence_process_doc(file_path: str, pages: str = None)->AnalyzeResult:
    with open(file_path, "rb") as f:
        poller = document_analysis_client.begin_analyze_document(
            "prebuilt-document", document=f, pages=pages
        )
    result = poller.result()
    return result

def json_to_analyze_result(json: dict)->AnalyzeResult:
    return AnalyzeResult.from_dict(json)