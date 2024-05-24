import xlsxwriter
import os 

class Column:
    def __init__(self, id, label, *, is_empty=False, is_int=False):
        self.id = id
        self.label = label
        self.is_empty = is_empty
        self.is_int = is_int

JOB_COLUMNS: list[Column] = [
    Column('row_number', 'Sl.No.', is_int=True),
    Column('source_spec', 'Spec. No.'),
    Column('source_revision', 'Rev.'),
    Column('source_title', 'Title'),
    Column('clause_address', 'Clause'),
    Column('clause_text','',),
    Column(None,'D/C/CL', is_empty=True),
    Column(None,'JC Comment', is_empty=True), 
]

class JobResultForXlsx:
    def __init__(self, id, finding, jobResult):
        self.row_number = id+1
        try:
            self.source_spec = jobResult['file']['metadata']['specification_id']
            self.source_revision = jobResult['file']['metadata']['revision']
            self.source_title = jobResult['file']['metadata']['title']
        except KeyError:
            self.source_spec = ''
            self.source_revision = ''
            self.source_title = ''
        self.clause_address = finding.get('clause_address', '')
        self.clause_text = finding.get('clause', '').replace('<em>','').replace('</em>','')
        self.dccl = None
        self.jc_comment = None

COLUMN_WIDTHS = {
    'A':4,
    'B':7,
    'C':27,
    'D':11,
    'E':30,
    'F':11,
    'G':36,
    'H':10,
    'I':62,
}

def process_job_results(job, jobResults):
    results = []
    id = 0
    for r in jobResults:
        if 'findings' not in r['result']:
            continue
        for f in r['result']['findings']:
            results.append(JobResultForXlsx(id, f, r))
            id += 1
    
    return results

def generate_xlsx_from_job_results(results: JobResultForXlsx, tmp_file_identifier:str):
    
    filename = f'{tmp_file_identifier}.xlsx'
    if os.path.exists(filename):
        os.remove(filename)
        
    wb = xlsxwriter.Workbook(filename)
    ws = wb.add_worksheet('Spec Commentary')
    
    # set column widths
    for col, width in COLUMN_WIDTHS.items():
        ws.set_column(f'{col}:{col}', width)

    # set main border
    base_border = wb.add_format({'border':1})
    base_bold = wb.add_format({'bold':True, 'border':1})
    base_border_wrap = wb.add_format({'border':1, 'text_wrap':True})
    
    first_row = 1
    first_col = 1
    last_row = len(results) + 8
    last_col = len(JOB_COLUMNS)
    for row in range(first_row, last_row ):
        for col in range(first_col, last_col + 1):
            ws.write_blank(row, col, None, base_border)

    # main_border_top = wb.add_format({'top':5})
    # main_border_left = wb.add_format({'left':5})
    # main_border_right = wb.add_format({'right':5})
    # main_border_bottom = wb.add_format({'bottom':5})
    
    # for col in range(first_col, last_col):
    #     ws.write_blank(first_row, col,None, main_border_top)
    #     ws.write_blank(last_row, col,None, main_border_bottom)
    
    # for row in range(first_row, last_row):
    #     ws.write_blank(row, first_col,None, main_border_left)
    #     ws.write_blank(row, last_col,None, main_border_right)
    
    
    
    # set headers
    ws.merge_range(1,1,4,8,'', base_border)
    ws.merge_range(5,1,5,7,'Quotation reference:', base_bold)
    ws.write(5,8,'???', base_border)
    ws.merge_range(6,1,6,7,'Revision:', base_bold)
    ws.write(6,8,'???', base_border)
    
    
    # Write table headers
    row = 7
    col = 1
    col_header_format = wb.add_format({
        'bold': True, 
        'border': 1, 
        'align': 'center', 
        'valign': 'vcenter',
        'bg_color': '#c0c0c0',
    })
    for column in JOB_COLUMNS:
        ws.write(row, col, column.label, col_header_format)
        col += 1
    
    # start with 1 col padding
    row = 8
    col = 1
    for result in results:
        for column in JOB_COLUMNS:
            if column.is_empty:
                ws.write(row, col, '', base_border)
            else:
                if column.is_int:
                    ws.write_number(row, col, getattr(result,column.id, ''), base_border)
                else:
                    ws.write_string(row, col, getattr(result,column.id, ''), base_border_wrap)
            col += 1
        row += 1
        col = 1
    

    wb.close()
    return filename


if __name__ == '__main__':
    generate_xlsx_from_job_results({}, [{},{},{},{}], 'test')