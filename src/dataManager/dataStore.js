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
// import total from '../data/temp_data/total.json'
// import gender_brith_death from '../data/data_v12_16/词人信息/基本信息/生卒.json'
// import gender_brith_death from '../data/data_v12_16/词人信息/基本信息/生卒_仅词人.json'
import poet_year from '../data/data_v12_30/词人信息/基本信息/词人_年份.json'
import 'whatwg-fetch'
import { totalmem } from 'os';

class NewDataStore{
  getObject(id){

  }

}
class Manager {
  constructor(){
    this.id_set = new Set()
    this.id2object = {}
  }
  s_equal(p1, p2){
    return p1.id === p2.id
  }
  d_equal(p1, p2){
    for(let key in p1){
        if(p1['key']!==p2['key']){
          return false
        }
    }
    return true
  }
  get(id){
    return this.id2object[id]
  }
}
class PersonManager extends Manager{
  // 对接受的数据进行处理
  wrap(_object){

  }
}
class AddrManager extends Manager{
  wrap(_object){
    
  }
}
class EventManager extends Manager{
  wrap(_object){
    
  }
}

// 直接给json值加操作好了
// class Event{
//   constructor(_object){
//     // {this.id, this.addrs, this.roles} = _object
//   }
//   isEqual(another){
//     return another.id === this.id
//   }
// }
// class Person{
//   isEqual(another){
//     return another.id === this.id
//   }
// }
// class Addr{
//   isEqual(another){
//     return another.id === this.id
//   }
// }

// 这破玩意也没法用了
class DataStore {
    constructor(){
      // console.log(total)
      // // 测试proxy
      // fetch('http://localhost:8000/getPersonDetail',{
      //     method:'GET',
      //     headers:{
      //       'Content-Type':'application/json;charset=UTF-8'
      //     },
      //     cache:'default'
      //   })
      //    .then(res =>res.json())
      //    .then((data) => {
      //      console.log(data)  
      //    })

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

      // 来自CBDB的信息事件，暂用
      let cbdb_poet_array = ['苏轼']  //643488
      this.time_line_cbdb = {}
      cbdb_poet_array.forEach(element=>{
        let data = require('../data/temp_data/' + element + 'CBDB.json')
        console.log(data)
        Object.keys(data).forEach(person_id => {
          let personal_data = data[person_id]
          let person = personal_data.nodes
          let time_line = []
          // console.log(personal_data.links_target)
          time_line = personal_data.links_target['political'].map(one_node=>{
            let target = one_node.target
            let place = undefined
            let coord = []
            if (target.ADDR) {
              place = target.ADDR.c_name_chn
              coord = target.ADDR.coord
              if (coord.length===0 && target.ADDR.x_coord != '' &&  target.ADDR.y_coord != '') {
                coord = [target.ADDR.x_coord, target.ADDR.y_coord]
              }
            }
            let one_event = {
              time_range: [],
              time: target.TIME?new Date(parseInt(target.TIME),1,1):undefined,
              event_count: 1,
              activity: target,
              place: place,
              coord: coord
            }
            return one_event
          })
          // 去重
          let temp_time_line = {}
          // console.log())
          time_line.forEach((event, index)=>{
            let time = event.time
            let place = event.place
            temp_time_line[time] = temp_time_line[time]?temp_time_line[time]:{}
            if (temp_time_line[time][place]) {
              temp_time_line[time][place].event_count += 1
              temp_time_line[time][place].activities.push({
                detail:event.activity,
                time_range : event.time_range 
              })
            }else{
              temp_time_line[time][place] = {
                time: time,
                event_count: 1,
                activities: [{
                  detail:event.activity,
                  time_range : event.time_range 
                }],
                place: place,
                coord: event.coord
              }
              // console.log(temp_time_line[time][place].x, Object.keys(temp_time_line), temp_time_line)
            }
          })
          time_line = temp_time_line
          this.time_line_cbdb[person_id] = {
            person: person,
            time_line: time_line
          }           
        })
        // this.time_line_cbdb[element] = 
      })
      console.log(this.time_line_cbdb)

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

var personManager = new PersonManager
var addrManager = new AddrManager
var eventManager = new EventManager

var dataStore = new NewDataStore

export default dataStore