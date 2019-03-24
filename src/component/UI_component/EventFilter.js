import React, { Component } from 'react'
import { Checkbox, List} from 'semantic-ui-react'
import { triggerManager } from '../../dataManager/dataStore2'
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import { EMLINK } from 'constants';
import './eventFilter.scss';

class EventFilter  extends Component {
    constructor(){
        super()
        this.state = {
            data : {},
            check_box2checked: {},
        }
    }
    son2parent ={}
    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            let data =  triggerManager.countTypes()
            console.log(data)
            const check_box2checked = this.state.check_box2checked
            for(let parent_type in data){
                let elm = data[parent_type]
                check_box2checked[parent_type] = check_box2checked[parent_type] || false
                for(let type in elm){
                    this.son2parent[type] = parent_type
                    const trigger_names = elm[type]
                    check_box2checked[type] = check_box2checked[type] || false
                    trigger_names.forEach(trigger_name => {
                        this.son2parent[trigger_name] = type
                        check_box2checked[trigger_name] = check_box2checked[trigger_name] || false
                    });
                }
            }
            this.setState({data: data, check_box2checked: check_box2checked})
        }
    })

    static get defaultProps() {
        return {
        //   onChange: () => {}
        };
    }

    onChange =  (event, {checked, my_type, label})=>{
        let {data, check_box2checked} = this.state
        const {son2parent} = this

        // console.log(event, checked, my_type, label)
        if (my_type==='parent_type') {
            const setSons = (parent_type, checked)=>{
                let elm = data[parent_type]
                check_box2checked[parent_type] = checked
                for(let type in elm){
                    const trigger_names = elm[type]
                    check_box2checked[type] =  checked
                    trigger_names.forEach(trigger_name => {
                        check_box2checked[trigger_name] =  checked
                    });
                }
            }
            setSons(label, checked)
        }else if(my_type==='type'){
            const setSons = (type, checked)=>{
                const parent_type = son2parent[type]

                // 这里似乎有问题
                let all_brother_is_checked = true
                Object.keys(data[parent_type]).forEach(type=>{
                    if (!check_box2checked[type]) {
                        all_brother_is_checked = false
                    }
                })
                if(all_brother_is_checked){
                    check_box2checked[parent_type] = true
                }

                const trigger_names = data[parent_type][type]
                check_box2checked[type] =  checked
                trigger_names.forEach(trigger_name => {
                    check_box2checked[trigger_name] =  checked
                });
            }
            setSons(label, checked)
            const parent_type = son2parent[label]
            if (!checked) {
                check_box2checked[parent_type] = checked
            }
        }else{
            check_box2checked[label] = checked
            const type = son2parent[label]
            if (!checked) {
                check_box2checked[type] = checked
            }
        }
        let used_types = Object.keys(check_box2checked).filter( tag => check_box2checked[tag])
        stateManager.setUsedTypes(used_types)
        this.setState({check_box2checked: check_box2checked})
    }
    render() {
        let {onChange} = this
        let {data, check_box2checked} = this.state
        console.log(data)
        return (
                <List bulleted>
                    <List.Item  as='li'>
                        <List.Header>事件类型</List.Header>
                        <List.List  as='ul'>
                        {
                            data && Object.keys(data).sort().map(parent_type=>{
                                let types = data[parent_type]
                                return (
                                <List.Item as='li' key={parent_type+'check_box'}>
                                    <List.Header><Checkbox label={parent_type}  my_type='parent_type' onChange={onChange} checked={check_box2checked[parent_type]}/></List.Header>
                                    <List.List as='ul'>
                                        {
                                            true?Object.keys(types).sort().map(type=>{
                                                let triggers = types[type]
                                                return (
                                                    <List.Item  as='li' key={type+'check_box'}>
                                                        <List.Header><Checkbox label={type}  my_type='type' onChange={onChange}  checked={check_box2checked[type]}/></List.Header>
                                                        <List.List as='ul'>
                                                            {
                                                                // console.log(triggers)
                                                                false?[...triggers].sort().map(trigger=>{
                                                                    return (
                                                                    <List.Item key={trigger+'check_box'} as='li'>
                                                                        <Checkbox label={trigger}  my_type='trigger' onChange={onChange}  checked={check_box2checked[trigger]}/>
                                                                    </List.Item>                                                                        
                                                                    )
                                                                }):undefined                                            
                                                            }
                                                        </List.List>
                                                    </List.Item>
                                                )
                                            }):undefined                                            
                                        }
                                    </List.List>
                                </List.Item>
                                )
                            })
                        }
                        </List.List>
                    </List.Item>
                </List>          
        )
    }
}

export default EventFilter