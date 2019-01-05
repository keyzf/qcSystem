import json


fs_name = r'亲属关系'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

objects = []
objects_order_by_person = {}
id2person = {}
person2id = {}

attr_name = ['from_id', 'from','relation', 'to_id', 'to', 'note']
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
    objects.append(this_object)

    from_person = this_object['from_id']
    if not objects_order_by_person.__contains__(from_person):
        objects_order_by_person[from_person] = [this_object]
    else:
        objects_order_by_person[from_person].append(this_object)

    id2person[this_object['from_id']] = this_object['from']
    id2person[this_object['to_id']] = this_object['to']

    if person2id.__contains__(this_object['to']):
        new_set = set(person2id[this_object['to']])
        new_set.add(this_object['to_id'])
        person2id[this_object['to']] = list(new_set)
    else:
        person2id[this_object['to']] = [this_object['to_id']]

    if person2id.__contains__(this_object['from']):
        new_set = set(person2id[this_object['from']])
        new_set.add(this_object['from_id'])
        person2id[this_object['from']] = list(new_set)
    else:
        person2id[this_object['from']] = [this_object['from_id']]

open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps({'data':objects}, indent=4, ensure_ascii = False))
open(fs_name + '_按人物整理.json', 'w', encoding='utf-8' ).write(json.dumps(objects_order_by_person, indent=4, ensure_ascii = False))
open('person2id.json', 'w', encoding='utf-8' ).write(json.dumps(person2id, indent=4, ensure_ascii = False))
open('id2person.json', 'w', encoding='utf-8' ).write(json.dumps(id2person, indent=4, ensure_ascii = False))

