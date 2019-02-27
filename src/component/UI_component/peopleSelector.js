import React, { Component } from 'react'
import { Menu, Checkbox, Input, Dropdown} from 'semantic-ui-react'
import { hidden } from 'ansi-colors';
// import dataGetter from '../../dataManager/dataGetter2'
import stateManager from '../../dataManager/stateManager'
import {observer} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
// 选择人物，已经没用了
@observer
class PeopleSelector extends Component{
    constructor(){
        // console.log('contruct PeopleSelector')
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
        const {height, width} = this.props
        let {show_people_list, all_people_list} = this.state
        let person_options = all_people_list.sort((a, b)=> b.page_rank-a.page_rank).map(person=> {
            return {
                'key': person.toText(),
                'text': person.toText(),
                'value': person.toText(),
                'person': person
            }
        })
        return (
            <div style={{height:height, width:width, paddingLeft:10}}>
                <Dropdown fluid placeholder='选择人物' multiple search selection options={person_options} defaultValue={person_options[0] && person_options[0].key} />
            </div>
        )
    }
}

export default PeopleSelector