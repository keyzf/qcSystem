// 用于绘制力图

import React from 'react';
import PropTypes from 'prop-types';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';

import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';

import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../dataManager/dataStore2'

class InferContour extends React.Component {
    constructor(){
        super()
        this.state = {

        }
    }

    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            console.log('加载基于contour推理试图数据')
            let event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:event_id, depth:2})
            .then(data=>{
                console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events, addrs, people} = graph_data
                let center_events = eventManager.get(event_id)
                this.calcualteEventMark(events, center_events)
                // console.log(events)
            })
        }
    })

    calcualteEventMark = (events, center_events)=>{
        let event_array = dataStore.dict2array(events)
        let event2vec = {}
        const DIM = 20

        event_array.forEach(event=>{
            let event_id = event.id
            let event_vec = []
            if(event.isCertain()){
                let event_year = event.time_range[0]
                // console.log(event_year)
                let time_vec = Array(DIM)
                for (let index = 0; index < DIM; index++) {
                    time_vec[index] = event_year - 900
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
                event2vec[event.id] = addr_vecs.map(addr_vec=> 
                    [...time_vec, ...person_vec1, ...trigger_vec1, ...person_vec2, ...trigger_vec2, addr_vec]
                )
            }
        })
        console.log(event2vec)
        let event2index = {}
        let vecs = []
        let index = 0
        for(let event_id in event2vec){
            vecs.push(event2vec[event_id])
            event2index[event_id] = index
            index++
        }
        
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

        return(
        <div className='InferContour' style={{background:'gray', width:width, height:height}}>
            <XYPlot
            width={width}
            height={height}>  

            </XYPlot>  
        </div>
        )
    }
}

export default InferContour