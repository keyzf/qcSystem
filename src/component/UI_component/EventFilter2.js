import React, { Component } from 'react'
import { Checkbox, List, Image} from 'semantic-ui-react'
import dataStore, { eventManager, addrManager, personManager, isValidYear, triggerManager } from '../../dataManager/dataStore2'
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import { black } from 'ansi-colors';
import './EventFilter.scss';

class EventFilter  extends Component {
    constructor(){
        super()
        this.state = {
            data : {},
            check_box2checked: {},
        }
        this.onChange = this.onChange.bind(this);
    }
    son2parent ={}
    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            let data =  triggerManager.countTypes()
            // console.log(data)
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

    onChange =  (e, my_type, label)=>{
        let {data, check_box2checked} = this.state
        const {son2parent} = this
        let checked = e.target.checked;
        console.log(e, checked, my_type, label)
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
        // console.log(data)
        return (
            <ul>
                {
                    data && Object.keys(data).sort().map((parent_type,i)=>{
                        // let triggers = triggerManager.getAllObjects().filter(elm=> elm.parent_type===parent_type).slice(0,2)
                        return (
                        <li key={parent_type}>
                            <div>
                                <div className="squaredThree">
                                    <input type="checkbox" id={`squaredThree${i}`} onChange={(e)=>this.onChange(e,'parent_type',parent_type)} checked={check_box2checked[parent_type]}></input>
                                    <label htmlFor={`squaredThree${i}`} ></label>
                                </div>
                                <label className="labelName">{parent_type}</label>
                                {/* <span id="rs-bullet" class="rs-label">0</span> */}
                                <input defaultValue='0.5' ref={parent_type} type="range" className={'rs-range'} id="start" name="volume" min="0" max="1" step="0.05"
                                onChange={event=>{
                                    let this_input = this.refs[parent_type]
                                    let value = parseFloat(this_input.value)
                                    stateManager.setType2p(parent_type, value)
                                }}/>
                                {/* <Checkbox label={parent_type} my_type='parent_type' onChange={onChange} checked={check_box2checked[parent_type]}/> */}
                                {/* <List.Description>
                                    {triggers.map(elm=> elm.)}
                                </List.Description> */}
                            </div>
                        </li>
                        )                            
                    })
                }

            </ul>      
        )
    }
}

export default EventFilter