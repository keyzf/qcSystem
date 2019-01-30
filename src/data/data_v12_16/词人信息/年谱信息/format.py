# import json

# data = open('苏辙.json', 'r', encoding='utf-8').read()
# data = json.loads(data)['lines']

# locations = set([])
# for line in data:
# 	locations.add(line['Title'])

# fs = open('苏辙.csv', 'w', encoding='utf-8')
# for location in locations:
# 	fs.write(location + '\n')

import os
import json

poets = {}
path=r"搜韵"
for f_name in os.walk(path):
	print(f_name[2])
	for poet_name in f_name[2]:
		data = json.loads(open(path + '/' + poet_name, 'r', encoding='utf-8').read())
		poets[poet_name.replace('.json', '')] = data
# print(poets)
open('result.json', 'w', encoding='utf-8').write(json.dumps(poets, ensure_ascii=False, indent=4))
	# poet = 