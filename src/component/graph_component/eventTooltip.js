import React from 'react';
import * as d3 from 'd3';
import clear from '../../static/clear.png';

export default class eventTooltip extends React.Component{
  constructor(){
    super();
    this.selected = 0;
  }
  closePopup(){
    d3.select('foreignObject').attr('visibility','hidden');
    this.selected = 0;
  }
  render(){
    let {visible} = this.props;
    return (
      <foreignObject x="20" y="22" width="480" height="130" visibility={visible}>
        <div ref="tip" className="eventTip" style={{width:470,height:125,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div><span></span><img src={clear} onClick={this.closePopup}></img></div>
          <div className="tipContent">
            <div></div>
          </div>
        </div>
      </foreignObject >
    )
  }
}