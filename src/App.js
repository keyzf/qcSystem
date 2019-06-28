import React, { Component } from 'react';
// import { Container } from 'semantic-ui-react'
// import PoetRelationships from './component/test_component/poetRelationships'
// import PersonalTimeLine from './component/test_component/personalTimeLine'
// import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
// import MainGraph from './component/test_component/mianGraph7'
// import LifeLikePaint from './component/graph_component/lifeLikePaint1'
import InferContour from './component/graph_component/inferContour1'
import RelationMatrix from './component/graph_component/relationMatrix2'
// import TestLifeLikePaint from './component/test_component/lifeLikePaint3'
// import EventNumPerYear from './component/test_component/eventNumPerYear'
// import EventHappenOverview from './component/test_component/eventHappenOverview'
// import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
// import EventMatrix2 from './component/test_component/eventMatrix2'
// import EventMatrix from './component/graph_component/eventMatrix1'
// import people_list from './data/temp_data/all_persons.json'
// import PeopleSelector from './component/UI_component/peopleSelector'
import MainPanel from './component/UI_component/mainPanel'
import Maps from './component/graph_component/mapChart'
import { Dropdown, Input } from 'semantic-ui-react';
import stateManager from './dataManager/stateManager';
import {autorun} from 'mobx';
// import LifeLineMethod from './component/UI_component/lifeLineMethod';
import dataStore, { triggerManager,personManager,IS_EN } from './dataManager/dataStore2'
import PersonInfo from './component/UI_component/PersonInfo';
import EventFilter from './component/UI_component/EventFilter2';
// import InferSunBurst from './component/graph_component/inferSunBurst';
import EventTable from './component/UI_component/EventTable';
import InferSunBurst from './component/graph_component/inferSunBurst6';
import './main.scss';
import menu from './static/menu.png';
import songicon from './static/logo.png';
import maplogo from './static/maplogo.png';
import matrixlogo from './static/matrixlogo.png';
import reasonlogo from './static/reasonlogo.png';
import '../node_modules/react-vis/dist/style.css';
import net_work from './dataManager/netWork';
import EventMatrix from './component/graph_component/eventMatrix1';
// import  MergeSunBurstGraph from './component/UI_component/mergeSunBurstFraph'


class App extends Component {
  center_control_bar_top =  500;
  calcualte_method_option = [
    { key: '加权平均', text: '加权平均', value: '加权平均' },
  ]
  constructor(){
    super();
    this.state = {
      // temp_center_control_bar_top: 500,   //拖动时的暂时数据
      center_bar_is_move: false,
      person_options: [],
      selected_people:[],
      calcualte_method: this.calcualte_method_option[0].value
    }
    this.changeSelectPeople=this.changeSelectPeople.bind(this);
    this.allPage = 0;
    this.toggleLayout = this.toggleLayout.bind(this);
  }

  _loadData = autorun(()=>{
    if (stateManager.is_ready) {
      // console.log('加载苏轼数据');
      this.defaultPerson = personManager.get('person_3767');
      this.setState({
        selected_people:[this.defaultPerson]
      })
    }
  })
    
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
        this.setState({person_options: person_options});
    }
  })
  
  _onSelectedPeopleChange = autorun(()=>{
    let selected_people = stateManager.selected_people
    if (stateManager.is_ready) {
      // console.log()
      selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people})
    }
  })
  componentWillUpdate() {
    // document.onmousemove = null
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 1080,
    };
  }

  changeSelectPeople=(event,{value})=>{
    event.preventDefault();
    // console.log(value);
    if(value.length!==0){
      let selected_people = value.map(person_id=> personManager.get(person_id))
      this.setState({selected_people: value.map(person_id=> personManager.get(person_id))})
      let former_selected_people = stateManager.selected_people
      if(former_selected_people.length>value.length){
        stateManager.setSelectedPeople(value)
      }
      selected_people.forEach(person => {
        if (!former_selected_people.includes(person)) {
          net_work.require('getPersonEvents', {person_id:person.id})
          .then(data=>{
            // console.log(data)
            if(data){
                data = dataStore.processResults(data)
                this.all_events = dataStore.dict2array(data.events)
                stateManager.setSelectedPeople(value)
                stateManager.setPeopleTableEvents(selected_people[0].events)
            }
          })
        }
      });
      // console.log(selected_people)
      stateManager.setPeopleTableEvents(selected_people[0].events)
    }
    else{
      this.setState({
        selected_people:[this.defaultPerson]
      })
    }
  }

  toggleLayout(e){
      const node = this.refs.inferSun;
      if(!this.allPage){
          node.classList.add('allPage');
          this.allPage = 1;
      }
      else{
          node.classList.remove('allPage');
          this.allPage = 0;
      }
  }

  render() {
    // console.log('render App');
    let {person_options, selected_people, calcualte_method} = this.state
    // console.log(selected_people)
    let calcualte_method_option = this.calcualte_method_option;
    let relation=triggerManager.countTypes();
    const { width, height} = this.props
    let center_control_bar_top = this.center_control_bar_top
    const left_between_relation_infer = 800;
    // console.log(selected_people)
    return (
      <div id="wrap" style={{width:width, height:height}}>
        <div id="mainHeader">
          <div id="toggleDyn"><img src={menu}></img></div>
          <img className="mainLogo" src={songicon}></img>
          <div className="togglelanguage">
            <button className={IS_EN?'':'choosedLang'}>中文</button>
            <button className={IS_EN?'choosedLang':''}>ENGLISH</button>
          </div>
        </div>
        {/* 上半部分 */}
        <div id="selectview">
          {/* 选择人物 */}
          <div className="leftPanel">
            <div className="title">
              <PersonInfo/>
            </div>
            <div className="container">
            <label>{IS_EN?'History Figures':'筛选人物'}</label>
            <Dropdown 
              fluid multiple search selection 
              placeholder={IS_EN?'Select people':'选择人物'}
              className="selection_person"
              options={person_options}
              value={this.state.selected_people.map(elm=> elm.id)}
              onChange={this.changeSelectPeople}
              // loading   //可以在之后添加
            />
            <label>{IS_EN?'Event Weight':'评分值'}</label>
            <div className={'filter'}>
              <EventFilter/>
            </div>
            </div>
          </div>
          <div>
            <MainPanel height={540} width={1340} calcualte_method={this.state.calcualte_method} selected_people={selected_people}/>
          </div>
          <div className="rightPanel">
            <EventTable/>
          </div>
        </div>

        {/* 新的推理视图 */}
        <div id="footer">
          <div id="mapview">
            <div className="header">
              <div className="headerlogo">
                <img src={maplogo}/>
              </div>
              <div className="headerText">
                {/* <span>行迹</span> */}
                <span>Map View</span>
              </div>
            </div>
            <Maps selected_people={this.state.selected_people}/>
          </div>
          <div id="relationview" ref="inferSun">
            <div className="header">
              <div className="headerlogo">
                <img src={reasonlogo} alt=''/>
              </div>
              <div className="headerText">
                {/* <span>推理视图</span> */}
                <span>Uncertainty Reasoning View</span>
              </div>
            </div>
            <InferSunBurst height={465} width={1000} toggleLayout={this.toggleLayout}/>
          </div>
          <div id="matrixview">
            <div className="header">
              <div className="headerlogo">
                <img src={matrixlogo}/>
              </div>
              <div className="headerText">
                {/* <span>关系矩阵</span> */}
                <span>Relation Matrix View</span>
              </div>
            </div>
            <RelationMatrix />
          </div>
        </div>
        
      </div>
    );
  }
}

export default App;