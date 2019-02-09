// 存储获取的数据和状态

// 静态数据
import event2score from '../data/temp_data/event2score.json'   //事件打分
import all_place from '../data/temp_data/宋朝地点.json'
import stateManager from './stateManager'
import 'whatwg-fetch'
// import { totalmem } from 'os';
// import { set } from 'mobx';
// import {observable, action} from 'mobx';

class DataStore{
  constructor(){
    // 初始化数据
    console.log('初始化数据')
    fetch('http://localhost:8000/init',{
      method:'GET',
      headers:{
          'Content-Type':'application/json;charset=UTF-8'
      },
      cache:'default'
    })
    .then(res =>res.json())
    .then((data) => {
        this.processInitData(data)
        stateManager.is_ready = true
        console.log('初始化完成')
    })

  }

  processInitData(data){
    let {people, addrs, triggers} = data
    // console.log(people, addrs, triggers)

    for(let person_id in people){
      let person =  people[person_id]
      personManager.create(person)
    }

    for(let addr_id in addrs){
      let addr =  addrs[addr_id]
      addrManager.create(addr)
    }
    let createAddr = item=> addrManager.get(item)
    for(let addr_id in addrs){
      let addr =  addrs[addr_id]
      let sons =  addr.sons
      let parents = addr.parents

      addr = addrManager.create(addr)
      addr.parents = parents.map(createAddr)
      addr.sons = sons.map(createAddr)
    }

    for(let trigger_id in triggers){
      triggerManager.create(triggers[trigger_id])
    }
  }

  // 将对象处理，连接
  processResults(results){
    let {events, addrs, people} = results
    // console.log(results)
    // 注意包含son parents没弄
    for(let addr_id in addrs){
      addrs[addr_id] = addrManager.create(addrs[addr_id])
    }

    for(let person_id in people){
      people[person_id] = personManager.create(people[person_id])
    }

    for(let event_id in events){
      let event = eventManager.get(event_id)
      if (!event) {
        event = eventManager.create(events[event_id])
        event.addrs.forEach(addr => {
          addrs[addr.id] = addr
        });
        event.roles.forEach(role => {
          let person = role['person']
          people[person.id] = person
        });
      }
      events[event_id] = event
    }
    return results
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
        if(p1[key]!==p2[key]){
          return false
        }
    }
    return true
  }

  // 使用的时候注意判断是否找到了
  get(_object){
    if(typeof(_object)=='string'){
      let item = this.id2object[_object]
      // item || console.warn(_object, '找不到了！！')
      return item
    }else{
      return this.create(_object) 
    }
  }

  create(_object){
    // console.log(_object)
    if (this.id_set.has(_object.id)) {
      return this.id2object[_object.id]
    }else{
      let new_object = new this._object(_object)
      // new_object = observable.box(new_object)  //似乎太麻烦了，而且 很卡  还是加个signal
      this.id2object[_object.id] = new_object
      this.id_set.add(_object.id)
      return new_object
    }
  }
}

class PersonManager extends Manager{
  constructor(){
    super()
    this._object = Person
  }
}

class AddrManager extends Manager{
  constructor(){
    super()
    this._object = Addr
    this.loadAllPlace()
  }
  loadAllPlace(){
    for(let addr_id in all_place){
      let data = all_place[addr_id]
      let addr = this.create(data)
      addr.parents = data.parents.map(item_id=> this.create(all_place[item_id]))
      addr.sons = data.sons.map(item_id=> this.create(all_place[item_id]))
    }
  }
}

class TriggerManager extends Manager{
  constructor(){
    super()
    this._object = Trigger
  }
}

class EventManager extends Manager{
  constructor(){
    super()
    this.event2score = event2score
    this.event2score['担任'] = {
      "type": "政治",
      "parent_type": "政治",
      "score": 9
    }
    for(let trigger in this.event2score){
      this.event2score[trigger].score = parseInt(this.event2score[trigger].score)
    }

    this._object = Event
  }

