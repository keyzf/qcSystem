import React from 'react';
import stateManager from '../../../../dataManager/stateManager'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../../../dataManager/dataStore2'
import * as d3 from 'd3';
import Places from './Places';
import song from './static/song.json';
import {autorun} from 'mobx';

class Map extends React.Component {
  constructor (props) {
      super(props);
      this.state = {
        selected_people:[],
        places: [],
        event: undefined
      };
      this.init = this.init.bind(this);
      // 定义地图投影
      this.projection = d3.geoEquirectangular()
                          .center([110, 29])
                          .scale(850)
                          .translate([props.width / 2, props.height / 2]);
      // 定义地理路径生成器
      this.path = d3.geoPath()
                    .projection(this.projection);
      this.colors = d3.scaleOrdinal(d3.schemeAccent);
      this.handleMouseOver = this.handleMouseOver.bind(this);
      this.rscale = d3.scaleLinear()
                      .domain([1,10])
                      .range([3,10])
      this.zoom = d3.zoom()
                    .scaleExtent([0.5, 9])
                    .on("zoom", this.zoomed.bind(this));
  }
  _getSelectedEvent = autorun(()=>{
    if(stateManager.is_ready){
      let selected_people = stateManager.selected_people;
      let event_id = stateManager.selected_event_id.get()
      let event = eventManager.get(event_id)
      console.log(event);
      this.setState({
        event: event,
        selected_people: selected_people
      })
    }
  })
  componentDidMount(){
    this.init();
    this.handleMouseOver();
    d3.select(this.refs.geomap)
      .call(this.zoom)
  }

  componentDidUpdate(){
    d3.select(this.refs.geomap)
      .call(this.zoom)
  }
  
  zoomed(){
    let node = this.refs.map;
    // d3.select(node).attr('transform',d3.event.transform)
  }
  static get defaultProps() {
    return {
      width: 450,
      height: 340,
    };
  }
  init () {   
    let node = this.refs.geomap;
    d3.select(node).selectAll("path")
      .data(song.features)
      .enter().append("path")
      .attr('stroke', '#666666')
      .attr('stroke-width', 1)
      .attr('fill', d=>{
        if(d.properties.H_SUP_PROV==="Song Dynasty"||d.properties.H_SUP_PROV===null) return '#cfcfcf';
        else return '#ffffff';
      })
      .attr("d", this.path);
  }
  componentDidUpdate(){
    this.handleMouseOver();
  }
  handleMouseOver(){
    let node = this.refs.places;
    d3.select(node)
      .on('mouseover',()=>{
        let target = d3.select(d3.event.srcElement);
        if(target.node().tagName==='circle'){
          let targetdata = target.datum();
          console.log(targetdata)
          let addr=`地点：${targetdata.addr.name} ${targetdata.event.map(d=>d.toText())}`;
          let pos = d3.mouse(node);
          d3.select(node).select('foreignObject')
            .attr('visibility','visible')
            .attr('x',pos[0])
            .attr('y',pos[1])
            .select('div')
            .select('span')
            .text(addr)
        }
      })
      .on('mouseout',()=>{
        d3.select(node).select('foreignObject')
        .attr('visibility','hidden')
      })
  }
  render () {
    let {width,height}= this.props;
    let {selected_people} = this.state;
    this.colors.domain([0,selected_people.length]);
    // console.log(selected_people)
    return (
      <div className='geomap'>
        <svg width={width} height={height}>
          <g ref="map">
            <g ref='geomap'>
            </g>
            <g ref="places">
              <foreignObject x="20" y="22" width="120" height="100" visibility="hidden">
                <div style={{width:120,height:100,position:'absolute',backgroundColor:'rgba(100,100,100,0.4)',borderRadius:'5px',overflowY:'scroll'}}>
                  <span></span>
                </div>
              </foreignObject >
              {selected_people.map((person,i)=>{
                console.log(this.colors(i));
                return person&&<Places key={i} selected_person={person.id} projection={this.projection} color={this.colors(i)} path={this.path} rscale={this.rscale}/>
              })}
            </g>
          </g>
        </svg>
      </div>
    );
  }
}
export default Map;