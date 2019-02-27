import React from 'react';
import PropTypes from 'prop-types';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import jsonFormat from 'json-format'
import {XYPlot,ContourSeries, YAxis, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis} from 'react-vis';
import * as d3 from 'd3'
import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { link } from 'fs';

class InferContour extends React.Component {
    constructor(){
        super()
        this.state = {
            event_mark_data: [],
            event_link_datas: [],  //同类事件连起来
        }
    }

    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            console.log('加载基于contour推理试图数据')
            let event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:event_id, depth:2, trigger_num:50, event_num:200})
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
                    addr_vecs = addrs.map(addr=>addr.vec)
                }else{
                    let addr_vec = Array(DIM)
                    for (let index = 0; index < DIM; index++) {
                        addr_vec[index] = 0
                    }
                    addr_vecs = [addr_vec]
                }
                // console.log(addr_vecs, time_vec, person_vec1, trigger_vec1)
                event2vec[event.id] = addr_vecs.map(addr_vec=> 
                    [...time_vec, ...person_vec1, ...trigger_vec1, ...person_vec2, ...trigger_vec2, ...addr_vec]
                )
            }
        })
        // console.log(event2vec)
        let index2event_id = {}
        let vecs = []
        let index = 0
        for(let event_id in event2vec){
            // eslint-disable-next-line no-loop-func
            event2vec[event_id].forEach(vec=>{
                vecs.push(vec)
                index2event_id[index] = event_id
                index++
            })
        }

        
        let opt = {
            epsilon: 10,  // epsilon is learning rate (10 = default)
            perplexity: 50, // roughly how many neighbors each point influences (30 = default)
            dim: 2 // dimensionality of the embedding (2 = default)
        }
        let tsne = new tsnejs.tSNE(opt); // create a tSNE instance
        // vecs = [...vecs.slice(0,120)]
        // console.log(vecs)
        tsne.initDataRaw(vecs);  //这里用dist会出问题
        for(var k = 0; k <500; k++) {
            tsne.step(); // every time you call this, solution gets better
        }
          
        vecs = tsne.getSolution(); // Y is an array of 2-D points that you can plot

        let event_mark_data = []
        let main_people = center_events.roles.map(elm=> elm.person)
        vecs.forEach((vec,index)=>{
            let event_id = index2event_id[index]
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
                event: event,
                size: imp,
                color: color.darker([main_people_num])
            })
        })
        // 找到相似的
        // 相同时间的事件
        let sim_year_events = {}, sim_addr_events = {}, sim_person_events = {}, sim_trigger_events = {}
        event_array.forEach(event=>{
            if (event.isCertain()) {
                let year = event.time_range[0]
                sim_year_events[year] = sim_year_events[year] || []
                sim_year_events[year].push(event)
            }
            event.addrs.forEach(addr=>{
                sim_addr_events[addr.id] = sim_addr_events[addr.id] || []
                sim_addr_events[addr.id].push(event)
            })
            event.roles.forEach(elm=>{
                let person = elm.person
                sim_person_events[person.id] = sim_person_events[person.id] || []
                sim_person_events[person.id].push(event)
            })
            let trigger = event.trigger
            sim_trigger_events[trigger.id] = sim_trigger_events[trigger.id] || []
            sim_trigger_events[trigger.id].push(event)
        })

        let event_link_datas = []
        // console.log(sim_year_events, sim_addr_events, sim_person_events, sim_trigger_events)
        let temp_array = [sim_year_events, sim_addr_events, sim_person_events, sim_trigger_events]
        const show_link_index = []
        temp_array.forEach((dict, dict_index)=>{
            if (!show_link_index.includes(dict_index)) {
                return
            }
            const type_array = ['相同年份', '相同地点', '相同人物', '相同事件类型'] 
            let type = type_array[dict_index]

            for(let key in dict){
                let events = dict[key]
                let this_line_data = []
                // eslint-disable-next-line no-loop-func
                events.forEach((event,index)=>{
                    let event_vecs = vecs.filter((vec,index)=>index2event_id[index]===event.id)
                    let points = event_vecs.map(vec=>{
                        return {
                            x: vec[0], 
                            y: vec[1], 
                            event: event,
                            type: type,
                            key: key,
                        }
                    })    
                    this_line_data = [...this_line_data, ...points]
                    // if (index>1) {
                    //     let former_event = events[index-1]
                    //     let former_event_vecs = vecs.filter((vec,index)=>index2event_id[index]===former_event.id)
    
                    //     former_event_vecs.forEach(fromer_vec=>{
                    //         event_vecs.forEach(vec=>{
                    //         })
                    //     })
                    // }
                })
                this_line_data = this_line_data.sort((a,b)=>{
                    if (a.x!==b.x) {
                        return a.x-b.x
                    }else{
                        return a.y-b.y
                    }
                })
                event_link_datas.push(this_line_data)
            }
        })
        event_link_datas = event_link_datas.filter(array=> array.length>1)
        
        this.setState({
            event_mark_data: event_mark_data,
            event_link_datas: event_link_datas
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
        let {event_mark_data, event_link_datas} = this.state

        return(
        <div className='InferContour' style={{width:width, height:height}}>
            <XYPlot
            width={width}
            height={height}>  
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
                <MarkSeries
                    sizeRange={[2, 5]}
                    onValueClick={ value=> console.log(jsonFormat(value.event.toDict()))}
                    data={event_mark_data}
                    colorType= "literal"
                />
                {
                    event_link_datas.map(data=>
                        <LineSeries
                        key={data[0].type + '_' + data[0].key}
                        data={data}
                        /> 
                    )
                }
                <XAxis/>
                <YAxis/>
            </XYPlot>  
        </div>
        )
    }
}

export default InferContour