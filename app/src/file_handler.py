from src.cosmos_utils.files_client import TopicFilesCosmosClient
from src.doc_intelligence import doc_intelligence_process_doc, json_to_analyze_result
import json
import os
import re
import inspect
from src.embedding import get_content_embedding
from src.ai_search import (
    create_search_index,
    get_search_client,
    get_index_client,
    upload_documents_to_index,
)

# 1. Upload the file to Blob
# 2. Create a record in CosmosDB
# 3. Call Doc. Intelligence
# 4. Upload the file from (3) to Blob
# 5. Update the record in CosmosDB (add the ref)
# 6. Chunking
# 7. Get Embeddings
# 8. Upload the chunks+embedding to Storage
# 9. Upload the chunks+embedding to Cognitive Search

MAX_CHUNK_LENGTH = 4000
OVERLAP_WINDOW = 100


class FileHandler:
    def __init__(
        self, topicId: str, filename:str, fileClient: TopicFilesCosmosClient
    ):
        self.topicId = topicId
        self.filename = self.clean_name(os.path.basename(filename))
        self.fileext = os.path.splitext(os.path.basename(filename))[1]
        self.fileClient = fileClient
        
        self.file_local_path = f'tmp/{self.topicId}/{self.filename}{self.fileext}'
        self.file_blob_path = f"{self.topicId}/raw/{self.filename}{self.fileext}"
        self.doc_intel_local_path = f'tmp/{self.topicId}/{self.filename}.json'
        self.doc_intel_blob_path = f'{self.topicId}/doc_intel/{self.filename}.json'
        
        self.paragraph_chunks_local_path = f'tmp/{self.topicId}/{self.filename}.paragraphs.chunks.jsonl'
        self.table_chunks_local_path = f'tmp/{self.topicId}/{self.filename}.tables.chunks.jsonl'

        self.logs = []
        
    
    def log(self, method_name, message):
        self.logs.append({
            "method": method_name,
            "message": message
        })

    def clean_name(self, filename: str):
        filename = filename.replace("/", "_")
        name, ext = os.path.splitext(filename)
        # remove any non-alphanumeric special characters
        name = re.sub(r"[^A-Za-z0-9_-]", "", name)
        ext = re.sub(r"[^A-Za-z0-9]", "", ext)
        return name
    
    async def write_local_file(self, data: bytes):
        with open(self.file_local_path, "wb") as f:
            f.write(data)
        return self.log(inspect.currentframe().f_code.co_name, f"Written {self.file_local_path}")
       
    async def load(self):
        bypass = 0
        try:
            self.file_object = (await self.fileClient.query(
                query="SELECT * FROM c WHERE c.file=@file",
                params=[{
                    "name": "@file", 
                    "value": f"https://{self.fileClient._storage_account_name}.blob.core.windows.net/{self.fileClient._storage_container_name}/{self.file_blob_path}"
                }],
                partition_key=self.topicId)
            )[0]
            bypass = 1
            
            if os.path.exists(self.doc_intel_local_path):
                _tmp = json.load(open(self.doc_intel_local_path)) 
                self.analyze_result = json_to_analyze_result(_tmp)
                bypass = 2
            
            if os.path.exists(self.paragraph_chunks_local_path):
                self.paragraph_chunks = [json.loads(line) for line in open(self.paragraph_chunks_local_path)]
                self.table_chunks = [json.loads(line) for line in open(self.table_chunks_local_path)]
                bypass = 3
        except:
            pass 
        finally:
            return bypass

    async def __call__(self, data: bytes):
        bypass = await self.load()
        
        try:
            if bypass<1: await self.write_local_file(data)
            if bypass<1: await self.upload_to_blob(self.file_local_path, self.file_blob_path)
            if bypass<1: await self.create_cosmos_object()
            
            if bypass<2: await self.call_doc_intelligence()
            if bypass<2: await self.upload_to_blob(self.doc_intel_local_path, self.doc_intel_blob_path)
            if bypass<2: await self.update_cosmos_object(doc_intel=f"https://{self.fileClient._storage_account_name}.blob.core.windows.net/{self.fileClient._storage_container_name}/{self.doc_intel_blob_path}")
            
            if bypass<3: await self.perform_chunking()
            if bypass<3: await self.perform_embedding()
            # if bypass<3: await self.save_chunks_locally()
            
            if bypass<4: await self.postprocess_chunks()
            if bypass<4: await self.upload_to_ai_search()
            
        except Exception as e:
            self.log(inspect.currentframe().f_code.co_name, f"Error: {e}")
        finally:
            for log in self.logs:
                print(log)
        return self 

    async def upload_to_blob(self, src_path, blob_path):
        with open(src_path, "rb") as f:
            await self.fileClient.upload_file(self.topicId, blob_path, f.read())
        return self.log(inspect.currentframe().f_code.co_name, f"Uploaded {src_path} to {blob_path}")

    async def create_cosmos_object(self):
        payload = {
            "topicId": self.topicId,
            "filename": self.file_local_path,
            "file": f"https://{self.fileClient._storage_account_name}.blob.core.windows.net/{self.fileClient._storage_container_name}/{self.file_blob_path}",
        }
        self.file_object = await self.fileClient.create(payload)
        return self.log(inspect.currentframe().f_code.co_name, f"Created cosmos object.")

    async def update_cosmos_object(self, **kwargs):
        payload = self.file_object
        for k, v in kwargs.items():
            payload[k] = v
        self.file_object = await self.fileClient.upsert(payload)
        return self.log(inspect.currentframe().f_code.co_name, f"Updated cosmos object.")

    async def call_doc_intelligence(self):
        result = doc_intelligence_process_doc(self.file_local_path)
        with open(self.doc_intel_local_path, "w") as f:
            json.dump(result.to_dict(), f, indent=4)
        self.analyze_result = result
        return self.log(inspect.currentframe().f_code.co_name, f"Called Doc. Intelligence local")

    async def perform_chunking(self):
        results = self.analyze_result
        paragraph_chunks = []
        current_chunk = ""
        current_title = ""
        chunk_start_page = 1
        truncatedStart = False
        truncatedEnd = False

        for paragraph in results.paragraphs:
            role = paragraph.role
            if role in ["pageHeader", "pageFooter", "pageNumber"]:
                continue
            if role in ["title", "sectionHeading"]:
                if current_chunk:
                    paragraph_chunks.append(
                        {
                            "content": current_chunk,
                            "type": "paragraph",
                            "pageNumber": chunk_start_page,
                            "truncatedStart": truncatedStart,
                            "truncatedEnd": False,
                        }
                    )
                    truncatedStart = False
                    truncatedEnd = False
                chunk_start_page = paragraph.bounding_regions[0].page_number
                current_chunk = paragraph.content + "\n"
                current_title = paragraph.content
                continue
            else:
                current_chunk += paragraph.content + "\n"
                if len(current_chunk) > MAX_CHUNK_LENGTH:
                    chunk1, chunk2 = (
                        current_chunk[:MAX_CHUNK_LENGTH],
                        current_chunk[MAX_CHUNK_LENGTH - OVERLAP_WINDOW :],
                    )
                    truncatedEnd = True
                    paragraph_chunks.append(
                        {
                            "content": chunk1,
                            "type": "paragraph",
                            "pageNumber": chunk_start_page,
                            "truncatedStart": truncatedStart,
                            "truncatedEnd": truncatedEnd,
                        }
                    )
                    truncatedStart = True
                    current_chunk = current_title + "\n..." + chunk2
                    # do we need to?
                    chunk_start_page = paragraph.bounding_regions[0].page_number

        table_chunks = []

        for table in results.tables:
            rows = table.row_count
            cols = table.column_count
            data = [[] for _ in range(rows)]
            # 3 rows 4 cols
            # data = [
            #     ['','','',''],
            #     ['','','',''],
            #     ['','','',''],
            # ]
            for row in data:
                for j in range(cols):
                    row.append("")

            for cell in table.cells:
                data[cell.row_index][cell.column_index] = (
                    cell.content if cell.content else ""
                )
                # replace all new line characters with space
                data[cell.row_index][cell.column_index] = data[cell.row_index][
                    cell.column_index
                ].replace("\n", " ").replace(":unselected:","").replace(":selected:","[x]")

            table_in_markdown = ""
            for row in data:
                this_row = " | ".join(row) + "\n"
                if len(table_in_markdown) + len(this_row) > MAX_CHUNK_LENGTH:
                    table_chunks.append(
                        {
                            "content": table_in_markdown,
                            "type": "table",
                            "pageNumber": table.bounding_regions[0].page_number,
                        }
                    )
                    table_in_markdown = ''
                table_in_markdown += this_row

            table_chunks.append(
                {
                    "content": table_in_markdown,
                    "type": "table",
                    "pageNumber": table.bounding_regions[0].page_number,
                }
            )
        self.paragraph_chunks = paragraph_chunks
        self.table_chunks = table_chunks
        return self.log(inspect.currentframe().f_code.co_name, f"Performed chunking. Paragraphs: {len(paragraph_chunks)}, Tables: {len(table_chunks)}")

    async def perform_embedding(self):
        for id,chunk in enumerate(self.paragraph_chunks):
            print(f"Embedding paragraph {id+1}/{len(self.paragraph_chunks)}")
            chunk["contentVector"] = await get_content_embedding(chunk["content"])

        for id, chunk in enumerate(self.table_chunks):
            print(f"Embedding table {id+1}/{len(self.table_chunks)}")
            chunk["contentVector"] = await get_content_embedding(chunk["content"])

        await self.save_chunks_locally()
        return self.log(inspect.currentframe().f_code.co_name, f"Performed embedding.")

    async def postprocess_chunks(self):
        for id,chunk in enumerate(self.paragraph_chunks):
            print(f"Postprocessing paragraph {id+1}/{len(self.paragraph_chunks)}")
            chunk["pageNumber"] = str(chunk["pageNumber"])
            chunk['id'] = f'{self.topicId}-{self.filename}-p-{id}'
            chunk['url'] = f"https://{self.fileClient._storage_account_name}.blob.core.windows.net/{self.fileClient._storage_container_name}/{self.file_blob_path}#page={chunk['pageNumber']}"

        for id, chunk in enumerate(self.table_chunks):
            print(f"Postprocessing table {id+1}/{len(self.table_chunks)}")
            chunk["pageNumber"] = str(chunk["pageNumber"])
            chunk['id'] = f'{self.topicId}-{self.filename}-t-{id}'
            chunk['url'] = f"https://{self.fileClient._storage_account_name}.blob.core.windows.net/{self.fileClient._storage_container_name}/{self.file_blob_path}#page={chunk['pageNumber']}"
        
        await self.save_chunks_locally()
        return self.log(inspect.currentframe().f_code.co_name, f"postprocessed chunks.")
    
    async def save_chunks_locally(self):
        with open(self.paragraph_chunks_local_path, "w") as f:
            for chunk in self.paragraph_chunks:
                f.write(json.dumps(chunk) + "\n")
        with open(self.table_chunks_local_path, "w") as f:
            for chunk in self.table_chunks:
                f.write(json.dumps(chunk) + "\n")
        return self.log(inspect.currentframe().f_code.co_name, f"Saved chunks locally.")

    async def upload_to_ai_search(self):
        index_client = get_index_client()
        index_name = f"idx-{self.topicId}"
        create_search_index(index_name, index_client)
        search_client = get_search_client(index_name)
        upload_documents_to_index(self.paragraph_chunks, search_client)
        upload_documents_to_index(self.table_chunks, search_client)
        return self.log(inspect.currentframe().f_code.co_name, f"Uploaded to AI Search.")