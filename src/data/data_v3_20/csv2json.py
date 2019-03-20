import json
import opencc
cc = opencc.OpenCC('t2s')
# from langconv import *

fs_name = r'社会区分'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

data = {}
sentences_exist = set([])
for row in rows:
    # print(row)
    columns = cc.convert(row).split(',')
    data[columns[0]] = {
        'chn': columns[2],
        'en': columns[1]
    }   

open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps(data, indent=4, ensure_ascii = False))


fs_name = r'种族'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')
data = {}

sentences_exist = set([])

for row in rows:
    # print(row)
    columns = cc.convert(row).split(',')
    data[columns[0]] = {
        'chn': columns[4],
        'en': columns[5]
    }   

open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps(data, indent=4, ensure_ascii = False))