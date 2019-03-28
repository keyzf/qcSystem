import React from 'react';
import * as d3 from 'd3';
import clear from '../../static/clear.png';
import timeIcon from './static/white1.png';
import personIcon from './static/white2.png';
import eventIcon from './static/white3.png';
import fromIcon from './static/white4.png';
import placeIcon from './static/white5.png';
import lackIcon from './static/icon 4.png';
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
      if(Array.isArray(event)){
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

  static get defaultProps() {
    return {
      width: 160,
      height: 150,
    }
  }

  render(){
    let {event,name,closePopup,width,height} = this.props;
    let {isEventArray} =this.state;
    let time=[],addr=[],person=[],trigger='',from='',detail='';
    let tipname=name;
    let ismultiple = 0;
    if(isEventArray){
      if(event.length===1){
        event = event[0];
        time = event.time_range;
        if(time[0]===time[1]) time=[time[0]];
        addr = event.addrs.map((d)=>d.getName());
        person = event.roles.map((dd)=>dd.person.getName());
        trigger = event.trigger.getName();
        detail = event.detail;
        from = event.source;
      }else{
        ismultiple=1;
      }
    }
    else if(event){
      time = event.time_range;
      if(time[0]===time[1]) time=[time[0]];
      addr = event.addrs.map((d)=>d.getName());
      person = event.roles.map((dd)=>dd.person.getName());
      trigger = event.trigger.getName();
      detail = event.detail;
      from = event.source;
    }
    if(ismultiple){
      height = 25 * event.length + 24;
      if(height>190) height=190;
      width = 200;
    }
    person = person.filter(i => person.indexOf(i) === person.lastIndexOf(i));
    return (
        <div ref="tip" className="eventTip" style={{width:width,height:height,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div className="tooltipHeader"><span>{tipname}</span><img src={clear} onClick={closePopup}></img></div>
          {isEventArray&&ismultiple?(
              <div className="tipContent tiplist">
                {event.map((d,i)=>
                  <li key={i}>
                    <div>
                    <div style={{width:'20%'}}><span> 
                    {/* {d.time_range[0]===d.time_range[1]?d.time_range[0]:(d.time_range[0]===-9999&&d.time_range[1]===9999?<img src={lackIcon} style={{ filter: 'brightness(100)'}}></img>: */}
                    {d.time_range[0]===d.time_range[1]?d.time_range[0]:(d.time_range[0]===-9999&&d.time_range[1]===9999?<img src={lackIcon}/>:d.time_range.join('-'))}</span></div>
                    <div style={{width:'26%'}}><span>{d.roles.map((dd)=>dd.person.getName())}</span></div>
                    <div style={{width:'20%'}}><span>{d.trigger.getName()}</span></div>
                    <div style={{width:'18%'}}><span>{d.source===''?<img src={lackIcon}/>:d.source}</span></div>
                    </div>
                  </li>
                )}
              </div>
            ):(<div className="tipContent">
            <div className="rowdiv"><div><img src={timeIcon} className="rowIcon"></img></div><div><span>{time[0]===time[1]?time[0]:(time[0]===-9999&&time[1]===9999?<img src={lackIcon}/>:time.join('-'))}</span></div></div>
            <div className="rowdiv"><div><img src={placeIcon} className="rowIcon"></img></div><div><span>{addr.join(',').trim()===''?<img src={lackIcon}/>:addr.join(',')}</span></div></div>
            <div className="rowdiv"><div><img src={personIcon} className="rowIcon"></img></div><div><span>{person.join(',')}</span></div></div>
            <div className="rowdiv"><div><img src={eventIcon} className="rowIcon"></img></div><div><span>{trigger+detail}</span></div></div>
            <div className="rowdiv"><div><img src={fromIcon} className="rowIcon"></img></div><div><span>{from===''?<img src={lackIcon}/>:from}</span></div></div>
          </div>)}
        </div>
    )
  }
}