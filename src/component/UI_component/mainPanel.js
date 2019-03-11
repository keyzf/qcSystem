import React, { Component } from 'react';
import LifeLikePaint from '../graph_component/lifeLikePaint1'
// import InferContour from './component/test_component/inferContour1'
import dataStore, { eventManager, personManager, isValidYear } from '../../dataManager/dataStore2'
// import { values } from 'mobx';
import './mainPanel.scss'

// 界面的上半部分
// @observer
class MainPanel extends Component {


  constructor(){
    super()
    
  }


  componentWillUpdate() {
    // document.onmousemove = null
  }

  handleSelectBarChange = (event, {checked, my_type, label})=>{
    console.log(event,checked, my_type, label,this);
    // const {selected_person} = this.props
    // // console.log(event, checked, my_type, label, this)
    // if (stateManager.is_ready) {
    //     let {selected_event_types} = this
    //     let trigger_name = label
    //     // console.log(checked)
    //     if (checked) {
    //         if (!selected_event_types.includes(trigger_name)) {
    //             selected_event_types.push(trigger_name)
    //         }     
    //     }else{
    //         this.selected_event_types = selected_event_types.filter(elm=> elm!==trigger_name)
    //     }
    //     // console.log(selected_event_types)
    // }
    // this.loadLifeLineData(selected_person)         
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 700,
    };
  }

  render() {
    console.log('render 上半部分')
    let { width, height, selected_people, calcualte_method} = this.props
    // const padding_botton = 20, padding_right = 10
    const left_part_width = 250, lifeLikePaint_width = 1350
    selected_people = selected_people.length>=1 ? selected_people : [personManager.get('3767')]  //苏轼 
    selected_people.filter(person=>person)
    console.log(selected_people);
    let lifeLikePaint_height = (height-50)/selected_people.length
    lifeLikePaint_height = lifeLikePaint_height>250?lifeLikePaint_height:250
    return (
        <div className="mainPanel" style={{height:height, width: lifeLikePaint_width}}>
          <header>Life Mountain View</header>
            <div className="lineChart" style={{height:height-50}}>
            {
              selected_people.map((person, index)=>
                person &&
                <div 
                  style={{top:index*(lifeLikePaint_height+20)}} 
                  key={'life_link_paint'+person.id}
                  className={'life_like_paint'+person.id}>
                  <LifeLikePaint 
                    width={lifeLikePaint_width}
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


export default MainPanel;