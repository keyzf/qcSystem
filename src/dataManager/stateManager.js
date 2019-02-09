// 管理当前的状态
import {observable, action, computed} from 'mobx';
import {personManager} from '../dataManager/dataStore2'

class StateManager{
    @observable is_ready = false  //还没有用，初始化缓存用的
    
    @observable test_count = 0

    // 只影响主视图
    // 存储id,对象忒麻烦了
    @observable selected_people_id = []
    @action addSelectedPeople = (person) => {
        let index = this.selected_people_id.find(id=>id===person.id)
        // console.log(this.selected_people, index)
        if (!index) {
            this.selected_people_id.push(person.id)
            // console.log(this.selected_people)
            // this.test_count++
        }
        console.log(person.id)
    }
    @action deleteSelectedPeople = (person) => {
        if (this.selected_people_id.remove(person.id)) {
            // this.test_count--
        }   
    }
    @computed get selected_people(){
        return this.selected_people_id.map(id=> personManager.get(id))
    }
    
}

var stateManager = new StateManager()
export default stateManager