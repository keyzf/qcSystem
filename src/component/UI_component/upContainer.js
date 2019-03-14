import React, { Component } from 'react';
import LifeLikePaint from '../graph_component/lifeLikePaint1'
// import InferContour from './component/test_component/inferContour1'
import stateManager from '../../dataManager/stateManager'
import dataStore, { eventManager, addrManager, personManager, isValidYear, filtEvents} from '../../dataManager/dataStore2'
import {observer} from 'mobx-react';
import {autorun} from 'mobx';
import { Dropdown, Input } from 'semantic-ui-react'
import EventFilter from './EventFilter2'

// import { values } from 'mobx';

// 界面的上半部分
// @observer
class UpContainer extends Component {
  calcualte_method_option = [
    { key: '加权平均', text: '加权平均', value: '加权平均' },
  ]

  constructor(){
    super()
    this.state = {
      person_options: [],
      selected_people:[],
      calcualte_method: this.calcualte_method_option[0].value
    }
  }

  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
        let people_list = stateManager.show_people_list
        let person_options = people_list.sort((a, b)=> b.page_rank-a.page_rank).map(person=> {
          return {
              'key': person.id,
              'text': person.toText(),
              'value': person.id,
              'person': person
          }
        })
        this.setState({person_options: person_options})            
    }
  })

  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people})            
    }
  })
  componentWillUpdate() {
    // document.onmousemove = null
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 600,
    };
  }

  render() {
    console.log('render 上半部分')
    let {person_options, selected_people, calcualte_method} = this.state
    let calcualte_method_option = this.calcualte_method_option
    let { width, height} = this.props
    // const padding_botton = 20, padding_right = 10
    const left_part_width = 250, lifeLikePaint_width = width-500
    
    height = height - 20

    selected_people = selected_people.length>=1 ? selected_people : [personManager.get('person_3767')]  //苏轼 
    selected_people = selected_people.filter(person=>person)

    let lifeLikePaint_height = height/selected_people.length
    lifeLikePaint_height = lifeLikePaint_height>200?lifeLikePaint_height:200
    return (
      <div className="up-conainer"  style={{width:width, height:height, position:'absolute'}}>
        {/* 选择人物 */}
        <div style={{top:0, left:10, position:'absolute', width:left_part_width}}>
          <Dropdown 
            fluid multiple search selection 
            placeholder='选择人物' 
            options={person_options}
            onChange={(event,{value})=>{
              console.log('change people')
              stateManager.setSelectedPeople(value)
              // this.setState({selected_people: value.map(person_id=> personManager.get(person_id))})
            }}
            value={selected_people.map(elm=> elm.id)}
            // loading   //可以在之后添加
          />
        </div>

        <div style={{left:10, position:'absolute', top:50 ,width:left_part_width}}>
          <Dropdown 
          placeholder='选择分数计算方法' 
          fluid selection 
          options={calcualte_method_option} defaultValue= {calcualte_method_option[0].value} />
        </div>
        
        <div style={{top: 100,  left:10, position:"relative", width:left_part_width, height: height-100, overflowY:'scroll'}}>
            <EventFilter/>
        </div>

        <div style={{top:0, left:280, position:"absolute",overflowY:'scroll', height:height, width: lifeLikePaint_width}}>
            {
              selected_people.map((person, index)=>
                person &&
                <div 
                  style={{top:index*(lifeLikePaint_height+20), position:"absolute"}} 
                  key={'life_link_paint'+person.id}
                  className={'life_like_paint'+person.id}>
                  <LifeLikePaint 
                    width={1400}
                    height={lifeLikePaint_height} 
                    selected_person={person} 
                    calcualte_method={calcualte_method}/>                  
                </div>
              )
            }
        </div>
      </div>
    );
  }
}


export default UpContainer;