// 存储获取的数据和状态

// 静态数据
import event2score from '../data/temp_data/event2score.json'   //事件打分
// import all_place from '../data/temp_data/宋朝地点.json'
import stateManager from './stateManager'
import 'whatwg-fetch'
import net_work from './netWork'
// import { convertPatternsToTasks } from 'fast-glob/out/managers/tasks';
// import { set, _isComputingDerivation } from 'mobx';
import guanzhi_pingji from '../data/data_v2_13/官职品级.json'
// import jsonFormat from 'json-format'

// import {observable, action} from 'mobx';

class DataStore{
  constructor(){
    // 初始化数据
    console.log('初始化数据')

    net_work.require('init')
    .then(data=>{
      this.processInitData(data)
      stateManager.is_ready = true
      console.log('初始化完成')
    })
  }

  processInitData(data){
    // console.log(data)
    let {people, addrs, triggers, trigger_imp} = data
    let can_selected_list = new Set()
    // console.log(people, addrs, triggers)
    // console.log(trigger_imp, people)
    this.trigger_imp = trigger_imp

    // console.log(trigger_imp)
    for(let person_id in people){
      let person = people[person_id]
      person = personManager.create(person)
      if(person.certain_event_num>10 && person.dy===15)
        can_selected_list.add(person)
    }
    stateManager.setShowPeopleList([...can_selected_list])

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

    triggerManager.countTypes()
  }

  // 将对象处理，连接
  processResults(results){
    // console.log(triggerManager.id2object, this.dict2array(eventManager.id2object).filter(event=>!event.trigger))
    // console.log(results)
    let {events, addrs, people} = results
    results.triggers = {}
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
      // console.log(event)
      if (!event) {
        event = eventManager.create(events[event_id])
      }
      event.addrs.forEach(addr => {
        addrs[addr.id] = addr
      });
      event.roles.forEach(role => {
        let person = role['person']
        people[person.id] = person
      });
      // console.log(event)
      
      results.triggers[event.trigger.id] = event.trigger
      events[event_id] = event
    }
    return results
  }

  dict2array(dict){
    let array = []
    for(let key in dict){
      array.push(dict[key])
    }
    return array
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
    // this.loadAllPlace()
  }
  // loadAllPlace(){
  //   for(let addr_id in all_place){
  //     let data = all_place[addr_id]
  //     let addr = this.create(data)
  //     addr.parents = data.parents.map(item_id=> this.create(all_place[item_id]))
  //     addr.sons = data.sons.map(item_id=> this.create(all_place[item_id]))
  //   }
  // }
}

class TriggerManager extends Manager{
  constructor(){
    super()
    this._object = Trigger
  }
  countTypes(){
    this.names = new Set()
    this.types = new Set()
    this.parent_types = new Set()
    this.parent2types = {}
    for(let id in this.id2object){
      let elm = this.id2object[id]
      this.names.add(elm.name)
      this.types.add(elm.type)
      this.parent_types.add(elm.parent_type)
      this.parent2types[elm.parent_type] = this.parent2types[elm.parent_type] || {}
      this.parent2types[elm.parent_type][elm.type] = this.parent2types[elm.parent_type][elm.type] || new Set()
      this.parent2types[elm.parent_type][elm.type].add(elm.name)
    }
    this.parent_types = [...this.parent_types].sort()
    this.types = [...this.types].sort()
    this.names = [...this.names].sort()
    return this.parent2types
    // console.log(this.types, this.parent2types, this.parent_types, this.names)
  }

  getAlltypes(){
    this.names = new Set()
    this.types = new Set()
    this.parent_types = new Set()
    for(let id in this.id2object){
      let elm = this.id2object[id]
      this.names.add(elm.name)
      this.types.add(elm.type)
    }
    return [...this.names, ...this.types, this.parent_types]
  }

