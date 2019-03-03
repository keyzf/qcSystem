// 管理当前的状态
import {observable, action, computed} from 'mobx';
import {personManager} from '../dataManager/dataStore2'

class StateManager{
    @observable is_ready = false  //还没有用，初始化缓存用的
    
    @observable test_count = 0

    // 只影响主视图,现在估计没用了
    // 存储id,对象忒麻烦了
    @observable selected_people_id = ['person_3767']
    @action addSelectedPeople = (person) => {
        this.selected_people_id.clear()
        this.selected_people_id.push(person.id)
        return
    }
    @action setSelectedPeople = (person_ids) => {
        this.selected_people_id.replace(person_ids)
    }
    @action deleteSelectedPeople = (person) => {
        return
        // eslint-disable-next-line no-unreachable
        if (this.selected_people_id.remove(person.id)) {
            // this.test_count--
        }   
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

    // 存储推测的事件
    selected_event_id = observable.box('event_216572')
    @action setSelectedEvent(event){
        // console.log(event, this.selected_uncertainty_event_id)
        event && this.selected_event_id.set(event.id)
    }
}

var stateManager = new StateManager()
export default stateManager