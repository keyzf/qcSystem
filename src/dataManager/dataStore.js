// 存储获取的数据和状态
import domestic_realtion_json from '../data/data_v12_16/词人信息/关系信息/亲属关系.json'
import poet_list from '../data/data_v12_16/词人信息/词人名录.json'

// import id2person from '../data/data_v12_16/词人信息/基本信息/id2person.json'
// import person2id from '../data/data_v12_16/词人信息/基本信息/person2id.json'
import id2person from '../data/data_v12_16/词人信息/关系信息/id2person.json'
import person2id from '../data/data_v12_16/词人信息/关系信息/person2id.json'
import person2id_only_poet from '../data/data_v12_16/词人信息/基本信息/person2id_仅词人.json'
import id2person_only_poet from '../data/data_v12_16/词人信息/基本信息/id2person_仅词人.json'

import person2domestic_relation from '../data/data_v12_16/词人信息/关系信息/亲属关系_按人物整理.json'
import sim_sentences_belong from '../data/data_v12_16/词分析/相似度计算/句子相似度/sentence.json'
import sim_sentences from '../data/data_v12_16/词分析/相似度计算/句子相似度/sim.json'

// import gender_brith_death from '../data/data_v12_16/词人信息/基本信息/生卒.json'
// import gender_brith_death from '../data/data_v12_16/词人信息/基本信息/生卒_仅词人.json'
import poet_year from '../data/data_v12_30/词人信息/基本信息/词人_年份.json'
import 'whatwg-fetch'

class DataStore {
    constructor(){
        // 测试proxy
        fetch('http://localhost:8000/',{
            method:'GET',
            headers:{
              'Content-Type':'application/json;charset=UTF-8'
            },
            cache:'default'
          })
           .then(res =>res.text())
           .then((data) => {
             console.log(data)  
           })

        // 加载宋代人物亲属关系
        this.domestic_realtions = domestic_realtion_json['data']
        this.person2domestic_relation = person2domestic_relation
        this.id2person = Object.assign(id2person, id2person_only_poet)   
        this.person2id = Object.assign(person2id, person2id_only_poet)

        //词人列表
        this.poet_list = new Set(poet_list['data'])

        //词人年谱数据
        this.time_line = {}

        let poet_array = ['苏轼', '杨万里', '程颐', '孔文仲', '苏辙', '孔武仲']
        poet_array.forEach(element => {
          this.time_line[element] = require('../data/data_v12_16/词人信息/年谱信息/搜韵/' + element + '.json')['lines']
        });
        // let sushi = require('../data/data_v12_16/词人信息/年谱信息/搜韵/苏轼.json')['lines']
        // let yangwanli = require('../data/data_v12_16/词人信息/年谱信息/搜韵/杨万里.json')['lines']
        // this.time_line['苏轼'] = sushi
        // this.time_line['杨万里'] = yangwanli

        // 加载生卒和性别(目前以姓名为id查找，需要改正)
        // this.gender_brith_death = gender_brith_death['data']
        this.poet_year = poet_year
        // this.gender = {}
        // gender_brith_death.forEach(element => {
        //     this.brith_death[element[0]] = {
        //         'id' : element[0],
        //         'name' : element[1],
        //         'birth' : element[3],
        //         'death' : element[4]
        //     }

        //     this.gender[element[0]] = {
        //         'id' : element[0],
        //         'name' : element[1],
        //         'gender' : parseInt(element[2]) === 0? 'female' : 'male'
        //     }
        // })

        // 词的引用数据
        this.sim_sentences_belong = sim_sentences_belong['data']
        this.sim_sentences = sim_sentences['data']
    }
}

var dataStore = new DataStore
export default dataStore