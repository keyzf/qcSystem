import React from 'react';
import * as d3 from 'd3';
import clear from '../../static/clear.png';
import timeIcon from './static/white1.png';
import personIcon from './static/white2.png';
import eventIcon from './static/white3.png';
import fromIcon from './static/white4.png';
import placeIcon from './static/white5.png';
import nextIcon from './static/white6.png';
import './eventTooltip.scss';

export default class EventTooltip extends React.Component{
  constructor(){
    super();
    this.selected = 0;
  }
  closePopup(){
    d3.select('foreignObject').attr('visibility','hidden');
    this.selected = 0;
  }
  render(){
    return (
        <div ref="tip" className="eventTip" style={{width:160,height:136,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div className="tooltipHeader"><span></span><img src={clear} onClick={this.closePopup}></img></div>
          <div className="tipContent">
            <div><img src={timeIcon}></img><span style={{width:'43px'}}></span><img src={placeIcon}></img><span style={{width:'43px'}}></span></div>
            <div><img src={personIcon}></img><span></span></div>
            <div><img src={eventIcon}></img><span></span></div>
            <div><img src={fromIcon}></img><span></span></div>
          </div>
        </div>
    )
  }
}