// 管理当前的状态
import {observable, action, computed, autorun} from 'mobx';
import {personManager, triggerManager, eventManager, addrManager} from '../dataManager/dataStore2'
import cos_dist from 'compute-cosine-distance'

class StateManager{
    @observable is_ready = false  //还没有用，初始化缓存用的
    @observable need_refresh = 0 

    @observable refresh(){
        this.need_refresh++
    }
    
    is_ready_without_notice = false
    notice_ready = autorun(()=>{
        this.is_ready_with_out_notice = this.is_ready
    })

    @observable type2p = {
        '其他': 0.5,
        '军事': 0.5,
        '学术': 0.5,
        '宗教': 0.5,
        '政治': 0.5,
        '社交': 0.5,
        '著述': 0.5,
    }
    @observable life_refresh = true
    @action setType2p(type, p){
        // console.log(type, p)
        // let type2p = this.type2p
        // type2p[type] = p
        this.type2p[type] = p
        this.life_refresh = !this.life_refresh
        // console.log(this.type2p.)
    }

    // 测试用平时用不到的
    @observable test_count = 0

    @observable relation_event_ids = []
    @observable map_event_ids = []
    @observable mountain_event_ids = []
    @action setRelationEvents(events){
        console.log(events)
        this.relation_event_ids.replace(events.map(elm=> elm.id))
    }
    @action setMapEvents(events){
        this.map_event_ids.replace(events.map(elm=> elm.id))
    }
    @action setMountainEvents(events){
        this.relation_event_ids.replace(events.map(elm=> elm.id))
    }

    @observable center_person_id = observable.box('person_3767')
    @observable setCenterPerson = person => {
        this.center_person_id = person.id
        this.selected_people_id.replace([person.id])
    }
    // @computed center_person = ()=>{
    //     // const id = this.center_person_id.get()
    //     // console.log(id)
    //     return undefined 
    //     // personManager.get(id) 
    // }

    // 存储id,对象忒麻烦了
    @observable selected_people_id = ['person_3767']
    @action setSelectedPeople = (person_ids) => {
        if (person_ids.length===0) {
            this.selected_people_id.replace(['person_3767'])
            return
        }
        this.selected_people_id.replace(person_ids)
    }
    @computed get selected_people(){
        // console.log(this.selected_people_id)
        console.log(this.selected_people_id.slice(), this.selected_people_id.slice().map(id=> personManager.get(id)))
        return this.selected_people_id.slice().map(id=> personManager.get(id))
    }
    @action addSelectedPeople = (person_id)=>{
        let selected_people_id = this.selected_people_id.slice()
        // console.log(selected_people_id, person_id)
        if (!selected_people_id.includes(person_id)) {
            selected_people_id.push(person_id)
            this.selected_people_id.replace(selected_people_id)
        }
    }
    
    // 左侧可以选的人的名单
    @observable show_people_id_list = []
    @action setShowPeopleList = (list) =>{
        // console.log(list)
        list = list.sort((a,b)=> parseInt(a.page_rank)-parseInt(b.page_rank)).map(person=> person.id)
        // console.log(list.length)
        this.show_people_id_list.replace(list)
    }
    @computed get show_people_list(){
        return this.show_people_id_list.map(id=> personManager.get(id))
    }

    // 存储正在推测的事件
    selected_event_id = observable.box('event_218347')
    @action setSelectedEvent(event){
        // console.log('jjjjjjjjj')
        // console.log(event, this.selected_uncertainty_event_id)
        event && this.selected_event_id.set(event.id)
    }
    @computed get selected_event(){
        // console.log(this.selected_event_id)
        return eventManager.get(this.selected_event_id.get())
    }

    @observable used_types_set = []
    @action setUsedTypes(types){
        // console.log(types)
        types = [...new Set(types)]
        this.used_types_set.replace(types)
    }
    @computed get used_types(){
        let used_types = this.used_types_set.slice()
        if (used_types.length===0) {
            // console.log(triggerManager.getAlltypes())
            return triggerManager.getAlltypes()
        }else{
            // console.log(used_types)
            return used_types
        }
    }

    @observable show_triggers_id = []
    @observable show_people_id = []
    @observable show_years_id = []
    @observable show_addrs_id = []
    @action setShowTriggers(ids){
        this.need_refresh++
        this.show_triggers_id.replace(ids)
    } 
    @action setShowAddrs(ids){
        this.need_refresh++
        this.show_addrs_id.replace(ids)
    }
    @action setShowYears(ids){
        this.need_refresh++
        this.show_years_id.replace(ids)
    } 
    @action setShowPeople(ids){
        this.need_refresh++
        this.show_people_id.replace(ids)
    }

    @computed get show_triggers(){
        let show_triggers_id = this.show_triggers_id.slice()
        return show_triggers_id.map(id=> triggerManager.get(id))
    }
    @computed get show_addrs(){
        let show_addrs_id = this.show_addrs_id.slice()
        return show_addrs_id.map(id=> addrManager.get(id))
    }
    @computed get show_people(){
        let show_people_id = this.show_people_id.slice()
        return show_people_id.map(id=> personManager.get(id))
    }
    @computed get show_years(){
        return this.show_years_id.slice()
    }


    rules = []  //存新的推理图的rules
    @action setRules(rules){
        this.rules = rules
        console.log(rules)
        stateManager.need_refresh++
    }
}

var stateManager = new StateManager()
export default stateManager