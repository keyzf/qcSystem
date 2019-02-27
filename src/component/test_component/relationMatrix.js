// 用于绘制力图

import React from 'react';
import jsonFormat from 'json-format'
import {XYPlot,VerticalRectSeries,ContourSeries, VerticalRectSeriesCanvas, YAxis, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis} from 'react-vis';
import * as d3 from 'd3'
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear, triggerManager } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { link } from 'fs';
import { renderReporter } from 'mobx-react';
import LifeLineMethod from '../UI_component/lifeLineMethod'
class RealtionMatrix extends React.Component{
    all_events = []
    selected_trigger_types = []
    selected_people = []
    people_array = []

    rect_width = 1
    personScale = person => this.people_array.findIndex(elm=> elm===person) * this.rect_width

    constructor(){
        super()
        this.state = {
            matrix_rect_data : [],
        }
    }

    _changeRelationData = autorun(()=>{
        if (stateManager.is_ready) {
            let selected_people = stateManager.selected_people
            let person_ids = selected_people.map(person=> person.id)
            // 可以加个判断人是否已经全部提取所有数据了
            net_work.require('getPersonRelation', {person_ids:person_ids})
            .then(data=>{
                // console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events, addrs, people} = graph_data

                // 对多个人的情况取并集
                let intersect_people = new Set()
                selected_people.forEach((person, index)=>{
                    let related_people = new Set( person.getRelatedPeople() )
                    if (index===0) {
                        intersect_people = related_people
                    }else{
                        intersect_people = new Set([...related_people].filter(person=> intersect_people.has(person)))
                    }
                })
                this.all_events = dataStore.dict2array(events).filter(event=> event.roles.length>1)
                selected_people.forEach(person=>{
                    intersect_people.add(person)
                })
                this.all_events = this.all_events.filter(event=>{
                    let people = event.getPeople()
                    let all_is_in = true
                    people.forEach(person=>{
                        if (!intersect_people.has(person)) {
                            all_is_in = false
                        }
                    })
                    return all_is_in
                })
                this.selected_people = selected_people
                this.loadMatrix()
            })
        }
    })

    loadMatrix(){
        
        let {selected_trigger_types, selected_people, personScale, rect_width} = this
        
        
        let event_array = this.all_events
        event_array = event_array.filter(event=> {
            if(selected_trigger_types.length===0)
                return true
            for (let index = 0; index < selected_trigger_types.length; index++) {
                const element = selected_trigger_types[index];
                if (event.trigger.equal(element)) {
                    return true
                }
            }
            return false
        })
        // console.log(event_array, selected_trigger_types)
        let people_array = []
        event_array.forEach(event=>{
            // console.log(event, event.getPeople().map(person=>person.name), people_array.map(person=>person.name))
            people_array = [...people_array, ...event.getPeople()]
        })
        people_array = [...new Set(people_array)]
        this.people_array = people_array

        let relation_rect_data = []
        let person2person = {}
        people_array.forEach(p1=>{
            person2person[p1.id] = {}
            people_array.forEach(p2=>{
                person2person[p1.id][p2.id] = {
                    events: []
                }
            })
        })
        // console.log(people_array.map(person=>person.name))
        event_array.forEach(event=>{
            let people = event.getPeople()
            if (people.length===1) {
                // 是否要放进图中
                return
            }
            people.forEach(p1=>{
                people.forEach(p2=>{
                    if (p1===p2) {
                        return
                    }
                    person2person[p1.id][p2.id].events.push(event)
                })
            })
        })

        

        for(let person_id1 in person2person){
            const p1 = personManager.get(person_id1)
            // console.log(p1.name)
            for(let person_id2 in person2person[person_id1]){
                const p2 = personManager.get(person_id2)
                const events = person2person[person_id1][person_id2].events
                // console.log(events)
                if (events.length===0) {
                    continue
                }
                const center_x = personScale(p1), center_y = personScale(p2)
                // if (center_y<center_x) {
                //     continue
                // }
                const color = d3.rgb(255, 255, 255)
                let rect_data = {
                    x: center_x - rect_width/2-rect_width,  //为啥要平移一格呀
                    y: center_y - rect_width/2,
                    x0: center_x + rect_width/2-rect_width,
                    y0: center_y + rect_width/2,
                    color: color.darker([events.length+1]),
                    events: events.map(event=>event.toText())
                }
                // console.log(rect_data,p1.name, p2.name, selected_trigger_types)
                relation_rect_data.push(rect_data)
            }
        }
        // console.log(relation_rect_data)
        this.setState({matrix_rect_data: relation_rect_data})
    }

    static get defaultProps() {
        return {
          width: 400,
          height: 300,
        };
    }
    handleSelectTypeChange = (event, {checked, my_type, label}) =>{
        // console.log(event, checked, my_type, label)
        let selected_trigger_types = this.selected_trigger_types
        if (checked) {
            if (!selected_trigger_types.includes(label)) {
                selected_trigger_types.push(label)
            }
        }else{
            this.selected_trigger_types = selected_trigger_types.filter(elm=>elm!==label)
        }
        this.loadMatrix()
    }


    render(){
        console.log('render 关系矩阵')
        let { width, height} = this.props
        const left_part_width = 250
        let svg_width = width-left_part_width>height?height:width-left_part_width
        let svg_height = svg_width
        let people_array = this.people_array
        let types = triggerManager.ownCountType(this.all_events)

        let {matrix_rect_data} = this.state
        // console.log(people_array, matrix_rect_data)
        // background:'gray'
        return (
            <div style={{width:width, height:height, position:"absolute", }}>
                <div style={{width:svg_width, height:svg_height, top: 0, left:10, position:"absolute", background:'white'}}>
                    <XYPlot
                    width={svg_width}
                    height={svg_height}
                    xDomain={[-1,people_array.length+1]}
                    yDomain={[-1,people_array.length+1]}
                    >
                    <VerticalRectSeries
                        data={matrix_rect_data} 
                        colorType= "literal"
                        stroke='black'
                        style={{strokeWidth: 0.001}}
                        onValueClick={value=>{
                            console.log(value.events)
                        }}
                    />
                    <XAxis title='人物' 
                        tickValues={people_array.map((person,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                if ( people_array[value]) {
                                    return people_array[value].name + value
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickLabelAngle = {45}
                    />
                    <YAxis title='人物' 
                        tickValues={people_array.map((person,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                // console.log(value, index, scale, tickTotal)
                                if ( people_array[value]) {
                                    return people_array[value].name + value
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickLabelAngle = {45}
                    />
                    </XYPlot>
                </div>
                {/* 选择显示的类型 */}
                <div style={{top: 0, left:svg_width+10, position:"absolute", height:height-50, width:left_part_width, overflowY:'scroll'}}>
                    <LifeLineMethod                         
                    data={types} 
                    onChange={this.handleSelectTypeChange}
                    />
                </div>

            </div>
        )
    }
}

export default RealtionMatrix