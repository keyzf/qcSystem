// 存储获取的数据和状态

// 静态数据
// import event2score from '../data/temp_data/event2score.json'   //事件打分
// import all_place from '../data/temp_data/宋朝地点.json'
import stateManager from './stateManager'
import 'whatwg-fetch'
import net_work from './netWork'
// import { convertPatternsToTasks } from 'fast-glob/out/managers/tasks';
// import { set, _isComputingDerivation } from 'mobx';
import guanzhi_pingji from '../data/data_v2_13/官职品级.json'
import pqsort from 'pqsort'
import cos_dist from 'compute-cosine-distance'

// import jsonFormat from 'json-format'

// import {observable, action} from 'mobx';

// 显示中文还是英文
var IS_EN = false

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
    let {people, addrs, triggers, trigger_imp, year2vec} = data
    let can_selected_list = new Set()
    // console.log(people, addrs, triggers)
    // console.log(trigger_imp, people)
    this.trigger_imp = trigger_imp

    for(let year in year2vec){
      // console.log(year)
      timeManager.create(year, year2vec[year])
    }
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
    let {events, addrs, people} = results
    results.triggers = {}

    for(let addr_id in addrs){
      addrs[addr_id] = addrManager.create(addrs[addr_id])
    }
    for(let addr_id in addrs){
      let addr = addrManager.get(addr_id)
      let {sons, parents} = addrs[addr_id]
      // eslint-disable-next-line no-loop-func
      sons.forEach(son_id=> addr.addSon(addrManager.get(son_id)))
      // eslint-disable-next-line no-loop-func
      parents.forEach(parent_id=> addr.addParent(addrManager.get(parent_id)))
    }

    for(let person_id in people){
      people[person_id] = personManager.create(people[person_id])
    }

    for(let event_id in events){
      const _object = events[event_id]
      let event = eventManager.get(event_id)
      // console.log(event)
      if (!event) {
        event = eventManager.create(events[event_id])
      }
      
      if (Object.keys(event.prob_addr).length>0) {
        event.prob_addr = _object.prob_addr
        event.prob_person = _object.prob_person
        event.prob_year = _object.prob_year
      }

      event.addrs.forEach(addr => {
        addrs[addr.id] = addr
      });
      event.roles.forEach(role => {
        let person = role['person']
        people[person.id] = person
      });

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
  
  getAllObjects(){
    return dataStore.dict2array(this.id2object)
  }

  // 使用的时候注意判断是否找到了
  get(_object){
    if (typeof(_object)=='number') {
      _object = _object.toString()
    }
    if(typeof(_object)=='string'){
      let item = this.id2object[_object]
      // item || console.warn(_object, '找不到了！！')
      return item
    }else{
      return this.create(_object) 
    }
  }

  getByName(_name){
    return this.getAllObjects().filter(elm=> elm.name && elm.name===_name)
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

class ObjectManager{
  get(id){
    let managers = [triggerManager, timeManager, addrManager, personManager]
    for (let index = 0; index < managers.length; index++) {
      const manager = managers[index];
      const elm = manager.get(id)
      if (elm) {
        return elm
      }
    }
    return undefined
  }
}

class PersonManager extends Manager{
  constructor(){
    super()
    this._object = Person
  }
}

class TimeManager extends Manager{
  constructor(){
    super()
    this._object = Time
  }
  create(year, vec){
    if (typeof(year)=='number') {
      year = year.toString()
    }
    if (this.id_set.has(year)) {
      return this.get(year)
    }else{
      this.id_set.add(year)
      this.id2object[year] = new Time(year, vec)
      return this.id2object[year]
    }
  }
}

class AddrManager extends Manager{
  constructor(){
    super()
    this._object = Addr
  }
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
  getParentTypes(){
    this.parent_types = new Set()
    for(let id in this.id2object){
      let elm = this.id2object[id]
      this.parent_types.add(elm.parent_type)
    }
    return this.parent_types = [...this.parent_types].sort()
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
    this._object = Event

    this.pingji = ['正一品','从一品','正二品','从二品','正三品','从三品','正四品上','正四品','正四品下','从四品上', '从四品', '从四品下','正五品上','正五品', '正五品下','从五品上', '从五品','从五品下','正六品上','正六品','正六品下','从六品上', '从六品', '从六品下','正七品上', '正七品', '正七品下', '从七品上', '从七品', '从七品下', '正八品上','正八品', '正八品下','从八品上','从八品', '从八品下', '正九品下', '正九品', '正九品下','从九品上', '从九品', '从九品下']
    this.pingji = this.pingji.reverse()
    this.guanzhi2pingji = guanzhi_pingji
  }

  array2year2events(events){
    let year2events = {}
    events.forEach(event=>{
      let year = isValidYear(event.time_range[0])?event.time_range[0]:event.time_range[1]
      year2events[year] = year2events[year] || []
      year2events[year].push(event)
    })
    return year2events
  }

}


class _object{
  constructor(_object){
    this.id = _object.id
    this.name = _object.name
    this.vec = _object.vec
    if (!_object.en_name)
      this.en_name = _object.name
    else
      this.en_name = _object.en_name
  }

  toVec(){
    return this.vec
  }
  
  getName(){
    if (IS_EN)
      return ' ' + this.en_name + ' '
    else
      return this.name
  }

  toText(){
    return '('+ this.id + ')' + this.getName()
  }
}

class Time extends _object{
  static _type = 'time'
  constructor(year, vec){
    let _object = {
      name: year,
      id: year,
      vec: vec,
    }
    super(_object)
  }
}

// 直接给json值加操作好了
class Event extends _object{
  constructor(_object){
    super(_object)
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
        tag: this.trigger? this.trigger.name + ' ' + item.role:'不存在trigger'
      }
    })
    this.time_range = _object.time_range

    this.prob_year = _object.prob_year
    this.prob_addr = _object.prob_addr
    this.prob_person = _object.prob_person
    // console.log(this.prob_year, this.prob_addr, this.prob_person, _object)
  }

  getAllObjects(){
    return [...this.addrs, this.trigger, this.getPeople(), ...this.time_range.map(year=>timeManager.get(year))]
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
      console.warn(trigger_id, '没有重要度')
    }

    let ops_person = person
    this.roles.forEach(elm=>{
      if (elm['person']!=person) {
        ops_person = elm['person']
      }
    })
    // console.log(trigger_imp*ops_person.page_rank)
    // console.log(this, trigger_imp, ops_person.page_rank, trigger_imp*ops_person.page_rank)

    // 这个log是瞎放的
    return Math.log(trigger_imp*ops_person.page_rank+1)
  }

  // 返回一个计算不确定度的度量
  getUncertaintyValue(){
    const {time_range, addrs, trigger} = this
    const people = this.getPeople()
    // let uncertainty_value = 1, 
    //     time_uncertainty = time_range[1]-time_range[0], 
    //     addr_uncertainty = addrs.length===1? 0: Math.abs(addrs.length-1),
    //     trigger_uncertainty = 0,
    //     people_uncertainty = 0 //定义不确定度
    // return uncertainty_value /= (time_uncertainty+addr_uncertainty+trigger_uncertainty+people_uncertainty+1)

    let uncertainty_value = 0
    if (!this.isTimeCertain()) {
      uncertainty_value++
    }
    if(this.addrs.length==0){
      uncertainty_value++
    }
    if (this.trigger.name=='未详') {
      uncertainty_value++
    }
    if (this.getPeople().includes(personManager.getByName('未详')[0])) {
      uncertainty_value++
    }
    return 4-uncertainty_value
  }
  
  getScore(person){
    let trigger = this.trigger
    if (trigger.name === '担任') {
      let guanzhi = this.detail
      const guanzhi2pingji = eventManager.guanzhi2pingji
      if (!guanzhi2pingji[guanzhi]) {
        return 0
      }
      let pingji = guanzhi2pingji[guanzhi]['品级']
      return eventManager.pingji.findIndex(elm => pingji===elm)*(10/eventManager.pingji.length)
    }

    const role = this.getRole(person), role2score = this.trigger.role2score
    return role2score[role] || 0
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
      const name = person.getName()
      // console.log(elm, person)
      const role = elm.role
      if (role==='主角') {
        main_person = name
      }else if(role==='对象'){
        second_person = name
      }else{
        third_roles.push(role + ' ' + name)
      }
    })
    
    let person_text = main_person
    let trigger_name = trigger.getName()
    // console.log(trigger)
    if(trigger_name.indexOf('Y')!==-1){
      person_text += trigger_name.replace('Y', second_person)
    }else{
      person_text += trigger_name + (second_person==='未知人物'?'':second_person)
    }
    
    return '【' + this.id + '】' + (time_text + ' ' + addr_text + ' ' + person_text + this.detail).replace('  ',' ')
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
class Person extends _object{
  static _type = 'person'
  constructor(_object){
    super(_object)

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

  deleteEvent(_event){
    if (this.events.includes(_event)) {
      this.events = this.events.filter(elm=> elm!==_event)
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
    let text = '(' + this.id + ')' + this.getName()
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

  getName(){
    if (IS_EN)
      return ' ' + this.en_name + ' '
    else
      return this.name
  }

  getCertainEvents(){
    return this.events.filter(event=> isCertainTimeRange(event.time_range))
  }
}

class Addr extends _object{
  static _type = 'person'

  constructor(_object){
    super(_object)
    this.alt_names = _object.alt_names
    this.first_year = parseInt(_object.first_year)
    this.last_year = parseInt(_object.last_year)
    this.x = parseFloat(_object.x)
    this.y = parseFloat(_object.y)

    this.vec = _object.vec
    // 从属关系构造之后再连接
    this.parents = []
    this.sons = []

    this.all_sons = undefined
  }

  getAllSons(limit_depth=4){
    let all_sons = new Set()
    let son2depth = {}
    const getAllSons = (addr, depth) => {
      if (all_sons.has(addr)) {
        return
      }
      all_sons.add(addr)
      if (depth===limit_depth-1) {
        return
      }
      addr.sons.forEach(son=>{
        getAllSons(son, depth)
      })
    }

    getAllSons(this, 0)
    return [...all_sons]
  }

  getLeafAddrs(){
    return this.getAllSons().filter(addr=> addr.sons.length===0)
  }

  // 初始化的时候没有用
  addParent(_addr){
    if (!_addr) {
      console.warn('_addr不存在')
      return
    }
    if(!this.parents.includes(_addr))
      this.parents.push(_addr)
    if (!_addr.sons.includes(this)) {
      _addr.sons.push(_addr)
    }
  }
  addSon(_addr){
    if (!_addr) {
      console.warn('_addr不存在')
      return
    }
    if(!this.sons.includes(_addr))
      this.sons.push(_addr)
      if (!_addr.parents.includes(this)) {
        _addr.parents.push(_addr)
      }
  }
}

class Trigger extends _object{
  static _type = 'person'

  constructor(_object){
    super(_object)
    this.type = _object.type
    this.parent_type = _object.parent_type

    this.vec = _object.vec
    this.role2score = _object.role2score

    this.pair_trigger = _object.pair_trigger
  }

  getPairTrigger(){
    let pair_trigger = triggerManager.get(this.pair_trigger)
    return pair_trigger
  }
  equal(value){
    return value===this.name || this.parent_type===value || this.type===value
  }
  getName(){
    if (IS_EN)
      return ' ' + this.en_name.toLowerCase() + ' '
    else
      return this.name
  }
}

var personManager = new PersonManager()
var addrManager = new AddrManager()
var eventManager = new EventManager()
var triggerManager = new TriggerManager()
var dataStore = new DataStore()
var timeManager = new TimeManager()
var objectManager = new ObjectManager()

var isValidYear = (year)=>{
  return year && !isNaN(year) && year!==-9999 && year!==9999
}
var isCertainTimeRange = (time_range)=>{
  return time_range[0]===time_range[1] && isValidYear(time_range[0])
}
const rangeGenrator  = (start, end) => new Array(end - start).fill(start).map((el, i) => start + i);

//为了添加规则而加的过滤器 
const yearFilter = (events)=>{
  let show_years = stateManager.show_years_id,
      show_addrs = stateManager.show_addrs,
      show_people = stateManager.show_people,
      show_triggers = stateManager.show_triggers

  return events.filter(elm => show_years.length===0 || (elm.isTimeCertain && show_years.includes(elm.time_range)))
}
const addrFilter = (events)=>{
  let show_years = stateManager.show_years_id,
      show_addrs = stateManager.show_addrs,
      show_people = stateManager.show_people,
      show_triggers = stateManager.show_triggers

  return events.filter(elm => show_addrs.length===0 || hasSimElmIn(elm.addrs, show_addrs))
}
const peopleFilter = (events)=>{
  let show_years = stateManager.show_years_id,
      show_addrs = stateManager.show_addrs,
      show_people = stateManager.show_people,
      show_triggers = stateManager.show_triggers

  return events.filter(elm => show_people.length===0 || hasSimElmIn(elm.getPeople(), show_people))
}
const triggerFilter = (events)=>{
  let show_years = stateManager.show_years_id,
      show_addrs = stateManager.show_addrs,
      show_people = stateManager.show_people,
      show_triggers = stateManager.show_triggers

  return events.filter(elm => show_triggers.length===0 || show_triggers.includes(elm.trigger))
}

const ruleFilterWith = (events, used_filter)=>{
  if(used_filter.includes('t'))
    events = triggerFilter(events)
  if(used_filter.includes('a'))
    events = addrFilter(events)
  if(used_filter.includes('p'))
    events = peopleFilter(events)
  if(used_filter.includes('y'))
    events = yearFilter(events)
  // console.log(events)
  return events
}

const filtEvents = (events)=>{
  let used_types = stateManager.used_types

  events = events.filter(event=> used_types.includes(event.trigger.name) || used_types.includes(event.trigger.parent_type) || used_types.includes(event.trigger.parent_type) )
  return events
}


const ruleFilter = events=>{
  console.log(stateManager.rules)
  return events.filter(event=>{
    let rules = stateManager.rules
    if (rules.length===0)
      return true
    let objects = event.getAllObjects()
    let is_ok = false
    rules.forEach(role=>{
      if (is_ok)
        return
      let related_object = role.getAllObjects()
      let has_all = true
      related_object.forEach(elm=>{
        if (!objects.includes(elm))
          has_all = false
      })
      if (has_all)
        is_ok = true
    })
    return is_ok
  })
}

const eucDist = (vec1, vec2)=>{
  if (vec1.length!==vec2.length) {
    console.error(vec1, vec2,'长度不相等')
  }
  let total = 0
  for (let index = 0; index < vec1.length; index++) {
    const e1 = vec1[index], e2 = vec2[index]
    total += (e1-e2)*(e1-e2)
  }
  return Math.sqrt(total)
}

const arrayAdd = (arr1, arr2)=> {
  if (!arr1) {
    return arr2 
  }
  if (!arr2) {
    return arr1
  }
  if (arr1.length!=arr2.length) {
    console.warn(arr1, arr2, '没有对齐')
  }
  return arr1.map((elm,index)=> elm+arr2[index])
}

const hasSimElmIn = (objects1, objects2)=>{
  for (let index = 0; index < objects1.length; index++) {
    let elm = objects1[index]
    if (objects2.includes(elm)) {
      return true
    }
  }
  return false
}

const simplStr = (str, num)=>{
  // console.log(getStrLength(str), str, num)
  if (str.length>num) {
      return str.substr(0,num) + '...'
  }else{
    return str
  }
}

const normalizeVec = (vecs)=>{
  if (vecs.length==0) {
    return []
  }
  let vec_length = vecs[0].length
  for (let index = 0; index < vec_length; index++) {
    const max = Math.max(...vecs.map(vec=> vec[index])),
          min = Math.min(...vecs.map(vec=> vec[index]))
    vecs.forEach(vec=>{
      vec[index] = (vec[index]-min)/(max-min)
    })
  }
  return vecs
}
const dictCopy = (elm)=>{
  if (!elm) {
    return elm
  }
  let copy = {}
  for(let key in elm){
    let value = elm[key]
    copy[key] = value
  }
  return copy
}

// 部分排序, 什么垃圾库，有问题
// const mypqsort = (array, top_n, func)=>{
//   let wrap_array= array.map((elm,index)=>{
//     return {
//       value: func(elm),
//       data: elm
//     }
//   })
//   function transform (arr) {
//     return arr.map(function (v, index) { return {value: v, data: index} })
//   }
//   wrap_array = transform([5, 7, 4, 2, 8, 6, 1, 9, 0, 3])

//   console.log(wrap_array, pqsort(wrap_array), top_n)

  
//   wrap_array = pqsort(wrap_array, top_n).slice(0, top_n)
//   return wrap_array.map(elm=> elm.data)
// }

const sortBySimilar = (objects, positive=[], negative=[], top_n=20)=>{
  let total_dist = {}
  objects.forEach(object=>{
    const positive_dist = positive.reduce((total, elm)=>{
      return total + cos_dist(elm.vec, object.vec)
    }, 0)
    const negative_dist = negative.reduce((total, elm)=>{
      return total + cos_dist(elm.vec, object.vec)
    }, 0)
    total_dist[object.id] = positive_dist -negative_dist
  })
  objects = objects.sort((a,b)=> total_dist[a.id]-total_dist[b.id]).slice(0, top_n)
  return objects
}

export {
  personManager, addrManager, eventManager, triggerManager, timeManager, objectManager,

  isValidYear, 
  rangeGenrator, 
  eucDist, 
  arrayAdd, 
  simplStr,
  hasSimElmIn,
  normalizeVec,
  // mypqsort,

  filtEvents, 
  addrFilter,
  yearFilter,
  peopleFilter,
  triggerFilter,
  ruleFilterWith,
  ruleFilter,

  dictCopy,
  sortBySimilar,
}
export default dataStore