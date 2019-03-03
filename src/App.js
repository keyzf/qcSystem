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
import UpContainer from './component/UI_component/upContainer'

import { Header, Icon, Image, Menu, Segment, Sidebar, Container, Checkbox, Input, Grid, Label, Table, List} from 'semantic-ui-react'
// import { values } from 'mobx';


class App extends Component {
  center_control_bar_top =  500
  constructor(){
    super()
    this.state = {
      // temp_center_control_bar_top: 500,   //拖动时的暂时数据
      center_bar_is_move: false
    }
  }
  
  componentWillUpdate() {
    // document.onmousemove = null
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 1080,
    };
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
    console.log('render App')
    const { width, height} = this.props
    let {center_bar_is_move, temp_center_control_bar_top} = this.state
    let center_control_bar_top = this.center_control_bar_top
    return (
      <div className="App" style={{width:width, height:height, background:'#f0f0f3'}}>
        {/* 上半部分 */}
        <div style={{position:"absolute", top:50, left:0}}>
          <UpContainer width={width} height={center_control_bar_top-40}/>
        </div>

        {/* 中间那根用于调整的杆子(要研究下为什么卡顿) */}
        <div 
          ref='center_control_bar'
          style={{
            top: this.center_control_bar_top, 
            width:width, height:'10px', background:'gray', cursor:'s-resize', position:'absolute', left:0, zIndex:31}}
            onMouseUp={ this.onCenterBarMouseUp}
            onMouseDown={ this.onCenterBarMouseDown }
        >
        </div>
        {/* 加载的缓冲页面（未完成） */}
        <div ref='loading_div' className='loading_div' style={{ display:'none',width:width, height:height, position:"absolute", background:'white', opacity:0.5, zIndex:30 }}/>
        

        {/* 新的推理视图 */}
        <div style={{position:"absolute", top: center_control_bar_top+20, left:760}}>
            <InferContour width={1100} height={height-center_control_bar_top-30}/>
        </div>

        <div style={{position:"absolute", top: center_control_bar_top+20, left:50}}>
            <RelationMatrix width={700} height={height-center_control_bar_top-30}/>
        </div>
      </div>
    );
  }
}

export default App;