  // 提取事件组内的trigger关系
  ownCountType(event_array){
    let triggers = new Set()
    event_array.forEach(event=>{
      triggers.add(event.trigger)
    })
    triggers = [...triggers]
    let parent2types = {}
    triggers.forEach(elm=>{
      parent2types[elm.parent_type] = parent2types[elm.parent_type] || {}
      parent2types[elm.parent_type][elm.type] = parent2types[elm.parent_type][elm.type] || new Set()
      parent2types[elm.parent_type][elm.type].add(elm.name)
    })
    return parent2types
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
      // 暂时用于使其为正
      this.event2score[trigger].score = parseInt(this.event2score[trigger].score)
    }

    this._object = Event

    this.pingji = ['正一品','从一品','正二品','从二品','正三品','从三品','正四品上','正四品','正四品下','从四品上', '从四品', '从四品下','正五品上','正五品', '正五品下','从五品上', '从五品','从五品下','正六品上','正六品','正六品下','从六品上', '从六品', '从六品下','正七品上', '正七品', '正七品下', '从七品上', '从七品', '从七品下', '正八品上','正八品', '正八品下','从八品上','从八品', '从八品下', '正九品下', '正九品', '正九品下','从九品上', '从九品', '从九品下']
    this.pingji = this.pingji.reverse()
    this.guanzhi2pingji = guanzhi_pingji
  }

  // 评分有重大问题呀，没有角色
  getScore(event, role){
    let trigger = event.trigger
    if (trigger.name === '担任') {
      let guanzhi = event.detail
      // console.log(guanzhi)
      if (!this.guanzhi2pingji[guanzhi]) {
        return 0
      }
      let pingji = this.guanzhi2pingji[guanzhi]['品级']
      // 好像还有缺的，如 主管尚书省户部架阁文字
      return this.pingji.findIndex(elm => pingji===elm)*(10/this.pingji.length)
    }

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
        return event2score[trigger_with_role].score/5
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
    this.trigger ||  console.log(this.trigger, _object)
    this.detail = _object.detail

    this.roles = _object.roles.map(item=> {
      let person = personManager.get(item.person)
      person || console.warn(person, '没找到')
      person && person.bindEvent(this)
      return {
        person: person,
        role: item.role,
        // score: eventManager.getScore(this.trigger, item.role),
        tag: this.trigger? this.trigger.name + ' ' + item.role:'不存在trigger'
      }
    })
    this.time_range = _object.time_range

    this.vec = _object.vec
  }

  getPeople(){
    return this.roles.map(elm=>elm.person)
  }
  
  getRole(person){
    for (let index = 0; index < this.roles.length; index++) {
      const role = this.roles[index];
      if (role['person']===person) {
        return role['role']
      }
    }
    return undefined
  }

  //计算事件的重要程度
  getImp(person){
    let role = this.getRole(person)
    let trigger_id = this.trigger.name + ' ' + role
    let trigger_imp = dataStore.trigger_imp
    if (trigger_imp[trigger_id]) {
      trigger_imp = trigger_imp[trigger_id]
    }else{
      trigger_imp = 0.0001
      console.log(trigger_id, '没有重要度')
    }

    let ops_person = person
    this.roles.forEach(elm=>{
      if (elm['person']!=person) {
        ops_person = elm['person']
      }
    })
    // console.log(trigger_imp*ops_person.page_rank)
    // console.log(this, trigger_imp, ops_person.page_rank, trigger_imp*ops_person.page_rank)
    return trigger_imp*ops_person.page_rank
  }

  // 返回一个计算不确定度的度量
  getUncertaintyValue(){
    const {time_range, addrs, trigger} = this
    const people = this.getPeople()
    let uncertainty_value = 1, 
        time_uncertainty = time_range[1]-time_range[0], 
        addr_uncertainty = addrs.length==1? 0: Math.abs(addrs.length-1),
        trigger_uncertainty = 0,
        people_uncertainty = 0 //定义不确定度
    return uncertainty_value /= (time_uncertainty+addr_uncertainty+trigger_uncertainty+people_uncertainty+1)
  }

  toVec(){
    return this.vec
    // return [...this.vec]
  }
  
  getScore(person){
    return eventManager.getScore(this, this.getRole(person))
  }

  isTimeCertain(){
    return isCertainTimeRange(this.time_range)
  }

  // 要有个严格替换的机制
  toText(){
    const {addrs, roles, time_range, trigger} = this
    const time_text = '[' + time_range[0] + ',' + time_range[1] + ']'
    let  addr_text = addrs.map(addr=> addr.name).join(',')
    addr_text = addr_text!==''? '于' + addr_text : addr_text

    let main_person = '未知人物', second_person = '未知人物', third_roles = []
    roles.forEach(elm=>{
      const person = elm.person
      // console.log(elm, person)
      const role = elm.role
      if (role==='主角') {
        main_person = person.name
      }else if(role==='对象'){
        second_person = person.name
      }else{
        third_roles.push(role + ' ' + person.name)
      }
    })
    
    let person_text = main_person
    if(trigger.name.indexOf('Y')!==-1){
      person_text += trigger.name.replace('Y', second_person)
    }else{
      person_text += trigger.name + (second_person==='未知人物'?'':second_person)
    }
    return time_text + ' ' + addr_text + ' ' + person_text
    //  + ' ' + this.detail
    // return jsonFormat(this.toDict())
  }

  toDict(){
    return {
      id: this.id,
      addrs: this.addrs.map(addr=> addr.name),
      roles: this.roles.map(role=>{
        return {
        person:role.person.name, 
        role:role.role 
        } 
      }),
      trigger: this.trigger.name,
      time_range: this.time_range,
      detail: this.detail
    }
  }
  
  // 两个还没用到
  // addAddr(addr){
  //   if (!this.addrs.includes(addr)) {
  //     this.addrs.push(addr)
  //   }
  // }
  // addPerson(person, role){
  //   let has = this.roles.find((item)=> person===item.person&&role===item.role)
  // }
}



