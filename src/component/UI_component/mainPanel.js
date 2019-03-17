import React, { Component } from 'react';
import LifeLikePaint from '../graph_component/lifeLikePaint'
// import InferContour from './component/test_component/inferContour1'
import dataStore, { eventManager, personManager, isValidYear } from '../../dataManager/dataStore2'
// import { values } from 'mobx';
import './mainPanel.scss';
import * as d3 from 'd3';
import logo from './static/mountain.png';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';
import net_work from '../../dataManager/netWork'

// 界面的上半部分
// @observer
class MainPanel extends Component {
  constructor(props){
    super(props)
    this.state={
      checked:false,
      selected_people:[],
      zoomTransform: null,
      relationLines: []
    }
    let {width,height,padding} = this.props;
    this.xscale=d3.scaleLinear();
    this.getRelationLine = this.getRelationLine.bind(this);
    this.zoom = d3.zoom()
    .scaleExtent([0.5, 9])
    // .translateExtent([[0, 0], [width - padding.left - padding.right, height - padding.top - padding.bottom]])
    .on("zoom", this.zoomed.bind(this));
    this.changeViewType=this.changeViewType.bind(this);
  }

  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people}) 
      net_work.require('getPersonEvents', {person_id:selected_people[0].id})
      .then(data=>{
          if(data){
              data = dataStore.processResults(data)
              this.all_events = dataStore.dict2array(data.events)
              this.all_events = this.all_events.filter(event=> event.isTimeCertain())
              this.getRelationLine();
          }
      })           
    }
  })

  componentDidMount(){
    d3.select(this.refs.svg)
      .call(this.zoom)
  }

  componentDidUpdate(){
    d3.select(this.refs.svg)
      .call(this.zoom)
  }

  getRelationLine(){
    console.log(this.all_events);
    let {selected_people} = this.state;
    let other_people = selected_people.slice(1);
    console.log(other_people);
    let relationLines = [];
    if(selected_people.length>0){
      this.all_events.forEach((d,index)=>{
        let tmp = {};
        if(d.roles.length>1){
          for(let i=0;i<d.roles.length;i++){
            let person_index = other_people.indexOf(d.roles[i].person);
            if(person_index!==-1){
              let tmpLines=[];
              tmp.event = d;
              tmpLines.push({'person_index':0,'x':d.max_prob_year});
              tmpLines.push({'person_index':(person_index+1)/2,'x':d.max_prob_year});
              tmpLines.push({'person_index':person_index+1,'x':d.max_prob_year});
              tmp.lines = tmpLines;
              relationLines.push(tmp);
            }
          }
        }
      })
    }
    this.setState({
      relationLines: relationLines
    })
  }

  changeViewType=()=>{
    this.setState({
        checked: !this.state.checked
    });
  }

  zoomed() {
    this.setState({ 
      zoomTransform: d3.event.transform
    });
  }
  static get defaultProps() {
    return {
      width: 1920,
      height: 650,
      padding:{
        right: 50,
        left: 20,
        top:10,
        bottom:10
      }
    }
  }

  render() {
    console.log('render 上半部分')
    let { width, height, padding, calcualte_method} = this.props;
    let {zoomTransform,selected_people,relationLines,checked} = this.state;
    // const padding_botton = 20, padding_right = 10
    console.log(selected_people);
    let lifeLikePaint_height = height/(selected_people.length===0?1:selected_people.length);
    lifeLikePaint_height = lifeLikePaint_height>210?lifeLikePaint_height:210;
    let min = 9999;
    let max = -9999;
    selected_people.forEach((person)=>{
      if(person.birth_year!==-9999 && person.birth_year < min){
        min = person.birth_year;
      }
      if(person.death_year!==9999 && person.death_year > max){
        max = person.death_year;
      }
    });
    let chart_width = width - padding.left - padding.right;
    let chart_height = height - padding.top - padding.bottom;
    this.xscale.domain([min,max])
               .range([0,chart_width]);
    this.line=d3.line()
               .x((d)=>this.xscale(d.x))
               .y((d)=>{
                 console.log(d)
               //  console.log(this.xscale(d.x),paintHeight*d.person_index)
                return lifeLikePaint_height*(d.person_index+1)-25
              })
               .curve(d3.curveBasis)
    if(zoomTransform){
      this.xscale.domain(zoomTransform.rescaleX(this.xscale).domain());
    }
    return (
      <div className="mainPanel" style={{height:height, width: width}}>
        <header><img className='brand' src={logo}></img><span>Life Mountain View</span></header>
          <div className="lineChart" style={{height:height}}>
            <svg ref="svg" width={chart_width} height={lifeLikePaint_height*(selected_people.length===0?1:selected_people.length)}>
              <foreignObject className="lifeMountain" x="20" y="22" width="120" height="100">
                <div className="ui toggle checkbox">
                    <input type="checkbox" name="public" onChange={this.changeViewType} checked={this.state.checked}/>
                    <label>分类视图</label>
                </div>
              </foreignObject >
              <defs>
              <linearGradient id="linear" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#222222" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear0" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6eadd" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#acaf77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear1" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6e8d8" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#c4c7a1" stopOpacity="0.8" />
                <stop offset="100%"   stopColor="#a7ad77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear2" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#c8dbe1" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#4e7884" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear3" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#b4bdd3" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#36539a" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear4" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8ea698" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#415232" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear5" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f0ebdf" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#a19a8a" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear6" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#222222" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear7" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6eadd" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#acaf77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear8" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6e8d8" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#c4c7a1" stopOpacity="0.8" />
                <stop offset="100%"   stopColor="#a7ad77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear9" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#c8dbe1" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#4e7884" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear10" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#b4bdd3" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#36539a" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear11" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8ea698" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#415232" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear12" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f0ebdf" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#a19a8a" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear13" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6eadd" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#acaf77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear14" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#e6e8d8" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#c4c7a1" stopOpacity="0.8" />
                <stop offset="100%"   stopColor="#a7ad77" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear15" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#f0ebdf" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#a19a8a" stopOpacity="1.0" />
              </linearGradient>
              <linearGradient id="linear16" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#c8dbe1" stopOpacity="0.5" />
                <stop offset="100%"   stopColor="#4e7884" stopOpacity="1.0" />
              </linearGradient>
            </defs>
              {
                selected_people.map((person, index)=>
                  person &&
                  <g key={'life_link_paint'+person.id}
                    width={chart_width}
                    className={'life_like_paint'+person.id}
                    transform={`translate(0,${lifeLikePaint_height*index})`}>
                    <LifeLikePaint 
                      zoomTransform={zoomTransform}
                      xscale={this.xscale}
                      width={chart_width}
                      height={lifeLikePaint_height} 
                      index = {index}
                      checked={checked}
                      selected_person={person} 
                      calcualte_method={calcualte_method}/>
                  </g>
                )
              }
              {relationLines.map((d,i)=>{
                console.log(d);
                return (<path key={i} d={this.line(d.lines)} fill="none" stroke="black"></path>);
              })}
            </svg>
          </div>
      </div>
    );
  }
}


export default MainPanel;