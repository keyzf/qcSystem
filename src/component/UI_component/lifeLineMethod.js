import React, { Component } from 'react'
import { Menu, Checkbox, Input,Grid, Segment, List, Form} from 'semantic-ui-react'
import { hidden } from 'ansi-colors';
import stateManager from '../../dataManager/stateManager'
import {observer} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import { on } from 'rsvp';

class LifeLineMethod  extends Component {
    constructor(){
        super()
        this.state = { 
            method: '平均数 * log(事件数)'
        }
    }

    render() {
        let {data, methods, onChange} = this.props
        let new_onChange =  (event, item) => {
            let {checked, my_type, label} = item
            onChange(event, item)
            if (my_type === 'method') {
                if (checked) {
                    this.setState({'method': label})
                }
            }
        }
        // console.log(data)
        return (
            <div>
                <List bulleted>
                    <List.Item as='li'>
                        <List.Header>计算方式</List.Header>
                        <List.List as='ul'>
                        {
                            methods.map(method => 
                                <List.Item as='li' key={method+'check_box'}>
                                    <Checkbox radio value={method} label={method} my_type='method' onChange={new_onChange} checked={this.state.method===method}/> 
                                </List.Item>)
                        }                   
                        </List.List>

                    </List.Item>
                    <List.Item  as='li'>
                        <List.Header>事件类型</List.Header>
                        <List.List  as='ul'>
                        {
                            data && Object.keys(data).sort().map(parent_type=>{
                                let types = data[parent_type]
                                return (
                                <List.Item as='li' key={parent_type+'check_box'}>
                                    <List.Header><Checkbox label={parent_type}  my_type='parent_type' onChange={onChange}/></List.Header>
                                    <List.List as='ul'>
                                        {
                                            true?Object.keys(types).sort().map(type=>{
                                                let triggers = types[type]
                                                return (
                                                    <List.Item  as='li' key={type+'check_box'}>
                                                        <List.Header><Checkbox label={type}  my_type='type' onChange={onChange}/></List.Header>
                                                        <List.List as='ul'>
                                                            {
                                                                // console.log(triggers)
                                                                true?[...triggers].sort().map(trigger=>{
                                                                    return (
                                                                    <List.Item key={trigger+'check_box'} as='li'>
                                                                        <Checkbox label={trigger}  my_type='trigger' onChange={onChange}/>
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
            </div>
        )
    }
}

export default LifeLineMethod