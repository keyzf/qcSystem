// 用于绘制力图

import React from 'react';
// import jsonFormat from 'json-format'
import {XYPlot,VerticalRectSeries,ContourSeries, VerticalRectSeriesCanvas, YAxis, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis} from 'react-vis';
import * as d3 from 'd3'
import {autorun, set} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear, triggerManager, range_genrator } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { link, linkSync } from 'fs';
import { renderReporter } from 'mobx-react';
import {MyBrush} from '../UI_component/myUIComponents'

// import Slider, { Range } from 'rc-slider';

import LifeLineMethod from '../UI_component/lifeLineMethod'
class RealtionMatrix extends React.Component{
    all_events = []
    selected_trigger_types = []
    selected_people = []
    people_array = []
    trigger_array = []

    rect_width = 1
    personScale = person => this.people_array.findIndex(elm=> elm===person) * this.rect_width

    person_equal = {}  //相似人物的映射

    min_relation_num = 0
    max_relation_num = 9999

    max_person_relation_num = 9999  //个人相关事件的最大数目
    min_person_relation_num =  0
    relation_num_list = []

    constructor(){
        super()
        this.state = {
            events_rect_data : [],
            trigger_rect_data: []
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

                let person2person = {}
                this.all_events.forEach(event=>{
                    let people = event.getPeople()
                    people.forEach(person1=>{
                        person2person[person1.id] = person2person[person1.id] || {}
                        people.forEach(person2=>{
                            if (person1 === person2) {
                                return
                            }
                            person2person[person1.id][person2.id] = 1
                        })
                    })
                })

                let nums = Object.keys(person2person).map(id=> Object.keys(person2person[id]).length)
                this.max_person_relation_num = Math.max(...nums)
                this.min_person_relation_num = Math.min(...nums)
                this.relation_num_list = nums

                // console.log(this.max_person_relation_num, this.min_person_relation_num)
                this.selected_people = selected_people
                this.loadMatrix()
            })
        }
    })

    loadMatrix(){
        let {selected_trigger_types, selected_people, personScale, rect_width, all_events} = this
        
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
        
        // // 将关系完全一样的折叠
        // let person_equal = this.person_equal
        // people_array.forEach(person=>{
        //     person_equal[person.id] = person
        // })
        // people_array.forEach(person1=>{
        //     let event_list1 = people_array.map(temp_person=>{
        //         return person2person[person1.id][temp_person.id].events
        //     })
        //     people_array.forEach(person2=>{
        //         let event_list2 = people_array.map(temp_person=>{
        //             return person2person[person2.id][temp_person.id].events
        //         })
        //         for (let index = 0; index < event_list1.length; index++) {
        //             const events1 = event_list1[index];
        //             const events2 = event_list2[index];
        //             let  trigger1 = new Set(event1.map(event=> event.trigger.name)

        //             let all_is_in = true
        //             // eslint-disable-next-line no-loop-func
        //             events1.forEach(event=>{
        //                 if (!events2.includes(event)) {
        //                     all_is_in = false
        //                 }
        //             })
        //             events1.forEach(event=>{
        //                 if (!events2.includes(event)) {
        //                     all_is_in = false
        //                 }
        //             })  
        //         }
        //     })
        // })

        

        // 筛掉关系数小于多少的人，也会影响到关系数和小喽喽有关的人，所以有问题
        let temp_people_array = [...people_array]
        let min_relation_num = this.min_relation_num, max_relation_num = this.max_relation_num

        people_array = people_array.filter((person, index)=>{
            let event_list = temp_people_array.map(temp_person=>{
                return person2person[person.id][temp_person.id].events
            }).filter(events=> events.length>0)
            let relation_num = event_list.length

            // let events = all_events.filter(event=> person.isIn(event))
            if (relation_num<min_relation_num || relation_num>max_relation_num) {
                // console.warn(person, '非常的孤单')
            }
            return relation_num>=min_relation_num && relation_num<=max_relation_num
        })

        // 去掉没有小喽喽后也出去的人
        temp_people_array = [...people_array]
        people_array = people_array.filter((person, index)=>{
            let event_list = temp_people_array.map(temp_person=>{
                return person2person[person.id][temp_person.id].events.filter(event=>{
                    let all_is_in = true
                    let roles = event.getPeople()
                    roles.forEach(person=>{
                        if (!temp_people_array.includes(person))
                            all_is_in = false
                    })
                    return all_is_in
                })
            }).filter(events=> events.length>0)
            let relation_num = event_list.length
            return relation_num!==0
        })
        this.people_array = people_array
        const people_num = people_array.length
        if (people_num===0) {
            this.setState({events_rect_data: [], trigger_rect_data:[]})
            console.log('关系矩阵没人啦')
            return
        }

        let links = []
        for(let person_id1 in person2person){
            const p1 = personManager.get(person_id1)
            for(let person_id2 in person2person[person_id1]){
                const p2 = personManager.get(person_id2)
                const events = person2person[person_id1][person_id2].events
                if (events.length>0) {
                    const index2 = people_array.findIndex(elm=>elm===p1)
                    const index1 = people_array.findIndex(elm=>elm===p2)
                    if (index1>index2 && index1!==-1 && index2!==-1) {
                        // console.log(index1, index2)
                        links.push( index1 + '-' + index2)
                    }  
                }
            }
        }

        // console.log(links)
        net_work.require('getCommunity', {num:people_num, links: links.join(',') })
        .then(data=>{
            let community_data = data.data
            let community2people = {}
            for(let index in community_data){
                let group = community_data[index]
                community2people[group] = community2people[group] || []
                community2people[group].push(people_array[parseInt(index)])
            }
            // console.log(community2people, community_data, people_array)

            let temp_people_array = [...people_array]
            people_array = people_array.sort((p1,p2)=>{
                const index2 = temp_people_array.findIndex(elm=>elm===p1)
                const index1 = temp_people_array.findIndex(elm=>elm===p2)
                return parseInt(community_data[index1])-parseInt(community_data[index2])
            })
            this.people_array = people_array

            let now_events = []
            for(let person_id1 in person2person){
                const p1 = personManager.get(person_id1)
                if (!people_array.includes(p1)) {
                    continue
                }
                for(let person_id2 in person2person[person_id1]){
                    const p2 = personManager.get(person_id2)
                    if (!people_array.includes(p2)) {
                        continue
                    }
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
                        events: events.map(event=>event)
                    }

                    // console.log(rect_data,p1.name, p2.name, selected_trigger_types)
                    relation_rect_data.push(rect_data)
                    now_events = [...now_events, ...events]
                }
            }

            now_events = [...new Set(now_events)]
            let trigger2triggers = {}
            let triggers = [...new Set(now_events.map(event=> event.trigger))]
            let trigger_rect_data = []
            this.trigger_array = triggers
            triggers.forEach(trigger1=>{
                trigger2triggers[trigger1.id] = {}
                triggers.forEach(trigger2=>{
                    trigger2triggers[trigger1.id][trigger2.id] = []
                })
            })
            for(let person_id1 in person2person){
                const p1 = personManager.get(person_id1)
                if (!people_array.includes(p1)) {
                    continue
                }
                for(let person_id2 in person2person[person_id1]){
                    const p2 = personManager.get(person_id2)
                    if (!people_array.includes(p2)) {
                        continue
                    }
                    const events = person2person[person_id1][person_id2].events
                    const person_scale_triggers = [...new Set(events.map(event=>event.trigger))]
                    person_scale_triggers.forEach(trigger1=>{
                        person_scale_triggers.forEach(trigger2=>{
                            trigger2triggers[trigger1.id][trigger2.id].push([p1,p2, events])
                        })
                    })
                }
            }
            triggers.forEach(trigger1=>{
                triggers.forEach(trigger2=>{
                    if (trigger1===trigger2) {
                        return
                    }
                    const perosn_pairs = trigger2triggers[trigger1.id][trigger2.id]
                    if (perosn_pairs.length===0) {
                        return
                    }
                    const center_x = triggers.findIndex(elm=> elm===trigger1)*rect_width, 
                        center_y = triggers.findIndex(elm=> elm===trigger2)*rect_width
                    if (center_y>center_x) {
                        return
                    }
                    const color = d3.rgb(255, 255, 255)
                    let rect_data = {
                        x: center_x - rect_width/2-rect_width,  //为啥要平移一格呀
                        y: center_y - rect_width/2,
                        x0: center_x + rect_width/2-rect_width,
                        y0: center_y + rect_width/2,
                        color: color.darker([perosn_pairs.length+1]),
                        perosn_pairs: perosn_pairs
                    }
                    trigger_rect_data.push(rect_data)
                })
            })
            // console.log(triggers, trigger_rect_data)
            // console.log(relation_rect_data)
            this.setState({events_rect_data: relation_rect_data, trigger_rect_data:trigger_rect_data})
        })
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

    // 分两个矩阵画？
    render(){
        console.log('render 关系矩阵')
        let { width, height} = this.props
        const right_part_width = 250
        let svg_width = width-right_part_width>height?height:width-right_part_width
        let svg_height = svg_width
        let people_array = this.people_array
        let selected_people = this.selected_people
        let all_events = this.all_events
        let trigger_array = this.trigger_array
        // 只提取跟主角有关的事件类型
        let main_events = all_events.filter(event=>{
            let people = event.getPeople()
            for (let index = 0; index < people.length; index++) {
                const person = people[index];
                if (selected_people.includes(person)) {
                    return true
                }
                return false
            }
        })
        // console.log(selected_people, main_events, all_events)
        let types = triggerManager.ownCountType(main_events)

        let {events_rect_data, trigger_rect_data} = this.state
        // console.log(people_array, events_rect_data, trigger_rect_data)
        // background:'gray'
        return (
            <div style={{width:width, height:height, position:"absolute", }}>
                <div style={{width:svg_width, height:height, top: 0, left:10, position:"absolute"}}>
                    <XYPlot
                    width={svg_width}
                    height={svg_height}
                    // xDomain={[-1,people_array.length+1]}
                    // yDomain={[-1,people_array.length+1]}
                    // margin={{left: 10, right: 10, top: 10, bottom: 10}}
                    >
                    <VerticalRectSeries
                        data={events_rect_data} 
                        colorType= "literal"
                        stroke='black'
                        style={{strokeWidth: 0.001}}
                        onValueClick={value=>{
                            console.log(value.events)
                        }}
                    />
                    <XAxis
                        orientation='top'
                        tickValues={people_array.map((person,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                if ( people_array[value]) {
                                    return people_array[value].name
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickSize={0}
                        top={20}
                        tickLabelAngle = {45}
                    />
                    <YAxis
                        tickValues={people_array.map((person,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                // console.log(value, index, scale, tickTotal)
                                if ( people_array[value]) {
                                    return people_array[value].name
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickSize={0}
                        // tickLabelAngle = {45}
                        left={20}
                    />
                    </XYPlot>
                </div>
                
                {/* 邻接矩阵 */}
                {/* <div style={{width:right_part_width, height:right_part_width, top: 10, left:20, position:"absolute"}}>
                    <XYPlot
                    width={svg_width}
                    height={svg_height}>
                    <VerticalRectSeries
                        data={trigger_rect_data} 
                        colorType= "literal"
                        stroke='black'
                        style={{strokeWidth: 0.001}}
                        onValueClick={value=>{
                            console.log(value.events)
                        }}
                    />
                    <XAxis title='事件类型'
                        tickValues={trigger_array.map((trigger,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                if ( trigger_array[value]) {
                                    return trigger_array[value].name + value
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickSize={0}
                        top={20}
                        tickLabelAngle = {45}
                    />
                    <YAxis title='事件类型'
                    orientation='right'
                        tickValues={trigger_array.map((trigger,index)=> index)}
                        tickFormat={
                            (value, index, scale, tickTotal)=>{
                                // console.log(value, index, scale, tickTotal)
                                if ( trigger_array[value]) {
                                    return trigger_array[value].name + value
                                }else{
                                    return ''
                                }
                            }
                        }
                        tickSize={0}
                        // tickLabelAngle = {45}
                        left={20}
                    />
                    </XYPlot>
                </div> */}

                {/* 选择显示的类型 */}
                <div style={{top: 0, left:svg_width+10, position:"absolute", height:height-50, width:right_part_width, overflowY:'scroll'}}>
                    <LifeLineMethod                         
                    data={types} 
                    onChange={this.handleSelectTypeChange}
                    />
                </div>
                {/* 这个范围应该是会变的 */}
                <div style={{left:svg_width+50, position:"absolute", height:50, bottom:20, width:right_part_width}}>
                    {/* <input  ref='max_relation_num_ranges' type="range" step={1} value={this.max_relation_num} min={1} max={100} onChange={(event,value)=>{
                        this.max_relation_num = parseInt(this.refs.max_relation_num_ranges.value)
                        this.loadMatrix()
                    }}/>
                    <input ref='min_relation_num_ranges' type="range" step={1} value={this.min_relation_num} min={1} max={10} onChange={(event,value)=>{
                        this.min_relation_num = parseInt(this.refs.min_relation_num_ranges.value)
                        this.loadMatrix()
                    }}/> */}
                    <MyBrush 
                    range={[this.min_person_relation_num, this.max_person_relation_num] }
                    input_list={this.relation_num_list}
                    onChange={
                        range=> {
                            if (range) {
                                this.max_relation_num = Math.ceil(range[1])
                                this.min_relation_num = Math.floor(range[0])                                
                            }else{
                                this.max_relation_num = this.max_person_relation_num
                                this.min_relation_num = this.min_person_relation_num
                            }

                            this.loadMatrix()
                        }
                    }/>
                    {/* <Slider/> */}
                </div>
            </div>
        )
    }
}

export default RealtionMatrix