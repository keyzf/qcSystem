import React from 'react';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';
import './PersonInfo.scss';

export default class PersonInfo extends React.Component{
  constructor(){
    super();
    this.state={
      selected_people:undefined
    }
  }
  _changeShowPeople = autorun(()=>{
    if (stateManager.is_ready) {
      let selected_people = stateManager.selected_people
      this.setState({selected_people: selected_people[0]});
    }
  })
  render(){
    let {selected_people} = this.state;
    console.log(selected_people);
    return (
      <div className="personInfo">
        <div className="nameLabel">
          {selected_people?selected_people.name:''}
        </div>
        <div className="infoContent">
          <h3>{selected_people?selected_people.en_name:''}</h3>
          <p><span>性别 </span><span></span></p>
          <p><span>民族 </span><span></span></p>
          <p><span>别名 </span><span></span></p>
          <p><span>祖籍 </span><span></span></p>
          <p><span>生卒年 </span><span>{selected_people?selected_people.birth_year+'-'+selected_people.death_year:''}</span></p>
          <p><span>身份 </span><span></span></p>
        </div>
      </div>
    )
  }
}