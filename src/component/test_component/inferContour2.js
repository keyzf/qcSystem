// 用于绘制力图

import React from 'react';
import PropTypes from 'prop-types';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import jsonFormat from 'json-format'
import {XYPlot,ContourSeries, YAxis, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis} from 'react-vis';
import * as d3 from 'd3'
// import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { link } from 'fs';
import { Header, Divider, Icon, Image, Menu, Segment, Sidebar, Container, Checkbox, Input, Grid, Label, Table, List} from 'semantic-ui-react'

class InferContour extends React.Component {
    constructor(){
        super()
        this.state = {
            event_mark_data: [],
            event_link_datas: [],  //同类事件连起来
            hint_value: undefined
        }
    }

    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            console.log('加载基于contour推理试图数据')
            let event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:event_id, depth:3, trigger_num:50, event_num:500})
            .then(data=>{
                // console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events, addrs, people} = graph_data
                let center_events = eventManager.get(event_id)
                // console.log(dataStore.dict2array(events))
                this.calcualteEventMark(events, center_events)
            })
            // net_work.require('getRelatedEvents', {event_id:event_id})
            // .then(data=>{
            //     console.log(data)
            //     let graph_data = dataStore.processResults(data.data)
            //     let {events, addrs, people} = graph_data
            //     let center_events = eventManager.get(event_id)
            //     this.calcualteEventMark(events, center_events)
            //     // console.log(events)
            // })
        }
    })

    calcualteEventMark = (events, center_events)=>{
        console.log('推断', center_events.toText())
        let event_array = dataStore.dict2array(events)
        let event2vec = {}
        const DIM = 20
        // console.log(event_array)
        event_array.forEach(event=>{
            let event_id = event.id
            event2vec[event.id] = []
            let event_vec = []
            if(event.isCertain()){
                let event_year = event.time_range[0]
                // console.log(event_year)
                let time_vec = Array(DIM)
                for (let index = 0; index < DIM; index++) {
                    time_vec[index] = (event_year - 900)/2  //最后还要记得归一化
                }
                
                // 排序主角 对象
                let person_vec1 = undefined, person_vec2 = undefined
                let trigger_vec1 = undefined, trigger_vec2 = undefined
                event.roles.forEach(elm=>{
                    if (elm.role==='主角') {
                        person_vec1 = elm.person.year2vec[event_year]
                        trigger_vec1 = dataStore.trigger2vec[event.trigger.name + ' ' + elm.role]
                    }else if (elm.role==='对象') {
                        person_vec2 = elm.person.year2vec[event_year]
                        trigger_vec1 = dataStore.trigger2vec[event.trigger.name + ' ' + elm.role]
                    }
                })
                person_vec1 = person_vec1 || person_vec2
                person_vec2 = person_vec2 || person_vec1
                trigger_vec1 = trigger_vec1 || trigger_vec2
                trigger_vec2 = trigger_vec2 || trigger_vec1

                if(!person_vec1 || !person_vec2){
                    console.warn(event, '啥人物都没有')
                    return
                }
                
                let addrs = event.addrs
                let addr_vecs = []
                if (addrs.length>0) {
                    addrs.forEach(addr=>{
                        event2vec[event.id].push({
                            vec: [...time_vec, ...person_vec1, ...trigger_vec1, ...person_vec2, ...trigger_vec2, ...addr.vec],
                            year: event_year,
                            addr: addr,
                            event: event
                        })                        
                    })
                }else{
                    let addr_vec = Array(DIM)
                    for (let index = 0; index < DIM; index++) {
                        addr_vec[index] = 0
                    }
                    event2vec[event.id].push({
                        vec: [...time_vec, ...person_vec1, ...trigger_vec1, ...person_vec2, ...trigger_vec2, ...addr_vec],
                        year: event_year,
                        addr: undefined,
                        event: event
                    }) 
                }
                // console.log(addr_vecs, time_vec, person_vec1, trigger_vec1)

            }
        })
        // console.log(event2vec)
        let index2event2vec = {}
        let vecs = []
        let index = 0
        for(let event_id in event2vec){
            // eslint-disable-next-line no-loop-func
            event2vec[event_id].forEach(vec=>{
                vecs.push(vec.vec)
                index2event2vec[index] = event_id
                index++
            })
        }

        
        let opt = {
            epsilon: 10,  // epsilon is learning rate (10 = default)
            perplexity: 50, // roughly how many neighbors each point influences (30 = default)
            dim: 2 // dimensionality of the embedding (2 = default)
        }
        let tsne = new tsnejs.tSNE(opt); // create a tSNE instance

        tsne.initDataRaw(vecs);  //这里用dist会出问题
        for(var k = 0; k <500; k++) {
            tsne.step(); // every time you call this, solution gets better
        }
          
        vecs = tsne.getSolution(); // Y is an array of 2-D points that you can plot

        let event_mark_data = []
        let main_people = center_events.roles.map(elm=> elm.person)
        vecs.forEach((vec,index)=>{
            let event_id = index2event2vec[index]
            let event = eventManager.get(event_id)
            let x = vec[0]
            let y = vec[1]
            let imp = event.roles.reduce((total, role)=>{
                return total + event.getImp(role['person']) 
            },0)/event.roles.length

            let main_people_num = main_people.reduce((total,person)=>{
                // return Math.ceil(Math.random()*10)
                return person.isIn(event)? 1:0
            }, 0)
            const color = d3.rgb(94, 195, 232).brighter()
            // console.log(color, main_people_num, color.darker([main_people_num]), main_people)
            event_mark_data.push({
                x: x, 
                y: y,
                year: vec.year,
                addr:vec.year,
                event: event,
                size: imp,
                color: color.darker([main_people_num])
            })
        })
        this.setState({
            event_mark_data: event_mark_data,
        })
    }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    render(){
        console.log('render 基于contour的推理试图')
        let {width, height} = this.props
        let {event_mark_data, hint_value} = this.state
        let sim_addr_links = [], sim_year_links = [], sim_person_links = []
        if (hint_value) {
            const {event, year, addr} = hint_value
            const people = event.getPeople()
            let sim_addr_marks = event_mark_data.filter(mark=> addr && addr===mark.addr)
            let sim_person_marks = event_mark_data.filter(mark=> {
                for(let index in people){
                    let person = people[index]
                    if(person.isIn(mark.event))
                        return true
                }
                return false
            })
            let sim_year_marks = event_mark_data.filter(mark=>  year===mark.year)

            sim_addr_links = sim_addr_marks.map(mark=> [
                hint_value,
                mark
            ])
            sim_year_links = sim_year_marks.map(mark=> [
                hint_value,
                mark
            ])
            sim_person_links = sim_person_marks.map(mark=> [
                hint_value,
                mark
            ])
        }
        
        // 还要算个基于range的值不然很有可能小于1
        const o_dist = (mark1, mark2) => 
            Math.sqrt(
                (mark1.x-mark2.x)*(mark1.x-mark2.x) +  
                (mark1.y-mark2.y)*(mark1.y-mark2.y) 
            )
        
            const right_bar_width = 300
        return(
        <div className='InferContour' style={{width:width, height:height}}>
            {/* 显示其中的所有事件 */}
            <div style={{
                left: width-right_bar_width+20, 
                width:right_bar_width, 
                height:height, 
                background:'white', 
                top:0, 
                position:'absolute', 
                overflowY:'scroll'}}>
                {   

                    event_mark_data.map(data=>{
                        const event = data.event
                        const text = event.toText()
                        return(
                            <Container key={'text_hahahaha'+event.id} fluid text textAlign='justified'>
                                {text}
                                <Divider />
                            </Container>
                        )          
                    })
                }
            </div>
            <div style={{height:height, top:0, position:'absolute'}}>
                <XYPlot
                width={width-right_bar_width}
                height={height}
                onMouseLeave={event=> this.setState({hint_value:undefined})}>  
                    <ContourSeries
                        style={{
                        // stroke: '#125C77',
                        // strokeLinejoin: 'round'
                        opacity: 0.5
                        }}
                        colorRange={[
                        '#ffffff',
                        '#dff2f8',
                        ]}
                        data={event_mark_data}/>
                    {/* {sim_addr_links.map((data,index)=> <LineSeries key={'sim_addr_link'+index} data={data} color='blue'/>)}
                    {sim_person_links.map((data,index)=> <LineSeries key={'sim_person_link'+index} data={data} color='yellow'/>)} */}
                    
                    {
                        sim_year_links.map((data,index)=> 
                        <LineSeries 
                        key={'sim_year_link'+index}
                        opacity={1/o_dist(data[0], data[1])} 
                        data={data} 
                        color='gray'
                        />)
                    }

                    <MarkSeries
                        sizeRange={[2, 5]}
                        onValueClick={ value => {
                            this.setState({hint_value:value})
                            // console.log(jsonFormat(value.event.toDict()))
                        }}
                        data={event_mark_data}
                        colorType= "literal"
                    />
                    {
                        hint_value && 
                        <Hint
                        value={hint_value}
                        >
                            <div style={{ fontSize: 8, padding: '10px', color:'black'}}>
                                {hint_value.event.toText()}
                            </div>
                        </Hint>
                    }
                    <XAxis/>
                    <YAxis/>
                </XYPlot>  
            </div>

        </div>
        )
    }
}

export default InferContour