import React from 'react';
import stateManager from '../../../../dataManager/stateManager'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../../../dataManager/dataStore2'
import * as d3 from 'd3';
import Places from './Places';
import song from './static/song.json';

class Map extends React.Component {
  constructor (props) {
      super(props);
      this.state = {
        places: [],
      };
      this.init = this.init.bind(this);
      this.addMaker = this.addMaker.bind(this);
      // 定义地图投影
      this.projection = d3.geoMercator()
                          .center([110, 31])
                          .scale(650)
                          .translate([props.width / 2, props.height / 2]);
      // 定义地理路径生成器
      this.path = d3.geoPath()
                    .projection(this.projection);
  }
  componentDidMount(){
    this.init();
    // this.addMaker();
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
    // this.addMaker();
  }
  addLine(){
   
  }
  addMaker(){
    let node = this.refs.geomap;
    console.log(this.state.places);
    d3.select(node).selectAll("circle")
    .data(this.state.places)
    .enter()
    .append("circle")
    .attr('r',4)
    .attr("transform", (d)=>{
      console.log(this.projection([
        d.x,
        d.y
      ]))
      return "translate(" + this.projection([
        d.x,
        d.y
      ]) + ")";
    })
    .attr('fill','#4846a3')
    .attr('stroke','#333333')
  }
  render () {
    let {width,height,selected_people}= this.props;
    selected_people = selected_people&&selected_people.length>=1 ? selected_people : [personManager.get('3767')]  //苏轼 
    selected_people.filter(person=>person)
    console.log(selected_people)
    return (
      <div className='geomap'>
        <svg width={width} height={height}>
          <g ref='geomap'>
            {selected_people.map((person,i)=>{
              return person&&<Places key={i} selected_person={person.id} projection={this.projection}/>
            })}
          </g>
        </svg>
      </div>
    );
  }
}
export default Map;