  // 评分有重大问题呀，没有角色
  getScore(trigger, role){
    if (role==='主角') {
      trigger = trigger || {name:'不存在'}
      let trigger_with_role = trigger.name //  + ' ' + role
      if(event2score[trigger_with_role]){
        return event2score[trigger_with_role].score
      }
    }else{
      // 不是主角先瞎写一个
      let trigger_with_role = trigger.name //  + ' ' + role
      if(event2score[trigger_with_role]){
        return event2score[trigger_with_role].score/2
      }
    }
    // console.warn('ERROR: 有不存在评分的', trigger_with_role)
    return 0
  }
}

// 直接给json值加操作好了
class Event{
  constructor(_object){
    this.id = _object.id
    this.addrs = _object.addrs.map(item_id=> addrManager.get(item_id))
    this.trigger =  triggerManager.get(_object.trigger)
    this.roles = _object.roles.map(item=> {
      let person = personManager.get(item.person)
      person || console.warn(person, '没找到')
      person && person.bindEvent(this)
      return {
        person: person,
        role: item.role,
        // score: eventManager.getScore(this.trigger, item.role),
        tag: this.trigger? '不存在trigger': this.trigger.name + ' ' + item.role
      }
    })
    this.time_range = _object.time_range
  }

  getScore(person){
    for (let index = 0; index < this.roles.length; index++) {
      const role = this.roles[index];
      if (role['person']===person) {
        return eventManager.getScore(this.trigger, role['role'])
      }
    }
    console.warn(person, '根本没参与算个鬼的score')
    return 0
  }

  // 两个还没用到
  addAddr(addr){
    if (!this.addrs.includes(addr)) {
      this.addrs.push(addr)
    }
  }
  addPerson(person, role){
    let has = this.roles.find((item)=> person===item.person&&role===item.role)

  }
}



// 还没有处理 isNaN()的情况
class Person{
  constructor(_object){
    this.id = _object.id
    this.name = _object.name
    this.birth_year = parseInt(_object.birth_year)
    this.death_year = parseInt(_object.death_year)
    this.events = []
  }

  bindEvent(_event){
    if (!this.events.includes(_event)) {
      this.events.push(_event)
    }
  }

  year2events(){
    // 没有判断是否完整
    let year2events = {}
    let events = this.events
    events.forEach(event=>{
      let time_range = event.time_range
      if (isCertainTimeRange(time_range)) {
        let year = time_range[0]
        year2events[year] = year2events[year] || []
        year2events[year].push(event)
      }
    })
    return year2events
  }

  getCertainEvents(){
    return this.events.filter(event=> isCertainTimeRange(event.time_range))
  }
}

class Addr{
  constructor(_object){
    this.id = _object.id
    this.name = _object.name
    this.alt_names = _object.alt_names
    this.first_year = parseInt(_object.first_year)
    this.last_year = parseInt(_object.last_year)
    this.x = parseFloat(_object.x)
    this.y = parseFloat(_object.y)

    // 从属关系构造之后再连接
    this.parents = []
    this.sons = []
  }

  // 初始化的时候没有用
  addParents(_addr){
    if(!this.parents.includes(_addr))
      this.parents.push(_addr)
  }
  addSons(_addr){
    if(!this.sons.includes(_addr))
      this.sons.push(_addr)
  }
}

class Trigger{
  constructor(_object){
    this.id = _object.id
    this.name = _object.name
    this.type = _object.type
    this.parent_type = _object.parent_type
  }
}

var personManager = new PersonManager()
var addrManager = new AddrManager()
var eventManager = new EventManager()
var triggerManager = new TriggerManager()
var dataStore = new DataStore()
var isValidYear = (year)=>{
  return year && !isNaN(year) && year!==-9999 && year!==9999
}
var isCertainTimeRange = (time_range)=>{
  return time_range[0]===time_range[1] && isValidYear(time_range[0])
}
export {personManager, addrManager, eventManager, triggerManager, isValidYear}
export default dataStore
