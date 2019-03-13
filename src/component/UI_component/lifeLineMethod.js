import React, { Component } from 'react'
import { Checkbox, List} from 'semantic-ui-react'
import './lifeLineMethod.scss';

class LifeLineMethod  extends Component {

    render() {
        let {data, onChange} = this.props
        return (
            <div id={'listTable'}>
                <List bulleted>
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
                                                                false?[...triggers].sort().map(trigger=>{
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