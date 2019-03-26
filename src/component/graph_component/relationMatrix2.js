// 用于绘制力图

import React from 'react';
// import jsonFormat from 'json-format'
import {XYPlot,CustomSVGSeries, VerticalRectSeries,ContourSeries, VerticalRectSeriesCanvas, Hint, YAxis, VerticalBarSeries, LabelSeries, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries,  XAxis, AreaSeries} from 'react-vis';
import * as d3 from 'd3'
import {autorun, set} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear, triggerManager, rangeGenrator, filtEvents, triggerFilter, dictCopy, ruleFilter } from '../../dataManager/dataStore2'
import {MyBrush} from '../UI_component/myUIComponents'
import { relative } from 'path';

// 3/21 根据pagerank修建
class RealtionMatrix extends React.Component{
    all_events = []
    selected_people = []
    people_array = []
    trigger_array = []

    rect_width = 1
    personScale = person => this.people_array.findIndex(elm=> elm===person) * this.rect_width
    scalePerson = value => this.people_array[Math.floor(value/this.rect_width)]

    person_equal = {}  //相似人物的映射

    show_people_num = 17
    max_people_num = 100
    constructor(){
        super()
        this.state = {
            events_rect_data : [],
            hint_value: undefined,
        }

    }

    _onInferEventsInput = autorun(()=>{
        let event_ids = stateManager.relation_event_ids.slice()
        let events =  event_ids.map(id=> eventManager.get(id))
        
        if (events.length>0) {
            this.all_events = events
            this.loadMatrix()
        }
    })

