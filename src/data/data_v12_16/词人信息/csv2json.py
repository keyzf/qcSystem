import json

column_num = 0
fs_name = r'词人名录'
rows = open(fs_name + r'.csv', 'r', encoding='utf-8').read().strip('\n').split('\n')

objects = []
for row in rows:
    columns = row.split(',')
    this_object = []
    count = 0
    last_column = ''
    for column in columns:
        if count < column_num:
            this_object.append(column)
        else:
            last_column += column
        count += 1
    if count >= column_num:
        this_object.append(last_column)
    objects.append(this_object[0])

open(fs_name + '.json', 'w', encoding='utf-8' ).write(json.dumps({'data':objects}, indent=4, ensure_ascii = False))

