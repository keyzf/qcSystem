import React, { Component } from 'react';
// import { Container } from 'semantic-ui-react'
// import PoetRelationships from './component/test_component/poetRelationships'
// import PersonalTimeLine from './component/test_component/personalTimeLine'
// import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
// import MainGraph from './component/test_component/mianGraph7'
import LifeLikePaint from './component/graph_component/lifeLikePaint1'
import TestLifeLikePaint from './component/test_component/lifeLikePaint3'
// import EventNumPerYear from './component/test_component/eventNumPerYear'
// import EventHappenOverview from './component/test_component/eventHappenOverview'
// import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
import EventMatrix from './component/test_component/eventMatrix2'
import people_list from './data/temp_data/all_persons.json'
import PeopleSelector from './component/UI_component/peopleSelector'

import { Header, Icon, Image, Menu, Segment, Sidebar, Container, Checkbox, Input, Grid, Label, Table, List} from 'semantic-ui-react'
import { values } from 'mobx';


class App extends Component {
  constructor(){
    super()
    this.state = {
      people_list: people_list.data,
      select_person: people_list.data[0],
    }
  }
  
  componentDidMount() {
  }


  render() {
    console.log('render App')
    let show_people_list = this.state.people_list

    const { select_person} = this.state
    // style={{width:'100%', height:'100%'}}
    return (
      <div className="App"  style={{width:1920, height:1080, background:'#f0f0f3'}}>  
        {/*选择人物*/}
        <PeopleSelector all_people_list={show_people_list}/>

        {/* 人生轨迹 */}
        <div style={{position:"absolute", top:10, left:500}}>
          <LifeLikePaint width={1200} select_person={select_person}/>
        </div>

        <div style={{position:"absolute", top:500, left:500}}>
          <TestLifeLikePaint width={500} height={500}/>
        </div>

        {/* 推理试图 */}
        {/* <div style={{position:"absolute", top:625, left:20}}>
          <EventMatrix width={600} height={450}/>
        </div> */}

      </div>
    );
  }
}

export default App;