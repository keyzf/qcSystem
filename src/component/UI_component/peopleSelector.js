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


    static get defaultProps() {
        return {
          all_people_list: []
        };
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
    generateText = (person) => '(' + person.id + ') ' + person.name + ' [' + person.birth_year + ',' + person.death_year + ']'

    render(){
        console.log('render peopleSelector')
        let {show_people_list, all_people_list} = this.state
        show_people_list = show_people_list.length!==0? show_people_list:all_people_list
        // console.log(all_people_list, show_people_list)
        return (
            <div style={{top:0, left:0, height:600, width:250, paddingLeft:10}}>
                <div style={{margin:10, position:"absolute", top: 10}}>
                  <Input  
                    icon='search'
                    placeholder='Search...' 
                    ref = 'input_search_person'
                    list='people'
                    onKeyPress={(e)=>{
                        let value = e.target.value
                        console.log(value)
                        if(e.key === 'Enter' || true){ 
                            let show_people_list = all_people_list.map(person => {
                                let text = this.generateText(person)
                                if(text.indexOf(value)!==-1){
                                    return person
                                }
                                return undefined
                            }).filter(person => person)
                            console.log(show_people_list)
                            this.setState({show_people_list: show_people_list})                            
                        }else{

                        }
                    }}
                  />     
                  {/* <datalist id='people'>
                    {
                      show_people_list.map(person=> 
                          <option value={person} key={'option_select_person' + person.id}>
                            {this.generateText(person)}
                          </option>)
                    }  
                  </datalist>               */}
                </div>
                <div style={{position:'relative', top:60, overflow:hidden, overflowY:'scroll', height: 550}}>
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