// 还没有处理 isNaN()的情况
class Person{
  constructor(_object){
    // console.log(_object)
    this.id = _object.id
    this.name = _object.name

    this.certain_event_num = parseInt(_object.certain_events_num)
    this.event_num = parseInt(_object.events_num)

    this.birth_year = parseInt(_object.birth_year)
    this.death_year = parseInt(_object.death_year)

    // 这个似乎可以去掉了
    this.year2vec = _object.year2vec

    this.page_rank = parseFloat(_object.page_rank)
    this.events = []
    this.dy = parseInt(_object.dy)

    this.vec = _object.vec
  }

  toVec(){
    return this.vec
    // return [...this.vec]
  }
  getRelatedPeople(){
    let people = []
    this.events.forEach(event=>{
      people = [...people, ...event.getPeople()]
    })
    return [...new Set(people)]
  }

  bindEvent(_event){
    if (!this.events.includes(_event)) {
      this.events.push(_event)
    }
  }

  isIn(event){
    return this.events.includes(event)
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


  toText(){
    let text = '(' + this.id + ')' + this.name
    // text += '['
    // if (isValidYear(this.birth_year))
    //   text += this.birth_year
    // text += ','
    // if (isValidYear(this.death_year))
    //   text += this.death_year
    // text += ']  '
    // text += this.certain_event_num + '/' + this.event_num
    return text
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

    this.vec = _object.vec
    // 从属关系构造之后再连接
    this.parents = []
    this.sons = []
  }

  toVec(){
    return this.vec
    // return [...this.vec]
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

    this.vec = _object.vec
  }
  toVec(){
    return this.vec
    // return [...this.vec]
  }
  equal(value){
    return value===this.name || this.parent_type===value || this.type===value
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
const rangeGenrator  = (start, end) => new Array(end - start).fill(start).map((el, i) => start + i);

const filtEvents = (events)=>{
  let used_types = stateManager.used_types
  // console.log(used_types)
  // let isIn = 
  // console.log( used_types, events,  events.filter(event=> 
  //   used_types.includes(event.trigger.name) || 
  //   used_types.includes(event.trigger.parent_type) || 
  //   used_types.includes(event.trigger.parent_type) )
  // )
  return events.filter(event=> used_types.includes(event.trigger.name) || used_types.includes(event.trigger.parent_type) || used_types.includes(event.trigger.parent_type) )
}
export {personManager, addrManager, eventManager, triggerManager, isValidYear, rangeGenrator, filtEvents}
export default dataStore