    _onEventFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            console.log('更新事件筛选')
            let used_types = stateManager.used_types
            let need_refresh = stateManager.need_refresh
            // this.loadMatrix()
            this.loadMatrix()
        }
    })


    _changeRelationData = autorun(()=>{
        if (stateManager.is_ready) {
            let selected_people = stateManager.selected_people
            let person_ids = selected_people.map(person=> person.id)
            // 可以加个判断人是否已经全部提取所有数据了
            net_work.require('getPersonRelation', {person_ids:person_ids})
            .then(data=>{
                // console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events} = graph_data

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

                // let nums = Object.keys(person2person).map(id=> Object.keys(person2person[id]).length)
                // const temp_max = Math.max(...nums)
                // nums = nums.splice(nums.findIndex(value=> temp_max===value), 1)
                // console.log(nums)
                // this.max_person_relation_num = Math.max(...nums)
                // this.min_person_relation_num = Math.min(...nums)
                // this.relation_num_list = nums

                // console.log(this.max_person_relation_num, this.min_person_relation_num)
                this.selected_people = selected_people
                this.loadMatrix()
            })
        }
    })

    loadMatrix(){
        let {selected_people, personScale, rect_width, all_events} = this
        
        let event_array = all_events
        event_array = event_array.filter(elm=> elm.getPeople().length!==1)
        event_array = filtEvents(event_array)

        let people_array = []
        event_array.forEach(event=>{
            people_array = [...people_array, ...event.getPeople()]
        })
        people_array = [...new Set(people_array)]

        this.max_people_num = people_array.length
        people_array = people_array.sort((a,b)=> b.page_rank-a.page_rank).slice(0, this.show_people_num)
        event_array = event_array.filter(event=>{
            let people = event.getPeople()
            let num = 0
            people.forEach(person=>{
                if (people_array.includes(person)) {
                    num++
                }
            })
            return num>1
        })

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
        event_array.forEach(event=>{
            let people = event.getPeople()
            if (people.length===1) {
                // 是否要放进图中
                return
            }
            people.forEach(p1=>{
                if (!people_array.includes(p1)) {
                    return 
                }
                people.forEach(p2=>{
                    if (!people_array.includes(p2)) {
                        return 
                    }
                    if (p1===p2) {
                        return
                    }
                    person2person[p1.id][p2.id].events.push(event)
                })
            })
        })

        // 做群体发现
        const people_num = people_array.length
        if (people_num===0) {
            this.setState({events_rect_data: []})
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
                        links.push( index1 + '-' + index2)
                    }  
                }
            }
        }

        net_work.require('getCommunity', {num:people_num, links: links.join(',') })
        .then(data=>{
            let community_data = data.data
            let community2people = {}
            for(let index in community_data){
                let group = community_data[index]
                community2people[group] = community2people[group] || []
                community2people[group].push(people_array[parseInt(index)])
            }

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
                    if (person_id2===person_id1) {
                        continue
                    }
                    const p2 = personManager.get(person_id2)
                    if (!people_array.includes(p2)) {
                        continue
                    }
                    const events = person2person[person_id1][person_id2].events
                    if (events.length===0) {
                        continue
                    }
                    const center_x = personScale(p1), center_y = personScale(p2)
                    // let type2color = {
                    //     '其它': '#667db6',
                    //     '学术': '#2C5364',
                    //     '政治': '#FDC830',
                    //     '社交': '#ffc3a0',
                    //     '著述': '#c0c0aa',
                    //     '迁徙': '#FFEFBA',
                    //     // '#ACB6E5'
                    // }
                    // let types = Object.keys(type2color)
                    // let parent_types = events.map(elm=> elm.trigger.parent_type)
                    // let counts = {}
                    // parent_types.forEach(elm=>{
                    //     counts[elm]= counts[elm] || 0
                    //     counts[elm]++
                    // })
  
                    // let max_type = parent_types[0]
                    // parent_types.forEach(elm=>{
                    //     if(counts[max_type]<counts[elm]){
                    //         max_type = elm
                    //     }
                    // })
                    // console.log(counts, max_type)
                    // let main_types = 
                    // main_types =  types[Math.floor(main_types+0.5)]
                    // console.log(main_types, type2color[main_types])
                    // color(type2color[max_type]) //
                    const color = d3.rgb(200, 200, 200)
                    let rect_data = {
                        x: center_x - rect_width/2,  //为啥要平移一格呀
                        y: center_y + rect_width/2,
                        x0: center_x + rect_width/2,
                        y0: center_y - rect_width/2,
                        color: color.darker([events.length/3+0.25]),
                        event_ids: events.map(event=>event.id),
                        person_x_id: p1.id,
                        person_y_id: p2.id,
                    }

                    relation_rect_data.push(rect_data)
                    now_events = [...now_events, ...events]
                }
            }
            this.setState({events_rect_data: relation_rect_data})
        })
    }

    static get defaultProps() {
        return {
          width: 470,
          height: 480,
          padding:{
              top: 0,
              bottom: 0,
              left: 0,
              right: 0
          }
        };
    }
    
    // 分两个矩阵画？
    render(){
        console.log('render 关系矩阵')
        let { width, height, padding} = this.props
        const right_part_width = 250
        // let svg_width = width-right_part_width>height?height:width-right_part_width
        let svg_width = width - padding.right- padding.left;
        let svg_height = svg_width - padding.top - padding.bottom;

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

        let {events_rect_data, hint_value} = this.state
        let hint_point_rect = [], personX, personY, label_datas
        const people_num = people_array.length

        if (hint_value && people_num>17) {
            hint_value = dictCopy(hint_value)
            const {rect_width} = this
            const {x ,x0, y, y0} = hint_value
            personY = this.scalePerson((x+x0)/2)
            personX = this.scalePerson((y+y0)/2)

            hint_point_rect = [{ 
                x: x0, y: y, x0: 0, y0: y0 //X方向
            },{
                x: x, y: people_array.length*rect_width, x0: x0, y0: y //Y方向
            }]
            // console.log(hint_point_rect)
            hint_value.x = (x+x0)/2
            hint_value.y = (y+y0)/2
            if (personX && personY) {
                label_datas = [
                    { x: 0, y: (y+y0)/2, label: personX.name, style:{fontFamily: 'STKaiti'}},
                    { x: (x+x0)/2+rect_width, y: people_array.length*rect_width, label: personY.name, style:{fontFamily: 'STKaiti'}}
                ]                
            }
        }

        let x_label_data = people_array.map(person=>{
            return {
                x: this.personScale(person)+this.rect_width/2, 
                y: people_array.length*this.rect_width, 
                label: person.getName(),
                rotation: 45,
                yOffset: -10,
                style:{fontFamily: 'STKaiti'}
            }
        })
        let y_label_data = people_array.map(person=>{
            return {
                x: 0, 
                y: this.personScale(person),
                rotation: 45,
                label: person.getName(),
                style:{fontFamily: 'STKaiti'}
            }
        })

        const padding_e = people_num<=3?2:1.1

        return (
            <div style={{width:width, height:height, paddingTop:padding.top, paddingBottom:padding.bottom,paddingLeft:padding.left,paddingRight:padding.right}}>
                {/* 这个范围应该是会变的 */}
                <div style={{display:'grid',gridTemplateColumns:'130px 50px',marginLeft:'300px'}}>
                    <div>
                    <input ref='show_people_num_range' className={'rs-range'} type='range' min="1" max={this.max_people_num} value={this.show_people_num} 
                    onChange={event=>{
                        this.show_people_num = parseInt(this.refs.show_people_num_range.value)
                        this.loadMatrix()
                    }}/>
                    </div>
                    <div><span style={{fontFamily:'STKaiti',fontSize:'12px',marginLeft:'5px',fontWeight:600,marginTop:'5px',display:'block'}}>{this.max_people_num}</span></div>
                </div>
                <div style={{width:svg_width, height:svg_height}}>
                    <XYPlot
                    width={svg_width}
                    height={svg_height}
                    // animation
                    onMouseLeave={event => this.setState({hint_value: undefined})}
                    xDomain={[-people_num*(padding_e-1), people_num*padding_e]}
                    yDomain={[-people_num*(padding_e-1), people_num*padding_e]}
                    >
                    <VerticalRectSeries
                        data={events_rect_data} 
                        colorType= "literal"
                        stroke='white'
                        style={{strokeWidth: 1}}
                        onValueMouseOver={value=>this.setState({hint_value: value})}
                    />
                    {
                        hint_value &&
                        <Hint value={hint_value}>
                            <div style={{ fontSize: 8, padding: '10px', color:'white', background:'black'}}>
                                {hint_value.event_ids.map(id => 
                                    <div key={id}>
                                        {eventManager.get(id).toText()}
                                    </div>
                                )
                                }
                            </div>
                        </Hint>
                    }
                    {
                        hint_value &&
                        <LabelSeries 
                        data={label_datas}
                        labelAnchorX= 'end'
                        labelAnchorY= 'end'
                        />
                    }
                    {
                        people_num<19 && 
                        <LabelSeries
                        labelAnchorX= 'middle'
                        labelAnchorY= 'end'
                        data = {x_label_data}
                        />
                    }
                     {
                        people_num<19 && 
                        <LabelSeries
                        labelAnchorX= 'end'
                        labelAnchorY= 'middle'
                        data = {y_label_data}
                        />
                    }
                    </XYPlot>
                </div>
            </div>
        )
    }
}

export default RealtionMatrix