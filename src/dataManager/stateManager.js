// 管理当前的状态
import {observable, action, computed, autorun} from 'mobx';
import {personManager, triggerManager, eventManager} from '../dataManager/dataStore2'

class StateManager{
    @observable is_ready = false  //还没有用，初始化缓存用的
    
    is_ready_without_notice = false
    notice_ready = autorun(()=>{
        this.is_ready_with_out_notice = this.is_ready
    })

    // 测试用平时用不到的
    @observable test_count = 0

    // 存储id,对象忒麻烦了
    @observable selected_people_id = ['person_3767']
    @action setSelectedPeople = (person_ids) => {
        this.selected_people_id.replace(person_ids)
    }
    @computed get selected_people(){
        // console.log(this.selected_people_id)
        return this.selected_people_id.map(id=> personManager.get(id))
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
    selected_event_id = observable.box('event_216572')
    @action setSelectedEvent(event){
        // console.log(event, this.selected_uncertainty_event_id)
        event && this.selected_event_id.set(event.id)
    }
    @computed get selected_event(){
        return eventManager.get(this.selected_event_id)
    }

    @observable used_types_set = []
    @action setUsedTypes(types){
        console.log(types)
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