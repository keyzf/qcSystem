import React from 'react';
import stateManager from '../../../../dataManager/stateManager';
import dataStore, {addrManager} from '../../../../dataManager/dataStore2'
import net_work from '../../../../dataManager/netWork';
import * as d3 from 'd3';
import {autorun} from 'mobx';

export default class Places extends React.Component{
  constructor(){
    super();
    this.state={
      places_with_time:[],
      places_without_time:[],
      places_con:[],
      places:[]
    }
    this.rscale = d3.scaleLinear()
                    .range([6,12])
    this.getAddrData = this.getAddrData.bind(this);
    this.renderPlace = this.renderPlace.bind(this);
    this.renderLines = this.renderLines.bind(this);
    this.renderPlaces = this.renderPlaces.bind(this);
  }
  componentWillMount(){
    let {selected_person} = this.props;
    this.selected_person = selected_person;
    net_work.require('getPersonEvents', {person_id:selected_person.id})
    .then(data=>{
      if(data){
        console.log(data);
        data = dataStore.processResults(data);
        this.getAddrData(data.events);
      }
    })
  }
  componentDidMount(){
    this.renderPlaces();
    this.renderLines();
  }

  _eventUpdate = autorun(()=>{
    if(stateManager.is_ready){
      let need_refesh = stateManager.need_refresh;
      this.getAddrData(this.selected_person.events)
    }
  })
  componentWillReceiveProps(nextProps){
    let {selected_person} = nextProps;
    if(selected_person.id !== this.props.selected_person.id){
      this.selected_person = selected_person;
      net_work.require('getPersonEvents', {person_id:selected_person.id})
      .then(data=>{
        if(data){
          console.log(data);
          data = dataStore.processResults(data)
          this.getAddrData(data.events);
        }
      })
    }
  }
  componentDidUpdate(){
    this.renderPlaces();
    this.renderLines();
  }
  getAddrData(events){
    // let places_with_time=[];
    // let places_without_time=[];
    let places_con = [];
    let places = [];
    let placeMap = new Map();
    let addr_id,index,addr_len=0;
    Object.keys(events).forEach((key,i)=>{
      let d = events[key];
      if(d.addrs.length!==0){
        let addr = d.addrs[0];
        let addr_id = addr.id;
        index = placeMap.get(addr_id);
        if(index){
          if(d.time_range[0]===-9999||d.time_range[1]===9999){
            places[index].certain_time++;
          }else{
            places[index].uncertain_time++;
          }
          places[index].events.push(d);
        }else{
          let tmp = {};
          tmp.uncertain_addr = 0;
          tmp.certain_time = 0;
          tmp.uncertain_time = 0;
          tmp.addr = addr;
          tmp.events=[d];
          if(d.time_range[0]===-9999||d.time_range[1]===9999){
            tmp.certain_time = 1;
            places_con.push(tmp);
          }else{
            tmp.uncertain_time = 1;
          }
          placeMap.set(addr_id,addr_len++);
          places.push(tmp);
        }
      }else{
        let {prob_addr} = d;
        addr_id = Object.keys(prob_addr)[0];
        let addr = addrManager.get(addr_id);
        if(addr){
        index = placeMap.get(addr_id);
          if(index){
            places[index].uncertain_addr++;
            places[index].events.push(d);
          }else{
            let tmp = {};
            tmp.uncertain_addr = 1;
            tmp.certain_time = 0;
            tmp.uncertain_time = 0;
            tmp.addr = addr;
            tmp.events=[d];
            placeMap.set(addr_id,addr_len++);
            places.push(tmp);
          }
        }
      }
    })
    let max = Math.max(...places.map(d=>d.events.length));
    this.rscale.domain([1,max])
      // console.log(prob_addr,d)
    //   if(d.addrs.length!==0){
    //     if(d.time_range[0]===d.time_range[1]){
    //       d.addrs.forEach((dd)=>{
    //         let flag=0;
    //         places_with_time.forEach((place,index)=>{
    //           if(place.addr.id===dd.id){
    //             places_with_time[index].event.push(d);
    //             places_with_time[index].count++;
    //             flag=1;
    //           }
    //         })
    //         if(dd.x!==-1){
    //           let tmp={};
    //           tmp.event=[];
    //           tmp.addr=dd;
    //           tmp.count=1;
    //           tmp.event.push(d);
              
    //           places_con.push(tmp);
    //           if(!flag){
    //             places_with_time.push(tmp);
    //           }
    //         }
    //       })
    //     }else{
    //       d.addrs.forEach((dd)=>{
    //         let flag=0;
    //         places_without_time.forEach((place,index)=>{
    //           if(place.addr.id===dd.id){
    //             places_without_time[index].event.push(d);
    //             places_without_time[index].count++;
    //             flag=1;
    //           }
    //         })
    //         if(!flag&&dd.x!==-1){
    //           let tmp={};
    //           tmp.event=[];
    //           tmp.addr=dd;
    //           tmp.count=1;
    //           tmp.event.push(d);
    //           places_without_time.push(tmp);
    //         }
    //       })
    //     }
    //   }
    // })
    places_con.sort((a,b)=>{
      return a.events[0].time_range[0]-b.events[0].time_range[0]
    })
    // // console.log(places_with_time,places_without_time);
    // places_with_time.forEach((d,i)=>{
    //   d.event.sort((a,b)=>{
    //     return a.time_range[0]-b.time_range[0];
    //   })
    // })
    // this.setState({
    //   places_with_time:places_with_time,
    //   places_without_time:places_without_time,
    //   places_con:places_con
    // })
    console.log(places);
    places = places.filter(d=>d.events.length>1);
    places.forEach((place)=>{
      place.events.sort((a,b)=>{
        if(a.addrs.length>0) return -1;
        else{
          return Object.values(b.prob_addr)[0]-Object.values(a.prob_addr)[0];
        }
      })
    })
    console.log(places);
    this.setState({
      places:places,
      places_con:places_con
    })
  }
  renderLines(){
    let {places_con} = this.state;
    let {path,color,isonly,index} = this.props;
    let node = this.refs.place;
    let lineData={'type':"LineString"};
    let coordinates=[];
    places_con.forEach((d)=>{
      let tmp=[
        d.addr.x,
        d.addr.y
        ];
      coordinates.push(tmp);
    })
    lineData['coordinates']=coordinates;
    d3.select(node).selectAll('.route').remove();
    d3.select(node)
      .append('path')
      .datum(lineData)
      .attr('class','route')
      .attr('d',path)
      .attr('stroke',()=>{
        if(index===0) return '#a2a4bf';
        else return color;
      })
      .attr('fill','none');
  }
  renderPlace(){
    let node = this.refs.place;
    let {projection,color,rscale,isonly,index} = this.props;
    let {places} = this.state;
    d3.select(node).selectAll('.certain').remove()
    d3.select(node).selectAll(`.certain`)
      .data(places)
      .enter()
      .append('circle')
      .attr('class','certain')
      .attr('r',d=>this.rscale(d.events.length))
      .attr('transform',d=>"translate(" + projection([
        d.addr.x,
        d.addr.y
        ]) + ")")
      .attr('fill',()=>{
        if(index===0) return '#a2a4bf';
        else return color;
      })
      .attr('stroke','#898989');
  }
  renderPlaces(){
    let node = this.refs.place;
    let {projection,color,isonly,index} = this.props;
    let {places} = this.state;
    let doms = d3.select(node).selectAll('.placeCircle')
      .data(places).enter().append('g')
    doms.append('circle')
        .attr('class','placeCircle')
        .attr('r',d=>{
          return this.rscale(d.events.length)
        })
        .attr('transform',d=>{
          console.log(d);
          return "translate(" + projection([
          d.addr.x,
          d.addr.y
          ]) + ")"})
        .attr('fill',()=>{
          if(index===0) return '#a2a4bf';
          else return color;
        })
        .attr('fill-opacity',0.4)
        .attr('stroke','#898989')
    doms.append('rect')
        .attr('class','placeRect')
        .attr('width',d=>{
          return (d.certain_time+d.uncertain_time)/d.events.length*this.rscale(d.events.length)*2;
        })
        .attr('height',d=>this.rscale(d.events.length)*2)
        .attr('x',d=>-this.rscale(d.events.length))
        .attr('y',d=>-this.rscale(d.events.length))
        .style('clip-path',(d,i)=>{
          return  `circle(${this.rscale(d.events.length)}px at ${this.rscale(d.events.length)}px ${this.rscale(d.events.length)}px)`
        })
        .attr('transform',d=>{
          return "translate(" + projection([
          d.addr.x,
          d.addr.y
          ]) + ")"})
        .attr('fill',()=>{
          if(index===0) return '#a2a4bf';
          else return color;
        })
  }
  render(){
    return (
      <g ref="place">
      </g>
    )
  }
}