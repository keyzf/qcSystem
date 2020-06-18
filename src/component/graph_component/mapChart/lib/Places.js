import React from 'react';
import stateManager from '../../../../dataManager/stateManager';
import dataStore, {addrManager, eventManager} from '../../../../dataManager/dataStore2'
import net_work from '../../../../dataManager/netWork';
import * as d3 from 'd3';
import {autorun} from 'mobx';


const certain_color = '#365258'
const uncertain_color = '#839ba0'

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
    // this.renderPlace = this.renderPlace.bind(this);
    this.renderLines = this.renderLines.bind(this);
    // this.renderPlaces = this.renderPlaces.bind(this);
    this.renderPie = this.renderPie.bind(this);
    this.arc=d3.arc()
               .innerRadius(0)
    this.pie=d3.pie()
  }
  componentWillMount(){
    let {selected_person} = this.props;
    this.selected_person = selected_person;
    // net_work.require('getPersonEvents', {person_id:selected_person.id})
    // .then(data=>{
    //   if(data){
    //     console.log(data);
    //     data = dataStore.processResults(data);
    //     this.getAddrData(data.events);
    //   }
    // })
  }
  componentDidMount(){
    this.renderPie();
    this.renderLines();
  }

  // _eventUpdate = autorun(()=>{
  //   if(stateManager.is_ready){
  //     let need_refesh = stateManager.need_refresh;
  //     this.getAddrData(this.selected_person.events)
  //   }
  // })

  // 因为现在的画的都是同一个人
  _onPeopelEventsChange =  autorun(()=>{
    // console.log('setPeopleMapEvents', stateManager.people_map_event_ids.slice(), stateManager.is_ready)

    if(stateManager.is_ready && this.props){
      // let need_refesh = stateManager.need_refresh;
      let {selected_person} = this.props
      this.selected_person = selected_person
      // console.log(selected_person)
      let event_ids = stateManager.people_map_event_ids.slice()
      let events = selected_person.events //event_ids.map(id=>eventManager.get(id))
      let id2events = {}
      // console.log(id2events)
      events.forEach(elm=> id2events[elm.id]=elm)
      this.getAddrData(id2events);
      // this.getAddrData(this.selected_person.events)
      this.renderPie();
      this.renderLines();
    }
  })
  componentWillReceiveProps(nextProps){
    let {selected_person} = nextProps;
    if(selected_person.id !== this.props.selected_person.id){
      this.selected_person = selected_person;
      // net_work.require('getPersonEvents', {person_id:selected_person.id})
      // .then(data=>{
      //   // console.log(data);
      //   if(data){
      //     data = dataStore.processResults(data)
      //     this.getAddrData(data.events);
      //     this.renderPie();
      //     this.renderLines();
      //   }
      // })
    }
  }
  componentDidUpdate(){
    this.renderPie();
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
      if(d.addrs.length!==0&&d.time_range[0]!==-9999&&d.time_range[1]!==9999){
        places_con.push(d);
      }
      if(d.addrs.length!==0){
        let addr = d.addrs[0];
        let addr_id = addr.id;
        index = placeMap.get(addr_id);
        if(index){
          if(d.time_range[0]===-9999||d.time_range[1]===9999){
            places[index].uncertain_time++;
          }else{
            places[index].certain_time++;
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
            tmp.uncertain_time = 1;
          }else{
            tmp.certain_time = 1;
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
    // console.log(places_con);
    places_con.sort((a,b)=>{
      return a.time_range[0]-b.time_range[0]
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
    places = places.filter(d=>{
      if(d.certain_time>0||d.uncertain_time>0) return true;
      else if(d.events.length>2){
        return true;
      }
      else{
        return false;
      }
    });
    places.forEach((place)=>{
      place.events.sort((a,b)=>{
        if(a.addrs.length>0) return -1;
        else{
          return Object.values(b.prob_addr)[0]-Object.values(a.prob_addr)[0];
        }
      })
    })
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
      if(d.addrs[0].x&&d.addrs[0].y&&d.addrs[0].x>0&&d.addrs[0].y>0){
      let tmp=[
        d.addrs[0].x,
        d.addrs[0].y
        ];
      coordinates.push(tmp);
      }
    })
    lineData['coordinates']=coordinates;
    d3.select(node).selectAll('.route').remove();
    d3.select(node)
      .append('path')
      .datum(lineData)
      .attr('class','route')
      .attr('d',path)
      .attr('stroke',()=>{
        if(index===0) return certain_color;  //饼图上的颜色
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
        if(index===0) return certain_color;
        else return color;
      })
      .attr('stroke',uncertain_color);
  }
  renderPlaces(){
    let node = this.refs.place;
    let {projection,color,isonly,index} = this.props;
    let {places} = this.state;
    d3.select(node).selectAll('.hh').remove();
    let doms = d3.select(node).selectAll('.hh')
      .data(places).enter().append('g').attr('class','hh')
    doms.append('circle')
        .attr('class','placeCircle')
        .attr('r',d=>{
          return this.rscale(d.events.length)
        })
        .attr('transform',d=>{
          return "translate(" + projection([
          d.addr.x,
          d.addr.y
          ]) + ")"})
        .attr('fill',()=>{
          if(index===0) return certain_color;
          else return color;
        })
        .attr('fill-opacity',0.5)
        .attr('stroke',uncertain_color)
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
          if(index===0) return certain_color;
          else return color;
        })
  }
  renderPie(){
    let {places} = this.state;
    let {projection,color,isonly,index} = this.props;
    let node = this.refs.place;
    this.pie.value(d=>d).sort(null);
    d3.select(node).select('#piePlace').selectAll('g').remove()
    places.forEach((place,i)=>{
      let data = [{'events':place.events,'addr':place.addr,'data':[place.certain_time+place.uncertain_time,place.uncertain_addr]}];
      let piedata = this.pie(data[0].data);
      this.arc.outerRadius(this.rscale(data[0].events.length));
      let dom = d3.select(node).select('#piePlace').selectAll(`pie${i}`)
                  .data(data);
      // dom.exit().remove();
      let gdom=dom.enter()
         .append('g')
         .attr('class',`pie${i}`)
         .attr('transform',d=>{
          return "translate(" + projection([
          d.addr.x,
          d.addr.y
          ]) + ")"})
      gdom.append('path')
          .attr('d',this.arc(piedata[0]))
          .style('fill',()=>{
            if(index===0) return certain_color;
            else return color;
          })
      gdom.append('path')
          .attr('d',this.arc(piedata[1]))
          .style('fill',()=>{
            if(index===0) return certain_color;
            else return color;
          }) 
          .attr('fill-opacity',0.5)
    })
  }
  render(){
    return (
      <g ref="place">
        <g id="piePlace"></g>
      </g>
    )
  }
}