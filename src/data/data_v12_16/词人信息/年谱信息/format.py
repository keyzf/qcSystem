import json

data = open('苏辙.json', 'r', encoding='utf-8').read()
data = json.loads(data)['lines']

locations = set([])
for line in data:
	locations.add(line['Title'])

fs = open('苏辙.csv', 'w', encoding='utf-8')
for location in locations:
	fs.write(location + '\n')

