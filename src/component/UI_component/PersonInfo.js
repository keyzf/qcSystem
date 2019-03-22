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
          {selected_people?selected_people.getName():''}
        </div>
        <div className="infoContent">
          <h3>{selected_people?selected_people.en_name:''}</h3>
          <p><span className="nameString">性别 </span><span>{selected_people?selected_people.getGender():''}</span></p>
          <p><span className="nameString">民族 </span><span>{selected_people?selected_people.getEthnicity():''}</span></p>
          <p><span className="nameString">别名 </span><span>{selected_people?selected_people.getAltNames().splice(0,2).join(','):''}</span></p>
          {/* <p><span>祖籍 </span><span></span></p> */}
          <p><span className="nameString">生卒年 </span><span>{selected_people?selected_people.birth_year+'-'+selected_people.death_year:''}</span></p>
          <p><span className="nameString">身份 </span><span>{selected_people?selected_people.getStatus().splice(0,3).join(','):''}</span></p>
        </div>
      </div>
    )
  }
}