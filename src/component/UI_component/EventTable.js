import React from 'react';
import _ from 'lodash';
import {autorun} from 'mobx';
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

export default class EventTable extends React.Component{
  constructor(){
    super();
    this.state={
      selected_people: [],
      data:[],
      column: null,
      direction: null
    }
    this.handleEventClick = this.handleEventClick.bind(this);
  }
  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let selected_people = stateManager.selected_people 
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
                else tmp.time='';
                tmp.place = d.addrs.map((dd)=>dd.getName());
                tmp.people = d.roles.map((dd)=>dd.person.getName());
                tmp.event = d.trigger.getName();
                tmp.from = '';
                events.push(tmp);
              })
              this.setState({
                data:events,
                selected_people: selected_people
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

  handleEventClick(event){
    stateManager.setSelectedEvent(event);
  }
  render(){
    const { column, data, direction } = this.state;
    // console.log(data);
    return (
      <div className="eventList">
        <div className="listHeader">
          <h3>年谱列表</h3>
          <div>
            <div><img src={modifyIcon}/><div>修改</div></div>
            <div><img src={errorIcon}/><div>错误</div></div>
            <div><img src={lackIcon}/><div>缺失</div></div>
            <div><img src={conflictIcon}/><div>冲突</div></div>
            <div><img src={variationIcon}/><div>多样</div></div>
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
           return (<tr key={d.id} onClick={()=>this.handleEventClick(d)}>
              <td width="14%">{d.time?d.time:<img src={lackIcon}></img>}</td>
              <td width="16%">{d.place.join()?d.place.join():<img src={lackIcon}></img>}</td>
              <td width="24%">{d.people.join()?d.people.join():<img src={lackIcon}></img>}</td>
              <td width="24%">{d.event?d.event:<img src={lackIcon}></img>}</td>
              <td width="22%">{d.from?d.from:<img src={lackIcon}></img>}</td>
            </tr>);
        })}
        </tbody>
      </table>
      </div>
    </div>
    )
  }
}