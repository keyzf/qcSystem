import json

poet_list = open('../词人名录.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

fs_name = r'生卒'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

objects = {}
id2person = {}
person2id = {}

attr_name = ['id', 'name', 'gender', 'brith', 'death', 'age']
column_num = len(attr_name)

for row in rows:
    columns = row.split(',')
    this_object = {}
    count = 0
    last_column = ''
    for column in columns:
        if count < column_num:
            this_object[attr_name[count]] = column
        else:
            this_object[attr_name[column_num-1]] += column
        count += 1
    if this_object['name'] in poet_list:
        objects[this_object['name']] = this_object

        id2person[this_object['id']] = this_object['name']

        if person2id.__contains__(this_object['name']):
            new_set = set(person2id[this_object['name']])
            new_set.add(this_object['id'])
            person2id[this_object['name']] = list(new_set)
        else:
            person2id[this_object['name']] = [this_object['id']]


open(fs_name + '_仅词人.json', 'w', encoding='utf-8' ).write(json.dumps({'data':objects}, indent=4, ensure_ascii = False))
open('person2id_仅词人.json', 'w', encoding='utf-8' ).write(json.dumps(person2id, indent=4, ensure_ascii = False))
open('id2person_仅词人.json', 'w', encoding='utf-8' ).write(json.dumps(id2person, indent=4, ensure_ascii = False))

