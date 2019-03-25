import React from 'react';
import stateManager from '../../../../dataManager/stateManager';
import dataStore, {eventManager} from '../../../../dataManager/dataStore2'
import net_work from '../../../../dataManager/netWork';
import * as d3 from 'd3';

export default class Places extends React.Component{
  constructor(){
    super();
    this.state={
      places_with_time:[],
      places_without_time:[],
      places_con:[]
    }
    
    this.getAddrData = this.getAddrData.bind(this);
    this.renderPlace = this.renderPlace.bind(this);
    this.renderLines = this.renderLines.bind(this);
  }
  componentWillMount(){
    let {selected_person} = this.props;
    net_work.require('getPersonEvents', {person_id:selected_person})
    .then(data=>{
      if(data){
        data = dataStore.processResults(data);
        this.getAddrData(data.events);
      }
    })
  }
  componentDidMount(){
    this.renderPlace();
    this.renderLines();
  }
  componentWillReceiveProps(nextProps){
    let {selected_person} = nextProps;
    net_work.require('getPersonEvents', {person_id:selected_person})
    .then(data=>{
      if(data){
        data = dataStore.processResults(data)
        this.getAddrData(data.events);
      }
    })
  }
  componentDidUpdate(){
    this.renderPlace();
    this.renderLines();
  }
  getAddrData(events){
    let places_with_time=[];
    let places_without_time=[];
    let places_con = [];
    Object.keys(events).forEach((key,i)=>{
      let d = events[key];
      if(d.addrs.length!==0){
        if(d.time_range[0]===d.time_range[1]){
          d.addrs.forEach((dd)=>{
            let flag=0;
            places_with_time.forEach((place,index)=>{
              if(place.addr.id===dd.id){
                places_with_time[index].event.push(d);
                places_with_time[index].count++;
                flag=1;
              }
            })
            let tmp={};
            tmp.event=[];
            tmp.addr=dd;
            tmp.count=1;
            tmp.event.push(d);
            places_con.push(tmp);
            if(!flag){
              places_with_time.push(tmp);
            }
          })
        }else{
          d.addrs.forEach((dd)=>{
            let flag=0;
            places_without_time.forEach((place,index)=>{
              if(place.addr.id===dd.id){
                places_without_time[index].event.push(d);
                places_without_time[index].count++;
                flag=1;
              }
            })
            if(!flag){
              let tmp={};
              tmp.event=[];
              tmp.addr=dd;
              tmp.count=1;
              tmp.event.push(d);
              places_without_time.push(tmp);
            }
          })
        }
      }
    })
    places_con.sort((a,b)=>{
      return a.event[0].time_range[0]-b.event[0].time_range[0]
    })
    this.setState({
      places_with_time:places_with_time,
      places_without_time:places_without_time,
      places_con:places_con
    })
  }
  renderLines(){
    let {places_con} = this.state;
    let {path,color,isonly} = this.props;
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
        if(isonly) return '#a2a4bf';
        else return color;
      })
      .attr('fill','none');
  }
  renderPlace(){
    let node = this.refs.place;
    let {projection,color,rscale,isonly} = this.props;
    let {places_with_time,places_without_time} = this.state;
    d3.select(node).selectAll('.certain').remove()
    d3.select(node).selectAll(`.certain`)
      .data(places_with_time)
      .enter()
      .append('circle')
      .attr('class','certain')
      .attr('r',d=>rscale(d.count))
      .attr('transform',d=>"translate(" + projection([
        d.addr.x,
        d.addr.y
        ]) + ")")
      .attr('fill',()=>{
        if(isonly) return '#a2a4bf';
        else return color;
      })
      .attr('stroke','#898989');
    d3.select(node).selectAll('.uncertain').remove()
    d3.select(node).selectAll('.uncertain')
      .data(places_without_time)
      .enter()
      .append('circle')
      .attr('class','uncertain')
      .attr('r',d=>rscale(d.count))
      .attr('transform',d=>"translate(" + projection([
        d.addr.x,
        d.addr.y
        ]) + ")")
      .attr('fill',()=>{
        if(isonly) return '#a2a4bf';
        else return color;
      })
      .attr('opacity',0.4)
      .attr('stroke','#898989');
  }
  render(){
    return (
      <g ref="place">
      </g>
    )
  }
}