import React, { Component } from 'react';
import LifeLikePaint from '../graph_component/lifeLikePaint'
// import InferContour from './component/test_component/inferContour1'
import dataStore, { eventManager, personManager, isValidYear, IS_EN } from '../../dataManager/dataStore2'
// import { values } from 'mobx';
import './mainPanel.scss';
import * as d3 from 'd3';
import logo from './static/mountain.png';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';
import HistoryEvent from '../graph_component/HistoryEvent';
import legend from './static/legend.png';

// 界面的上半部分
// @observer
class MainPanel extends Component {
  constructor(props){
    super(props)
    this.state={
      checked:true,
      selected_people:[],
      zoomTransform: null,
      relationLines: []
    }
    let {width,height,padding} = this.props;
    this.xscale=d3.scaleLinear();
    this.zoom = d3.zoom()
    // .scaleExtent([0.5, 9])
    // .translateExtent([[0, 0], [width - padding.left - padding.right, height - padding.top - padding.bottom]])
    .on("zoom", this.zoomed.bind(this));
    this.changeViewType=this.changeViewType.bind(this);
    this.handleEventMarkClick = this.handleEventMarkClick.bind(this);
    this.all_events=[];
  }

  _changeShowPeople = autorun(()=>{
    let selected_people = stateManager.selected_people
    if (stateManager.is_ready) {
      selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people});
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

  handleLineMouseOver(e,d){
    let node = this.refs.relationLines;
    // let pos = d3.mouse(node);
    // console.log(pos);
    d3.select(node).select('.relationLineInfo')
      .attr('visibility','visible')
      .attr('x',e.offsetX)
      .attr('y',e.offsetY)
      .select('div')
      .select('span')
      .text(d.event.toText())
  }

  handleLineMouseOut(){
    let node = this.refs.svg;
    d3.select(node).select('.relationLineInfo')
    .attr('visibility','hidden')
  }

  changeViewType=()=>{
    this.setState({
        checked: !this.state.checked,
    });
  }

  zoomed() {
    this.setState({ 
      zoomTransform: d3.event.transform
    });
  }

  
  handleEventMarkClick = value => {
    const event = eventManager.get(value.id)
    stateManager.setSelectedEvent(event)
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 650,
      padding:{
        right: 40,
        left: 20,
        top:10,
        bottom:10
      }
    }
  }

  render() {
    // console.log('render 上半部分')
    let { width, height, padding, calcualte_method} = this.props;
    let {zoomTransform,selected_people,relationLines,checked} = this.state;
    // const padding_botton = 20, padding_right = 10
    // console.log(selected_people);
    let lifeLikePaint_height = (height-10)/(selected_people.length===0?1:selected_people.length);
    lifeLikePaint_height = lifeLikePaint_height>175?lifeLikePaint_height:175;
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
    let uncertainHeight = 60;
    this.xscale.domain([min,max])
               .range([0,chart_width]);
    this.line=d3.line()
               .x((d,i)=>{
                  return this.xscale(d.x)
                })
               .y((d)=>{
                  return lifeLikePaint_height*d.person_index-50
                })
               .curve(d3.curveBasis)
    if(zoomTransform){
      this.xscale.domain(zoomTransform.rescaleX(this.xscale).domain());
    }
    return (
      <div className="mainPanel" style={{height:height, width: width}}>
        <div className="header">
          <div className="headerlogo">
          <img className='brand' src={logo}></img>
          </div>
          <div className="headerText">
            {/* <span>行迹</span> */}
            <span>Life Mountain View</span>
          </div>
        </div>
          <div className="lineChart" style={{height:height}}>
            <svg ref="svg" width={chart_width} height={lifeLikePaint_height*(selected_people.length===0?1:selected_people.length)}>
              <defs>
                <linearGradient id="linear" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#222222" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear0" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#0F3F53" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear1" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#1B5D59" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear2" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#AB8E52" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear3" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#92AA84" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear4" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#DBB397" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear5" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%"   stopColor="#57A399" stopOpacity="1.0" />
                </linearGradient>
                <linearGradient id="linear6" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#DDB56D" stopOpacity="1.0" />
                </linearGradient>
              </defs>
              <g transform={'translate(0,5)'}>
              {
                selected_people.map((person, index)=>
                  person &&
                  <g key={'life_link_paint'+person.id}
                    width={chart_width}
                    className={'life_like_paint'+person.id}>
                    <LifeLikePaint 
                      zoomTransform={zoomTransform}
                      xscale={this.xscale}
                      width={chart_width}
                      height={lifeLikePaint_height} 
                      index = {index}
                      checked={checked}
                      transform={`translate(0,${lifeLikePaint_height*index})`}
                      selected_person={person} 
                      calcualte_method={calcualte_method}
                      uncertainHeight={uncertainHeight}
                      handleEventMarkClick={this.handleEventMarkClick}
                      line={this.line}/>
                  </g>
                )
              }
              </g>
              <HistoryEvent xscale={this.xscale} translate={`translate(0, ${padding.top+lifeLikePaint_height-uncertainHeight})`} width={width} height={lifeLikePaint_height} zoomTransform={zoomTransform} uncertainHeight={uncertainHeight}></HistoryEvent>
              {/* <image href={legend} x={70} y={10} /> */}
            </svg>
          </div>
      </div>
    );
  }
}


export default MainPanel;