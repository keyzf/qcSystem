import React from 'react';
import _ from 'lodash';
import {Table} from 'semantic-ui-react';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';
import net_work from '../../dataManager/netWork';
import dataStore from '../../dataManager/dataStore2';

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
                tmp.place = d.addrs.map((dd)=>dd.en_name);
                tmp.people = d.roles.map((dd)=>dd.person.en_name);
                tmp.event = d.trigger.en_name;
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
        <Table sortable celled fixed selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={column === 'time' ? direction : null}
              onClick={this.handleSort('time')}
            >
              Time
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'place' ? direction : null}
              onClick={this.handleSort('place')}
            >
              Place
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'people' ? direction : null}
              onClick={this.handleSort('people')}
            >
              People
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'event' ? direction : null}
              onClick={this.handleSort('event')}
            >
              Event
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={column === 'from' ? direction : null}
              onClick={this.handleSort('from')}
            >
              From
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
        {data.map((d) => {
           return (<Table.Row key={d.id} onClick={()=>this.handleEventClick(d)}>
              <Table.Cell>{d.time}</Table.Cell>
              <Table.Cell>{d.place.join()}</Table.Cell>
              <Table.Cell>{d.people.join()}</Table.Cell>
              <Table.Cell>{d.event}</Table.Cell>
              <Table.Cell>{d.from}</Table.Cell>
            </Table.Row>);
        })}
        </Table.Body>
      </Table>
    )
  }
}