// 管理当前的状态
import {observable, action, computed, autorun} from 'mobx';
import {personManager, triggerManager, eventManager, addrManager} from '../dataManager/dataStore2'
import cos_dist from 'compute-cosine-distance'

class StateManager{
    @observable is_ready = false  //还没有用，初始化缓存用的
    @observable need_refresh = 0 

    @action refresh(){
        this.need_refresh++
    }

    // 用来存储选择人物后地图显示的events
    @observable people_map_event_ids = []
    @action setPeopleMapEvents(events){
        this.people_map_event_ids.replace(events.map(elm=> elm.id))
        // console.log(this.people_map_event_ids)
    }
    //用来存储选择人物后表格显示的events
    @observable people_table_event_ids = []
    @action setPeopleTableEvents(events){
        // console.error('这里这里')
        this.people_table_event_ids.replace(events.map(elm=> elm.id))
    }

    is_ready_without_notice = false
    notice_ready = autorun(()=>{
        this.is_ready_with_out_notice = this.is_ready
    })

    @observable type2p = {
        '其它': 1,
        '军事': 1,
        '学术': 1,
        '宗教': 1,
        '政治': 1,
        '社交': 1,
        '著述': 1,
    }
    @observable life_refresh = true
    @action setType2p(type, p){
        this.type2p[type] = p
        this.life_refresh = !this.life_refresh
    }


    // 测试用平时用不到的
    @observable test_count = 0

    @observable relation_event_ids = []
    @observable map_event_ids = []
    @observable mountain_event_ids = []
    @action setRelationEvents(events){
        // console.log(events)
        this.relation_event_ids.replace(events.map(elm=> elm.id))
    }
    @action setMapEvents(events){
        // console.log(events)
        this.map_event_ids.replace(events.map(elm=> elm.id))
    }
    @action setMountainEvents(events){
        this.relation_event_ids.replace(events.map(elm=> elm.id))
    }

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
        // console.log(this.selected_people_id.slice(), this.selected_people_id.slice().map(id=> personManager.get(id)))
        return this.selected_people_id.slice().map(id=> personManager.get(id)).filter(elm=>elm)
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

    // 过滤器
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
}

var stateManager = new StateManager()
export default stateManager