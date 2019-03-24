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
    this.state={
      isEventArray: 0
    }
    this.selected = 0;
  }

  componentWillReceiveProps(nextProps){
    let event = nextProps.event;
    if(event){
      if(event.count){
        this.setState({
          isEventArray:1
        })
        }else{
        this.setState({
          isEventArray:0
        })
      }
    }
  }

  render(){
    let {event,name,closePopup} = this.props;
    let {isEventArray} =this.state;
    let time=[],addr=[],person=[],trigger='',from='';
    let tipname=name;
    let ismultiple = 0;
    if(isEventArray){
      tipname=event.addr.name;
      if(event.event.length===1){
        event = event.event;
        time = event.time_range;
        if(time[0]===time[1]) time=[time[0]];
        addr = event.addrs.map((d)=>d.name);
        person = event.roles.map((dd)=>dd.person.name);
        trigger = event.trigger.name;
        from = '';
      }else{
        ismultiple=1;
      }
    }
    else if(event){
      time = event.time_range;
      if(time[0]===time[1]) time=[time[0]];
      addr = event.addrs.map((d)=>d.name);
      person = event.roles.map((dd)=>dd.person.name);
      trigger = event.trigger.name;
      from = '';
    }
    console.log(event,isEventArray);
    return (
        <div ref="tip" className="eventTip" style={{width:160,height:136,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div className="tooltipHeader"><span>{tipname}</span><img src={clear} onClick={closePopup}></img></div>
          {ismultiple?(
              <div className="tipContent">
                {event.event.map((d,i)=>
                  <li key={i}>
                    <span>{d.time_range.join('-')}</span>
                    <span>{d.roles.map((dd)=>dd.person.name)}</span>
                    <span>{d.trigger.name}</span>
                    <span>{''}</span>
                  </li>
                )}
              </div>
            ):(<div className="tipContent">
            <div><img src={timeIcon}></img><span style={{width:'43px'}}>{time.join('-')}</span><img src={placeIcon}></img><span style={{width:'43px'}}>{addr.join(',')}</span></div>
            <div><img src={personIcon}></img><span>{person.join(',')}</span></div>
            <div><img src={eventIcon}></img><span>{trigger}</span></div>
            <div><img src={fromIcon}></img><span>{from}</span></div>
          </div>)}
        </div>
    )
  }
}