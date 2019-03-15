import React, { Component } from 'react';
import LifeLikePaint from '../graph_component/lifeLikePaint'
// import InferContour from './component/test_component/inferContour1'
import dataStore, { eventManager, personManager, isValidYear } from '../../dataManager/dataStore2'
// import { values } from 'mobx';
import './mainPanel.scss';
import * as d3 from 'd3';
import logo from './static/mountain.png';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'

// 界面的上半部分
// @observer
class MainPanel extends Component {
  constructor(props){
    super(props)
    this.state={
      selected_people:[],
      zoomTransform: null
    }
    let {width,height,padding} = this.props;
    this.xscale=d3.scaleLinear();
    this.zoom = d3.zoom()
    .scaleExtent([1, 9])
    // .translateExtent([[0, 0], [width - padding.left - padding.right, height - padding.top - padding.bottom]])
    .on("zoom", this.zoomed.bind(this));
  }

  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people})            
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
    let {zoomTransform,selected_people} = this.state;
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
    if(zoomTransform){
      this.xscale.domain(zoomTransform.rescaleX(this.xscale).domain());
    }
    return (
      <div className="mainPanel" style={{height:height, width: width}}>
        <header><img className='brand' src={logo}></img><span>Life Mountain View</span></header>
          <div className="lineChart" style={{height:height}}>
            <svg ref="svg" width={chart_width} height={lifeLikePaint_height*(selected_people.length===0?1:selected_people.length)}>
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
                      selected_person={person} 
                      calcualte_method={calcualte_method}/>
                  </g>
                )
              }
            </svg>
          </div>
      </div>
    );
  }
}


export default MainPanel;