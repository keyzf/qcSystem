import json
import opencc
cc = opencc.OpenCC('t2s')
# from langconv import *

fs_name = r'sim'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')
sentence_set = set([])

sentences_sim = []

attr_name = ['sentence1', 'sentence2','sim']
column_num = len(attr_name)

sentences_exist = set([])

for row in rows:
    # row = Converter('zh-hans').convert(row)
    # print(row)
    columns = cc.convert(row).split(',')
    this_object = {}
    count = 0
    last_column = ''
    for column in columns:
        if count < column_num:
            this_object[attr_name[count]] = column
        else:
            this_object[attr_name[column_num-1]] += column
        count += 1

    if float(this_object['sim'])>0.5 and this_object['sentence1']!=this_object['sentence2'] and ((this_object['sentence1']+'_'+this_object['sentence2']) not in sentences_exist) and ((this_object['sentence2']+'_'+this_object['sentence1']) not in sentences_exist):
        # if  not '0.3' in this_object['sim']:
            # this_object.pop('sim')
        sentences_sim.append(this_object)
        sentences_exist.add(this_object['sentence1']+'_'+this_object['sentence2'])
        sentences_exist.add(this_object['sentence2']+'_'+this_object['sentence1'])
        sentence_set.add(this_object['sentence1'])
        sentence_set.add(this_object['sentence2'])

open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps({'data':sentences_sim}, indent=4, ensure_ascii = False))

fs_name = r'sentence'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')


sentences_attribute = {}

attr_name = ['sentence', 'id','ci_name', 'poet', 'weight']
column_num = len(attr_name)

for row in rows:
    # row = Converter('zh-hans').convert(row)
    # print(row)
    columns = cc.convert(row).split(',')
    # columns = row.split(',')
    this_object = {}
    count = 0
    last_column = ''
    for column in columns:
        if count < column_num:
            this_object[attr_name[count]] = column
        else:
            this_object[attr_name[column_num-1]] += column
        count += 1

    this_object['weight'] = this_object['weight'].replace('} {', '},{').replace("\'", "\"")
    this_object['weight'] = json.loads(this_object['weight'])
    this_object.pop('weight')
    

    this_object['cipai'] = this_object['id'].split('-')[0]
    if this_object['sentence'] in sentence_set:
        sentence = this_object['sentence']
        this_object.pop('sentence')
        this_object.pop('id')
        sentences_attribute[sentence] = this_object


open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps({'data':sentences_attribute}, indent=4, ensure_ascii = False))



