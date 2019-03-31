import React from 'react';
import stateManager from '../../../../dataManager/stateManager'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../../../dataManager/dataStore2'
import * as d3 from 'd3';
import Places from './Places';
import song from './static/song.json';
import {autorun} from 'mobx';
import EventTooltip from '../../../UI_component/eventTooltip';
import route from './static/route.png';
import legend from './static/legendmap.png';
import './style/map.scss';
import { IS_EN } from '../../../../dataManager/dataStore2';

class Map extends React.Component {
  constructor (props) {
      super(props);
      this.state = {
        selected_people:[],
        places: [],
        event: undefined,
        chooseEvent: undefined,
        selectAddr: ''
      };
      this.init = this.init.bind(this);
      // 定义地图投影
      this.projection = d3.geoMercator()
                          .center([112, 29])
                          .scale(1000)
                          .translate([props.width / 2, props.height / 2]);
      // 定义地理路径生成器
      this.path = d3.geoPath()
                    .projection(this.projection);
      this.colors = d3.scaleOrdinal(d3.schemeSet2);
      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.closePopup = this.closePopup.bind(this);
      this.selected = 0;
  }
  _getSelectedEvent = autorun(()=>{
    if(stateManager.is_ready){
      let used_types = stateManager.used_types
      let need_refesh = stateManager.need_refresh
      let selected_people = stateManager.selected_people;
      let event_id = stateManager.selected_event_id.get()
      let event = eventManager.get(event_id)
      this.setState({
        event: event,
        selected_people: selected_people
      })
    }
  })
  
  componentDidMount(){
    this.init();
    this.handleMouseOver();
    let map = this.refs.map;
    d3.select(map)
      .call(d3.zoom()
              .on("zoom", function(){
                d3.select(map).select('.child').attr('transform',d3.event.transform)
            }))
  }
  
  static get defaultProps() {
    return {
      width: 448,
      height: 510,
    };
  }
  init () {   
    let node = this.refs.geomap;
    d3.select(node).selectAll("path")
      .data(song.features)
      .enter().append("path")
      .attr('stroke',d=>{
        if(d.properties.H_SUP_PROV==="Song Dynasty"||d.properties.H_SUP_PROV===null) return '#999999';
        else return '#bbbbbb';
      } )
      .attr('stroke-width', 1)
      .attr('fill', d=>{
        if(d.properties.H_SUP_PROV==="Song Dynasty"||d.properties.H_SUP_PROV===null) return '#efefef';
        else return '#ffffff';
      })
      .attr("d", this.path);
    let pos = this.projection([112, 31]);
    console.log(pos);
    d3.select(node)
      .append('text')
      .text(()=>{
        if(IS_EN) return 'Song';
        else return '宋';
      })
      .attr('x',pos[0])
      .attr('y',pos[1])
  }
  componentDidUpdate(){
    this.handleMouseOver();
  }
  handleMouseOver(){
    let node = this.refs.places;
    d3.select(node)
      .on('mouseover',()=>{
        let target = d3.select(d3.event.srcElement.parentNode);
        if(target.attr('class')){
        if(target.attr('class').substr(0,3)==='pie'){
          let targetdata = target.datum();
          let pos = d3.mouse(node);
          this.setState({
            chooseEvent : targetdata.events,
            selectAddr : targetdata.addr.getName()
          })
          pos[0]=pos[0]+10;
          pos[1]=pos[1]+10;
          if(pos[0]>this.props.width-190) pos[0]=pos[0]-190;
          if(pos[1]>this.props.height-targetdata.events.length*30) pos[1]=pos[1]-targetdata.event*30;
          d3.select('#geomap').select('#mapEventTooltip')
            .attr('visibility', 'visible')
            .attr('x',pos[0])
            .attr('y', pos[1])
        }
      }
      })
      .on('mouseout',()=>{
        if(this.selected===0){
          d3.select('#geomap').select('#mapEventTooltip')
            .attr('visibility','hidden')
        }
      })
      .on('mousedown',()=>{
        let target = d3.select(d3.event.srcElement.parentNode);
        if(target.attr('class')){
        if(target.attr('class').substr(0,3)==='pie'){
          let targetdata = target.datum();
          let pos = d3.mouse(node);
          this.setState({
            chooseEvent : targetdata.events,
            selectAddr : targetdata.addr.getName()
          })
          pos[0]=pos[0]+10;
          pos[1]=pos[1]+10;
          if(pos[0]>this.props.width-190) pos[0]=pos[0]-190;
          if(pos[1]>this.props.height-targetdata.events.length*30) pos[1]=pos[1]-targetdata.event*30;
          d3.select('#geomap').select('#mapEventTooltip')
            .attr('visibility', 'visible')
            .attr('x',pos[0])
            .attr('y', pos[1])
        }
        this.selected = 1;
      }
      })
  }

  closePopup(){
    d3.select('#geomap').select('#mapEventTooltip').attr('visibility','hidden');
    this.selected = 0;
  }

  render () {
    let {width,height}= this.props;
    let {selected_people,chooseEvent,selectAddr} = this.state;
    this.colors.domain([0,selected_people.length]);
    let isonly = 0;
    if(selected_people.length===1){
      isonly = 1;
    }
    return (
      <div id='geomap'>
        <svg width={width} height={height}>
          <g ref="map">
            <g className="child">
              <g ref='geomap'>
              </g>
              <g ref="places">
                {selected_people.map((person,i)=>{
                  return person&&<Places key={i} selected_person={person} projection={this.projection} color={this.colors(i)} path={this.path} index={i}/>
                })}
              </g>
              <g id="selectedPlace"></g>
            </g>
          </g>
          <foreignObject id="mapLegend" x="10" y="5" width="200" height="80">
            <div>
              <img src={legend}/>
            </div>
          </foreignObject >
          <foreignObject id="mapEventTooltip" x="0" y="0" width="200" height="190" visibility={'hidden'}>
            <EventTooltip event={chooseEvent} closePopup={this.closePopup} name={selectAddr}/>
          </foreignObject>
        </svg>
      </div>
    );
  }
}
export default Map;