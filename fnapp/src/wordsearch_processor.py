import os
from openai.types.chat import ChatCompletion
import json
from src.cosmos import create_jobresult, update_job, get_job, get_setting
import logging
from src.processor import Processor


GPT_MODEL = "gpt-35-turbo"

class WordSearchProcessor(Processor):
    def __init__(self, job, files):
        super().__init__(job, files, "extract_text.system.prompt")
        self.question = job["question"]
    
    def call_openai(self, context, *, model=GPT_MODEL, force_json=True, retry_count=1, headers:list[str]=[]):
        isGpt4 = model.find("4") != -1
        
        ignore_headers = ''
        if len(headers) > 0:
            ignore_headers = 'Here are some of the headers from the document that you can safely ignore from the top of the page: \n'
            for header in headers:
                ignore_headers += f'- {header}\n'
            
        response: ChatCompletion = self.oai_client.chat.completions.create(
            messages=[
                {"role": "system", "content": self.system_prompt + ignore_headers}, 
                {"role": "user", "name":"Document", "content": context},
                {"role": "user", "name":"User", "content": self.question},
            ],
            model=model,
            max_tokens=1000,
            temperature=0.0,
            response_format={"type":'json_object'} if isGpt4 else None,
        )
        answer_raw = response.choices[0].message.content
        usage = {
            "completion_tokens": response.usage.completion_tokens,
            "prompt_tokens": response.usage.prompt_tokens,
            "total_tokens": response.usage.total_tokens,
        }
        self.log_usage(usage)
        logging.info(answer_raw)
        if force_json:
            try:
                answer = json.loads(answer_raw)
            except json.JSONDecodeError:
                if retry_count < 3:
                    answer, usage2 = self.call_openai(context, model=model, force_json=force_json, retry_count=retry_count+1)
                    usage = {
                        "completion_tokens": usage['completion_tokens']+usage2['completion_tokens'],
                        "prompt_tokens": usage['prompt_tokens']+usage2['prompt_tokens'],
                        "total_tokens": usage['total_tokens']+usage2['total_tokens'],
                    }
                else:
                    answer= {'_raw': answer_raw}
        return answer, usage
    
    def get_pages(self, payload):
        pages = [p['page_number'] for p in  payload['pages']]
        return pages
    
    def tabl_to_html(self, table):
        cells = table['cells']
        rows = [c['row_index'] for c in cells ]
        rows = list(set(rows))
        table_html = "<table>"
        texts = [c['content'] for c in cells if c['kind'] == 'content']
        for row in rows:
            row_cells = [c for c in cells if c['row_index'] == row]
            table_html += "<tr>\n"
            for cell in row_cells:
                tag = 'td' if cell['kind']=='content' else 'tr'
                colspan = f' colspan="{cell["column_span"]}"' if cell['column_span'] > 1 else ''
                rowspan = f' rowspan="{cell["row_span"]}"' if cell['row_span'] > 1 else ''
                table_html += f"""  <{tag}{rowspan}{colspan}>{cell['content']}</{tag}>\n"""
            table_html += "</tr>\n"
        table_html += "</table>"
        return table_html, texts
        
        
    def get_tables_for_page(self, payload, page):
        tables = [
            t
            for t in payload['tables']
            if t['bounding_regions'][0]['page_number'] == page
        ]
        
        return [self.tabl_to_html(t) for t in tables]
    
    def get_paragraphs_for_page(self, payload, page):
        paras = [
            p
            for p in payload['paragraphs']
            if p['bounding_regions'][0]['page_number'] == page
            and (
                p['role'] is None
                or p['role'] in ['title','sectionHeading', ]
            )
        ]
        
        texts = []
        for p in paras:
            text: str = p.get('content', "")
            # text = text.replace(":unselected:", " ")
            # text = text.replace(":selected:", " ")
            texts.append(text)
        return texts
    
    def get_text_for_page(self, payload, page):
        paras = self.get_paragraphs_for_page(payload, page)
        tables = self.get_tables_for_page(payload, page)
        if len(tables) == 0:
            return "\n\n".join(paras)
        
        for t in tables:
            html, texts = t
            # if text is present in table, remove it from paras
            paras = [p for p in paras if p not in texts]
            paras.append(html)
            
        return "\n\n".join(paras)
    
    def prepare_text_for_llm(self, text: str, *, prev_page: str=None, ignorable_headers: list[str]=[]):
        for h in ignorable_headers:
            text = text.replace(h, "")
        return text
        # prev_context = f'<Page context="previousPage">{prev_page}</Page>' if prev_page else ""
        # this_context = f'<Page context="currentPage">{text}</Page>'
        # return f'''<Document>{prev_context}{this_context}</Document>'''
        
    
    def process(self):
        tmp = get_job(self.topicId, self.jobId)
        if tmp['status'] != 'queued':
            return 
        update_job(self.topicId, self.jobId, [
            {"op":"add", "path":"/status", "value":"running"},
        ])
        
        try:
            for file in self.files:
                if type(file['doc_intel']) == str:
                    file['doc_intel'] = [file['doc_intel']]
                ignorable_headers=file.get('metadata',{}).get('running_headers',[])
                for chunk in file['doc_intel']:
                    chunk_path = chunk.split('/files/')[1]
                    data = self.blob_client.get_blob_client('files',chunk_path).download_blob().readall()
                    payload = json.loads(data.decode('utf-8'))
                    pages = self.get_pages(payload)
                    prev_text = None
                    for page in pages:
                        text = self.get_text_for_page(payload, page)
                        context = self.prepare_text_for_llm(text, prev_page=prev_text, ignorable_headers=ignorable_headers)
                        answer, usage = self.call_openai(context, headers=ignorable_headers, model=self.job['llm'])
                        prev_text = text
                        create_jobresult(self.topicId, self.jobId, page, answer, usage,
                                         output_version="extract_v2", 
                                         file=file,
                                         chunk=chunk,
                                         context=context)
            update_job(self.topicId, self.jobId, [
                {"op":"add", "path":"/status", "value":"finished"},
                {"op":"add", "path":"/usage", "value":self.usage},
            ])
        except Exception as e:
            update_job(self.topicId, self.jobId, [
                {"op":"add", "path":"/status", "value":"failed"},
                {"op":"add", "path":"/error", "value":str(e)},
            ])