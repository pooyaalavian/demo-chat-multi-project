

def parse_page_str(page_str:str, all_pages:list[int])->list[int]:
    """
    Parse the page string into a list of page numbers
    
    Args:
    page_str: str: The page string to parse, in the same format as printer input.
    all_pages: list[int]: The list of all valid pages in the document
    
    Returns:
    list[int]: The list of page numbers
    
    Example: ('1,3-5',[1,2,3,4,5,6,7,8,9]) will return [1,3,4,5]
    ('*',[1,2,3,4,5,6,7]) will return [1,2,3,4,5,6,7,8]
    ('1,6-20', 7) will return [1,6,7]
    """
    first_page = min(all_pages)
    last_page = max(all_pages)
    
    if page_str == '*':
        return list(all_pages)
    pages = []
    for part in page_str.split(','):
        if '-' in part:
            start, end = part.split('-')
            if start == '':
                start = first_page
            if end == '':
                end = last_page
            pages.extend(list(range(int(start), int(end)+1)))
        else:
            pages.append(int(part))
        
    return list(set(pages).intersection(all_pages))


def table_to_html(table):
    cells = table['cells']
    rows = [c['row_index'] for c in cells ]
    rows = list(set(rows))
    table_html = "<table>\n"
    texts = [c['content'] for c in cells if c['kind'] == 'content']
    for row in rows:
        row_cells = [c for c in cells if c['row_index'] == row]
        table_html += "<tr>\n"
        for cell in row_cells:
            tag = 'td' if cell['kind']=='content' else 'th'
            colspan = f' colspan="{cell["column_span"]}"' if cell['column_span'] > 1 else ''
            rowspan = f' rowspan="{cell["row_span"]}"' if cell['row_span'] > 1 else ''
            table_html += f"""  <{tag}{rowspan}{colspan}>{cell['content']}</{tag}>\n"""
        table_html += "</tr>\n"
    table_html += "</table>"
    return table_html, texts

if __name__ == '__main__':
    print(parse_page_str('1,3-5',range(1,10)))
    print(parse_page_str('*',range(1,8)))
    print(parse_page_str('1,6-20', range(1,7)))
    print(parse_page_str('5-', range(1,7)))
    print(parse_page_str('5-,2', range(1,7)))
    print(parse_page_str('1,3,5', range(1,7)))
    