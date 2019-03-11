import React from 'react';
import stateManager from '../../../../dataManager/stateManager';
import net_work from '../../../../dataManager/netWork'
import {autorun} from 'mobx';

export default class Places extends React.Component{
  constructor(){
    super();
    this.state={
      places:[]
    }
  }
  componentWillMount(){
    let {selected_person} = this.props;
    net_work.require('getPersonEvents', {person_id:selected_person})
    .then(data=>{
      let addrs=[];
      for(let key in data.addrs){
        addrs.push(data.addrs[key]);
      }
      this.setState({
        places:addrs
      });
    })
  }
  componentWillReceiveProps(nextProps){
    let {selected_person} = nextProps;
    net_work.require('getPersonEvents', {person_id:selected_person})
    .then(data=>{
      let addrs=[];
      for(let key in data.addrs){
        addrs.push(data.addrs[key]);
      }
      this.setState({
        places:addrs
      });
    })
  }
  render(){
    let {projection} = this.props;
    return (
      <g>
        {this.state.places.map((d,i)=>(<circle r={4} key={i} transform={ "translate(" + projection([
        d.x,
        d.y
      ]) + ")"} fill={'#4846a3'} stroke={'#333333'}></circle>))}
      </g>
    )
  }
}