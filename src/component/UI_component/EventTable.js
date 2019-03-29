import React from 'react';
import _ from 'lodash';
import {autorun} from 'mobx';
import * as d3 from 'd3';
import stateManager from '../../dataManager/stateManager';
import net_work from '../../dataManager/netWork';
import dataStore from '../../dataManager/dataStore2';
import './EventTable.scss';
import modifyIcon from './static/icon 2.png';
import errorIcon from './static/icon 3.png';
import lackIcon from './static/icon 4.png';
import conflictIcon from './static/icon 5.png';
import variationIcon from './static/icon 6.png';
import timeIcon from './static/icon 7.png';
import placeIcon from './static/icon 8.png';
import peopleIcon from './static/icon 9.png';
import eventIcon from './static/icon 10.png';
import fromIcon from './static/icon 11.png';
import sortIcon from './static/icon 12.png';
import { IS_EN } from '../../dataManager/dataStore2';

export default class EventTable extends React.Component{
  constructor(){
    super();
    this.state={
      selected_people: [],
      selected_event_id: '',
      data:[],
      column: null,
      direction: null
    }
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handleMouseOut = this.handleMouseOut.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.sortByCertainty = this.sortByCertainty.bind(this);
  }

  // _loadNewEvent = autorun(()=>{
  //   // console.log(stateManager.selected_event)
  //   if (stateManager.is_ready) {
  //       let selected_event_id = stateManager.selected_event_id.get();
  //       console.log(selected_event_id);
  //       d3.select('.eventList').select('tbody').selectAll('tr').classed('active',false);
  //       d3.select('.eventList').select('tbody').select(`#tr_${selected_event_id}`)
  //         .classed('active',true)
  //         .lower();
  //   }
  // })

  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let used_types = stateManager.used_types
      let need_refesh = stateManager.need_refresh
      let selected_people = stateManager.selected_people ;
      let selected_event_id = stateManager.selected_event_id.get();
      net_work.require('getPersonEvents', {person_id:selected_people[0].id})
      .then(data=>{
          if(data){
              data = dataStore.processResults(data)
              this.all_events = dataStore.dict2array(data.events);
              let events = [];
              this.all_events.forEach((d)=>{
                let tmp={};
                tmp.id=d.id;
                if(d.time_range[0]===d.time_range[1]) tmp.time = d.time_range[0];
                else if(d.time_range[0]===-9999&&d.time_range[1]===9999){
                  tmp.time='';
                }else{
                  tmp.time = d.time_range.join('-');
                }
                tmp.place = d.addrs.map((dd)=>dd.getName());
                tmp.people = d.roles.map((dd)=>dd.person.getName());
                tmp.event = d.trigger.getName();
                if(d.text!=='[na]'){
                  tmp.from = d.text;
                }
                tmp.prob_year = d.prob_year;
                tmp.prob_addr = d.prob_addr;
                tmp.is_change_people = d.is_change_people;
                tmp.is_change_place = d.is_change_place;
                tmp.is_change_time = d.is_change_time;
                tmp.is_change_trigger = d.is_change_trigger;
                events.push(tmp);
              })
              // events.sort((a,b)=>{
              //   if(a.)
              // })
              this.setState({
                data:events,
                selected_people: selected_people,
                selected_event_id: selected_event_id
              })
          }
      })           
    }
  })

  handleSort = clickedColumn => () => {
    const { column, data, direction } = this.state
    if (column !== clickedColumn) {
      this.setState({
        column: clickedColumn,
        data: _.sortBy(data, [clickedColumn]),
        direction: 'ascending',
      })
      return
    }
    this.setState({
      data: data.reverse(),
      direction: direction === 'ascending' ? 'descending' : 'ascending',
    })
  }

  sortByCertainty(){
    const {data} = this.state;
    this.setState({
      data: data.sort((a,b)=>{
        return Object.values(b.prob_addr)[0]+Object.values(b.prob_year)[0]-Object.values(a.prob_addr)[0]-Object.values(a.prob_year)[0]
      })
    })
  }

  componentDidUpdate(){
    let {selected_event_id} = this.state;
    d3.select('.eventList').select('tbody').selectAll('tr').classed('active',false);
    d3.select('.eventList').select('tbody').select(`#tr_${selected_event_id}`)
      .classed('active',true)
      .lower();
  }

  handleEventClick(event,e){
    stateManager.setSelectedEvent(event);
  }

  handleMouseOver(e){
    e.target.parentNode.classList.add('hoverTr');
    let text = e.target.textContent;
    if(text){
      d3.select(this.refs.eventList)
      .select('#table-popup')
      .style('visibility','visible')
      .style('top',`${e.clientY+8}px`)
      .style('left',`${e.clientX-20}px`)
      .select('p')
      .text(text)
    }else{
      d3.select(this.refs.eventList)
      .select('#table-popup')
      .style('visibility','hidden')
    }
  }

  handleMouseOut(e){
    e.target.parentNode.classList.remove('hoverTr');
    d3.select(this.refs.eventList)
    .select('#table-popup')
    .style('visibility','hidden')
  }
  render(){
    const { column, data, direction } = this.state;
    let handleEventClick = this.handleEventClick;
    let handleMouseOver = this.handleMouseOver;
    let handleMouseOut = this.handleMouseOut;
    return (
      <div className="eventList" ref="eventList">
        <div className="listHeader">
          <h3>{IS_EN?'Chronology List':'年谱列表'}</h3>
          <button onClick={this.sortByCertainty}>{IS_EN?'sort by uncertainty':'排序'}</button>
          <div>
            <div><img src={modifyIcon}/><div>{IS_EN?'modify':'修改'}</div></div>
            <div><img src={errorIcon}/><div>{IS_EN?'error':'错误'}</div></div>
            <div><img src={lackIcon}/><div>{IS_EN?'missing':'缺失'}</div></div>
            <div><img src={conflictIcon}/><div>{IS_EN?'conflict':'冲突'}</div></div>
            {/* <div><img src={variationIcon}/><div>{IS_EN?'multiple':'多样'}</div></div> */}
          </div>
        </div>
        <div className="listTable">
        <table>
          <thead>
          <tr>
            <th
              sorted={column === 'time' ? direction : null}
              onClick={this.handleSort('time')} width="14%"
            >
            <img src={timeIcon}/>
            <img src={sortIcon}/>
            </th>
            <th
              sorted={column === 'place' ? direction : null}
              onClick={this.handleSort('place')} width="16%"
            >
            <img src={placeIcon}/>
            <img src={sortIcon}/>
            </th>
            <th
              sorted={column === 'people' ? direction : null}
              onClick={this.handleSort('people')} width="24%"
            >
            <img src={peopleIcon}/>
            <img src={sortIcon}/>
            </th>
            <th
              sorted={column === 'event' ? direction : null}
              onClick={this.handleSort('event')} width="24%"
            >
            <img src={eventIcon}/>
            <img src={sortIcon}/>
            </th>
            <th
              sorted={column === 'from' ? direction : null}
              onClick={this.handleSort('from')} width="22%"
            >
            <img src={fromIcon}/>
            <img src={sortIcon}/>
            </th>
          </tr>
        </thead>
        <tbody className="tbody">
        {data.map((d) => {
           return (<tr key={d.id} id={`tr_${d.id}`} onClick={function(e){handleEventClick(d,e)}} onMouseOver={(e)=>handleMouseOver(e)} onMouseOut={(e)=>handleMouseOut(e)}>
              <td width="14%" className={d.is_change_time?'changed':''}>{d.time?d.time:<img src={lackIcon}></img>}</td>
              <td width="16%" className={d.is_change_place?'changed':''}>{d.place.join()?d.place.join():<img src={lackIcon}></img>}</td>
              <td width="24%" className={d.is_change_people?'changed':''}>{d.people.join()?d.people.join():<img src={lackIcon}></img>}</td>
              <td width="24%" className={d.is_change_trigger?'changed':''}>{d.event?d.event:<img src={lackIcon}></img>}</td>
              <td width="22%">{d.from?d.from:<img src={lackIcon}></img>}</td>
            </tr>);
        })}
        </tbody>
        </table>
        <div id="table-popup">
          <p></p>
        </div>
      </div>
    </div>
    )
  }
}