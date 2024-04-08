import re
import json 


file = 'tmp/381b660e-3dcf-427a-aba8-299a3034179f/TOGAF91/23.json'
orig_file_size = 0
with open(file) as f:
    content = f.read()
    orig_file_size = len(content)
    # content = re.sub(r'\n', '', content)
    
    # remove json spaces
    pattern = r' {4,}'
    content = re.sub(pattern, '', content)
    # remove polygons
    pattern = r',?\s?"polygon": \[[^\]]*\]'
    content = re.sub(pattern, '', content)
    print(f'Original file size: {orig_file_size} bytes')
    print(f'New file size:      {len(content)} bytes')
    with open('tmp.json','w') as w:
        w.write(content)