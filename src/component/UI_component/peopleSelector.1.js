import React, { Component } from 'react'
import { Menu, Checkbox, Input} from 'semantic-ui-react'
import { hidden } from 'ansi-colors';
// import dataGetter from '../../dataManager/dataGetter2'
import stateManager from '../../dataManager/stateManager'
import {observer} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
// 选择人物
@observer
class PeopleSelector extends Component{
    constructor(){
        super()
        this.state = {
            show_people_list: [],
            all_people_list: []
        }
    }

    _changeShowPeople = autorun(()=>{
        console.log('_changeShowPeople')
        if (stateManager.is_ready) {
            let show_people_list = stateManager.show_people_list
            this.setState({all_people_list: show_people_list})            
        }
    })

    handlePersonClick = (e, {person}) => {
        stateManager.addSelectedPeople(person)
        // this.setState({ select_person: person})
        // console.log(person)
    }

    handleCheckBoxChange = (e, {checked, person})=>{
        // console.log(e, checked, person)
        if(checked){
            stateManager.addSelectedPeople(person)
        }else{
            stateManager.deleteSelectedPeople(person)
        }
    }
   
    static get defaultProps() {
        return {
          width: 250,
          height: 600,
          all_people_list: []
        };
    }

    render(){
        console.log('render peopleSelector')
        // const padding_bottom = 20
        const {height, width} = this.props
        // console.log(height)
        let {show_people_list, all_people_list} = this.state
        show_people_list = show_people_list.length!==0? show_people_list:all_people_list
        // console.log(all_people_list, show_people_list)
        return (
            <div style={{height:height, width:width, paddingLeft:10}}>
                <div style={{margin:10, position:"absolute", top: 0}}>
                  <Input  
                    icon='search'
                    placeholder='Search...' 
                    ref = 'input_search_person'
                    list='people'
                    onKeyPress={(e)=>{
                        let value = e.target.value
                        // console.log(value)
                        if(e.key === 'Enter'){ 
                            let show_people_list = all_people_list.map(person => {
                                let text = person.toText()
                                if(text.indexOf(value)!==-1){
                                    return person
                                }
                                return undefined
                            }).filter(person => person)
                            this.setState({show_people_list: show_people_list})                            
                        }
                    }}
                    fluid
                  />     
                  {/* <datalist id='people'>
                    {
                      show_people_list.map(person=> 
                        <option value={person.toText()} key={'option_select_person' + person.id}>
                        {person.toText()}
                        </option>)
                    }  
                  </datalist>               */}
                </div>
                <div style={{position:'relative', top:60, overflow:hidden, overflowY:'scroll', height: height-60, width:width}}>
                    {/* 侧边框 */}
                    <Menu vertical text>
                      {
                        show_people_list.map(person=> 
                            <Menu.Item 
                            person={person} 
                            key={'select_person' + person.id}  
                            active={show_people_list.includes(person)}
                            position = 'left'
                            color = 'grey'
                            onClick={this.handlePersonClick}
                            >
                              { person.toText() }
                              {/* <Checkbox person={person} onChange={this.handleCheckBoxChange}/> */}
                            </Menu.Item>)
                      }        
                    </Menu>                 
                </div>
            </div>
        )
    }
}

export default PeopleSelector