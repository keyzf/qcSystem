import React, { Component } from 'react';
// import { Container } from 'semantic-ui-react'
// import PoetRelationships from './component/test_component/poetRelationships'
// import PersonalTimeLine from './component/test_component/personalTimeLine'
// import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
// import MainGraph from './component/test_component/mianGraph7'
import LifeLikePaint from './component/graph_component/lifeLikePaint1'
import InferContour from './component/graph_component/inferContour1'
import RelationMatrix from './component/graph_component/relationMatrix2'
// import TestLifeLikePaint from './component/test_component/lifeLikePaint3'
// import EventNumPerYear from './component/test_component/eventNumPerYear'
// import EventHappenOverview from './component/test_component/eventHappenOverview'
// import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
// import EventMatrix2 from './component/test_component/eventMatrix2'
// import EventMatrix from './component/graph_component/eventMatrix1'
// import people_list from './data/temp_data/all_persons.json'
import PeopleSelector from './component/UI_component/peopleSelector'
import MainPanel from './component/UI_component/mainPanel'
import Map from './component/graph_component/mapChart'
import { Dropdown, Input } from 'semantic-ui-react';
import stateManager from './dataManager/stateManager';
import {autorun} from 'mobx';
import LifeLineMethod from './component/UI_component/lifeLineMethod';
import { triggerManager,personManager } from './dataManager/dataStore2'
// import { values } from 'mobx';
import EventFilter from './component/UI_component/EventFilter';
import './main.scss';


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
  }

  _loadData = autorun(()=>{
    if (stateManager.is_ready) {
      console.log('加载苏轼数据');
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
    console.log(value);
    if(value.length!==0){
      this.setState({selected_people: value.map(person_id=> personManager.get(person_id))})
    }
    else{
      this.setState({
        selected_people:[this.defaultPerson]
      })
    }
  }
  onCenterBarMouseUp = event=> {
    // let {temp_center_control_bar_top} = this.state
    this.refs.loading_div.style.display = 'none'
    this.setState({
      center_bar_is_move: !this.state.center_bar_is_move,
    })
    document.onmousemove = null
  }

  onCenterBarMouseDown = event=> {
    if(!this.state.center_bar_is_move || true){
      document.onmousemove = (event) => {
        event = event || window.event;
        let y = event.clientY
        const { height} = this.props
        if (y>0 && y<=height) {
          // console.log(this.refs.center_control_bar)
          this.refs.center_control_bar.style.top = y + 'px'
          this.center_control_bar_top = y
          console.log(this.refs.loading_div.display)
          this.refs.loading_div.style.display = 'block'
          // let {center_bar_is_move} = this.state
          // if(!center_bar_is_move)
          //   this.setState({center_bar_is_move:true})
        }else{
          this.onCenterBarMouseUp()
        }
      }
    }
  }

  render() {
    console.log('render App');
    let {person_options, selected_people, calcualte_method} = this.state
    let calcualte_method_option = this.calcualte_method_option;
    let relation=triggerManager.countTypes();
    const { width, height} = this.props
    let center_control_bar_top = this.center_control_bar_top
    const left_between_relation_infer = 800;
    console.log(selected_people)
    return (
      <div id="wrap" style={{width:width, height:height}}>
        {/* 上半部分 */}
        <div id="selectview">
          {/* 选择人物 */}
          <div className="leftPanel">
            <div className="title"></div>
            <div className="container">
            <label>筛选人物</label>
            <Dropdown 
              fluid multiple search selection 
              placeholder='选择人物' 
              options={person_options}
              onChange={this.changeSelectPeople}
              // loading   //可以在之后添加
            />
            <label>计算方式（下拉选择）</label>
            <Dropdown 
            placeholder='选择分数计算方法' 
            fluid selection 
            options={calcualte_method_option} defaultValue= {calcualte_method_option[0].value} />
            <div className={'filter'} style={{ height:'82%', overflowY:'scroll'}}>
              <EventFilter/>
            </div>
            </div>
          </div>
          <MainPanel height={700} calcualte_method={this.state.calcualte_method} selected_people={selected_people}/>
        </div>

        {/* 中间那根用于调整的杆子(要研究下为什么卡顿) */}
        {/* <div 
          ref='center_control_bar'
          style={{
            top: this.center_control_bar_top, 
            width:width, height:'10px', background:'gray', cursor:'s-resize', position:'absolute', left:0, zIndex:31}}
            // onMouseUp={ this.onCenterBarMouseUp}
            // onMouseDown={ this.onCenterBarMouseDown }
        >
        </div> */}
        {/* 加载的缓冲页面（未完成） */}
        {/* <div ref='loading_div' className='loading_div' style={{ display:'none',width:width, height:height, position:"absolute", background:'white', opacity:0.5, zIndex:30 }}/> */}
        

        {/* 新的推理视图 */}
        <div id="footer">
          <div id="mapview">
            <header>Inference Tree Map</header>
            <Map selected_people={this.state.selected_people}/>
          </div>
          <div id="matrixview">
            <header>Inference Tree Map</header>
            {/* <RelationMatrix/> */}
          </div>

          <div id="relationview">
            <header>Inference Tree Map</header>
            <InferContour height={300}/>
          </div>
        </div>
      </div>
    );
  }
}

export default App;