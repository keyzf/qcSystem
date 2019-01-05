import json
from opencc import OpenCC 
# cc = OpenCC('t2s') 

poet_list = open('./词人名录.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')
# poet_list = [cc.convert(name) for name in poet_list]
# open('./词人名录.csv', 'w', encoding='utf-8').write('\n'.join(poet_list))

fs_name = r'biog_main'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

objects = {}
attr_name = []
for field in rows[0].split(','):
    attr_name.append(field)
print(attr_name)
column_num = len(attr_name)

for row in rows[0:]:
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
    if this_object['c_name_chn'] in poet_list:
        poet_name = this_object['c_name_chn']
        if not objects.__contains__(poet_name):
            objects[poet_name] = {'name': poet_name, 'year': 0}
        for key in this_object.keys():
            # print(this_object[key])
            if objects[poet_name]['year']== 0 and len(this_object[key]) > 2 and 'year' in key and int(this_object[key]) < 1400 and int(this_object[key]) > 800:
                objects[poet_name]['year'] = this_object[key]
                # print('aaaa', key,  this_object[key])
            # else:
            #     print(this_object[key], key)
print(len(poet_list), len(objects.keys()))
for poet in poet_list:
    if poet not in objects.keys():
        print(poet)
open('词人_年份.json', 'w', encoding='utf-8' ).write(json.dumps(objects, indent=4, ensure_ascii = False))
# open('person2id_仅词人.json', 'w', encoding='utf-8' ).write(json.dumps(person2id, indent=4, ensure_ascii = False))
# open('id2person_仅词人.json', 'w', encoding='utf-8' ).write(json.dumps(id2person, indent=4, ensure_ascii = False))

