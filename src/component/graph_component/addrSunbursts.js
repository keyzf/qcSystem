
import React from 'react';
import PropTypes from 'prop-types';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import jsonFormat from 'json-format'
import {XYPlot,ContourSeries, YAxis, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis, ArcSeries} from 'react-vis';
import * as d3 from 'd3'
// import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear, rangeGenrator } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { link } from 'fs';
import { Header, Divider, Icon, Image, Menu, Segment, Sidebar, Container, Checkbox, Input, Grid, Label, Table, List, Button} from 'semantic-ui-react'


const PI = Math.PI;
class AddrSunBursts extends React.Component {
  addr2level = {}
  addr2node = {}
  nodes = []
  level2num = {}
  all_addrs = new Set()


  show_level = 3 //默认显示的level

  leaf_node_angle = PI/1000

  center_addr = undefined

  constructor(){
    super()
    this.state = {
      // data: updateData(),
      // littleData: updateLittleData(),
      // value: false,
      hint_value: undefined,
      addr_arc_data: [],
    };

  }

  _load_data = autorun(()=>{
    if (stateManager.is_ready) {
      this.center_addr = addrManager.get('addr_10989')
      this.refresh()
    }
  })

  // level2angle = (level)=>{
  //   return Math.PI*2/Math.pow(2, level)
  // }

  addNode(addr, level, radius0, start_angle, end_angle){
    let {addr2level, addr2node, nodes, all_addrs, leaf_node_angle} = this
    if (all_addrs.has(addr)) {
      console.warn(addr, '成环了')
      return
    }

    const radius = radius0 + 10
    addr2level[addr.id] = level
    let node = {
      angle0: start_angle,
      angle: end_angle,
      radius0: radius0,
      radius: radius,
      level: level,
      color: level,
      addr_id: addr.id
    }
    addr2node[addr.id] = node
    nodes.push(node)

    if (level===this.show_level-1) {
      return
    }
    addr.sons.forEach( (son,index) => {
      let leaf_addrs = son.getLeafAddrs()
      let angle = start_angle + leaf_node_angle * leaf_addrs.length
      this.addNode(son, level+1, radius+1, start_angle, angle)
      start_angle = angle
    });
  }

  refresh(){
    let {show_level, center_addr} = this
    this.all_addrs = new Set()
    this.addr2level = {}
    this.addr2node = {}
    this.nodes = []
    this.level2num = {}

    if (!center_addr) {
      console.warn('中心事件不存在')
      return
    }
    console.log('更新地点', center_addr)

    let leaf_addrs_num = center_addr.getLeafAddrs().length
    this.leaf_node_angle = 2*PI/leaf_addrs_num
    console.log(this.leaf_node_angle)

    this.addNode(center_addr, 0, 0, 0, 2*PI)
    let {addr2level, addr2node, nodes, all_addrs} = this

    // 统计各个level的数量
    let level2num = {}
    let levels = dataStore.dict2array(addr2level)
    let max_level = Math.max(...levels)
    rangeGenrator(0,max_level).forEach(level=>{
      level2num[level] = levels.filter(elm=> elm===level).length
    })
    this.level2num = level2num

    this.setState({addr_arc_data: nodes})
  }

  componentWillMount(){

  }

  static get defaultProps() {
    return {
      width: 800,
    };
  }


  render() {
    console.log('render 地点结构树')
    let {addr_arc_data, hint_value} = this.state
    let {width} = this.props

    // console.log(addr_arc_data)
    return (
      <div>
        <XYPlot width={width} height={width} 
        onMouseLeave={()=>{
          this.center_addr=addrManager.get('addr_10989');
          this.refresh()
        }}>
          {/* <XAxis />
          <YAxis /> */}
          <ArcSeries
            // animation
            // radiusType={'literal'}
            data={addr_arc_data}
            center={{x: 0, y: 0}}
            stroke='white'
            style={{strokeWidth: 1}}
            onValueClick={value=>{
              const addr = addrManager.get(value.addr_id)
              this.center_addr = addr
              this.refresh()
            }}
            onNearestXY={
              value=>{
                this.setState({hint_value: value})
              }
            }
          />
          {
            hint_value && 
            <Hint value={hint_value}>
                <div style={{ fontSize: 8, padding: '10px', color:'white', background:'black'}}>
                    {
                      (()=>{
                        const addr = addrManager.get(hint_value.addr_id)
                        return addr.getName()
                      })()
                    }
                </div>
            </Hint>
          }
        </XYPlot>
      </div>
    );
  }
}


export default AddrSunBursts