//显示词人的关系
import React, { Component } from 'react'
import * as d3 from 'd3';
// import dataStore from '../../dataManager/dataStore'
import dataGetter from '../../dataManager/dataGetter'
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import {XYPlot, XAxis, YAxis, HorizontalGridLines, LineSeries, MarkSeriesCanvas, LineSeriesCanvas} from 'react-vis';
import ForceDirectedGraph from './forceDirectedGraph'

// css直接写入组件中
class PoetRelationships extends Component {
  constructor(props, context){
    super(props, context)
    //剪枝
    // let d_nodes = [], d_links = []

    this.state = {
      domestic_realtions : [],
      id2persn : {},
      selectPeople: [],
      width : this.props.width? this.props.width : 1000,
      height : this.props.height? this.props.height : 1000,
      data : {
        nodes : [], 
        links : []
      }
    }
  }

  componentWillMount() {
    let selectPeople = ['蘇軾']

    // 处理关系
    let domestic_realtions = []
    selectPeople.forEach(personName => {
      domestic_realtions = [...domestic_realtions, ...dataGetter.getPeopleRelationByName(personName, 4)]
    })
    // console.log(domestic_realtions)
    
    let nodes = [], links = [], id2person = {}, person2id = {}
    for (let index = 0; index < domestic_realtions.length; index++) {
      const element = domestic_realtions[index];
      links.push( {"source": element.to_id, "target": element.from_id, "value": 10})
      id2person[element.from_id] = element.from
      id2person[element.to_id] = element.to
      person2id[element.to] = element.to_id
      person2id[element.from] = element.from_id
    }           

    // console.log(person2id)
    for (const id in id2person) {
      if (id2person.hasOwnProperty(id)) {
        let is_poet = dataGetter.isPoetById(id)
        let group =  is_poet? 1 : 0

        let is_selected = selectPeople.indexOf(dataGetter.getPersonName(id)) !== -1
        group = is_selected? 2 : group

        let this_person = {"id": id, "group": group, "color": group, "name": id2person[id]}
        nodes.push(this_person)
      }
    } 

    this.setState({
      'data' : {
        'nodes' : nodes,
        'links' : links
      }
    })

  }

  componentDidMount() {
  
  }
  
  render() {
    console.log(this.state.data)
    return (
      <div className="poet_relationships">
          <ForceDirectedGraph data={this.state.data} height={this.state.height} width={this.state.width} strength={10}/>
      </div>
    );
  }
}
  

  export default PoetRelationships;