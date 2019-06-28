// 用于绘制力图

import React from 'react';
import PropTypes from 'prop-types';

import {XYPlot,ContourSeries, YAxis, LineMarkSeries, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis, Highlight} from 'react-vis';
import * as d3 from 'd3'
import {autorun, keys} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear, filtEvents, timeManager, dictCopy} from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { Divider, Container, Header, Table, Checkbox, Dropdown} from 'semantic-ui-react'
import cos_dist from 'compute-cosine-distance'

// 3/5 对新的embedding方法做帮助
class InferContour extends React.Component {
    
    center_event = undefined  //目前正在推的事件

    // 开始用于存所有的人物，地点，事件类型
    all_people = []
    all_addrs = []
    all_years = []
    all_triggers = []
    all_events = []

    //各维度的权重
    time_p = 1
    addr_p = 1
    person_p = 1
    trigger_p = 1

    range_lock = 0  //检测需要更新的是否是当前这个

    selected_addrs = []
    selected_triggers = []
    selected_people = []
    selected_years = []

    constructor(){
        super()
        this.state = {
            event_mark_data: [],
            event_link_datas: [],  //同类事件连起来
            hint_value: undefined,
            selected_event : undefined,
            selected_area : undefined,
            uncertain_event_mark_data: [],
            highlighting: false,

        }
    }

    _onEventFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            console.log('更新事件筛选')
            let used_types = stateManager.used_types
            // this.loadMatrix()
            this.calcualteEventMark()
        }
    })

    _loadData =  autorun(()=>{
        if (stateManager.is_ready) {
            console.log('加载基于contour推理试图数据')
            let event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:event_id, depth:3, event_num:2000})
            .then(data=>{
                console.log(data)
                data = dataStore.processResults(data.data)
                let {events} = data
                // console.log(center_event, people, event_id)
                let center_event = eventManager.get(event_id)

                this.all_events = dataStore.dict2array(events)
                if (!this.all_events.includes(center_event)) {
                    this.all_events.push(center_event)
                }
                this.center_event = center_event
                this.calcualteEventMark()
            })
        }
    })


    calcualteEventMark = ()=>{
        let {all_events, center_event} = this
        all_events = filtEvents(all_events)

        let all_triggers = all_events.map(event=> event.trigger)
        let all_addrs = [], all_people = [], all_years = []
        let {trigger_p, addr_p, time_p, person_p} = this

        all_events.forEach(event =>{
            all_addrs = [...all_addrs, ...event.addrs]
            all_people = [...all_people, ...event.getPeople()]
            if (event.isTimeCertain()) {
                all_years = [...all_years, ...event.time_range]
            }
        })
        all_years = all_years.filter(year=> isValidYear(year))
        this.all_addrs = [...new Set(all_addrs)].sort((a,b)=> a.id-b.id)
        this.all_people = [...new Set(all_people)].sort((a,b)=> a.page_rank-b.page_rank)
        this.all_triggers = [...new Set(all_triggers)].sort((a,b)=> a.id-b.id)
        this.all_years = [...new Set(all_years)].sort((a,b)=> a-b)

        all_events = this.filtEvents(all_events)

        if (!center_event) {
            console.warn('center_event不存在')
            return
        }
        console.log('推断', center_event.toText())

        let max_time = Math.max(...all_events.map(event=>{
            let time_range = event.time_range
            return time_range[1]
        }).filter(year => isValidYear(year)))

        let min_time = Math.min(...all_events.map(event=>{
            let time_range = event.time_range
            return time_range[0]
        }).filter(year => isValidYear(year)))
        
        // prob表示的该点对应的可能性
        let index2prob = {}, index = 0, vecs = []
        const vec_length = all_events[0].toVec().length
        all_events.forEach(event=>{
            // 现在只做了时间
            if (event.isTimeCertain() || event===center_event) {
                const {time_range, addrs, trigger} = event
                const people = event.getPeople()
                let people_vec = people.map(person=> person.toVec().map(elm => person_p * elm)), 
                    trigger_vec = trigger.toVec().map(elm => trigger_p * elm),
                    event_vec = event.toVec(),
                    addr_vecs = addrs.map(addrs=> addrs.toVec().map(elm => addr_p * elm))  //暂时不管地点不确定性推断
                
                let years = [time_range[0]]
                if (event===center_event) {
                    years = Object.keys(event.prob_year).map(year=> parseInt(year))
                    // console.log(years, event)
                }
                years.forEach(year=>{
                    let time = year
                    let time_vec = timeManager.get(year).vec
                    // new Array(vec_length).fill(time).map(elm=> (elm-min_time)/(max_time-min_time+1)*time_p)

                    let all_event_vecs = [time_vec, ...addr_vecs, ...people_vec, trigger_vec, event_vec] 
                    let mean_vec = all_event_vecs.reduce((total, vec)=>{
                        return total.map((elm, index)=> elm+vec[index])
                    }, new Array(vec_length).fill(0))
                    mean_vec = mean_vec.map(elm => elm/(time_p + addrs.length*addr_p + people.length*person_p + trigger_p))
                    vecs.push(mean_vec)
                    index2prob[index] = {
                        event_id: event.id,
                        year: time,
                        addr_id: addrs.map(addr=> addr.id),  //这里之后要改呀
                        people_id: people.map(person=> person.id),
                        trigger: trigger.id,
                        uncertainty_value: event.getUncertaintyValue()
                    }
                    index++                    
                })       
            }
        })

        const opt = {
            epsilon: 30,  // epsilon is learning rate (10 = default)
            perplexity: 10, // roughly how many neighbors each point influences (30 = default)
            dim: 2 // dimensionality of the embedding (2 = default)
        }
        let tsne = new tsnejs.tSNE(opt); // create a tSNE instance
        if (vecs.length===0) {
            this.setState({
                event_mark_data: [],
                uncertain_event_mark_data: []
            })
            return 
        }
        tsne.initDataRaw(vecs);  //这里用dist会出问题

        const refresh = ()=>{
            console.log('开始计算TSNE', vecs.length)
            for(var k = 0; k <50; k++) {
                tsne.step();
            }

            let new_vecs =  tsne.getSolution();
            // console.log(vecs, new_vecs)
            let event_mark_data = [], uncertain_event_mark_data= []
            let main_people = center_event.getPeople()
            new_vecs.forEach((new_vec,index)=>{
                let prob = index2prob[index]
                let event = eventManager.get(prob.event_id)
                let x = new_vec[0]
                let y = new_vec[1]
                let imp = event.roles.reduce((total, role)=>{
                    return total + event.getImp(role.person) 
                },0)/event.roles.length

                let main_people_num = main_people.reduce((total,person)=>{
                    return person.isIn(event)? 1:0
                }, 0)
                
                // console.log(color, main_people_num, color.darker([main_people_num]), main_people)
                let point = {
                    x: x, 
                    y: y,
                    year: prob.year,
                    addr:prob.addr_id,
                    event_id: prob.event_id,
                    size: imp,
                    vec: vecs[index],
                }

                if (event===center_event){
                    point.color = 'red'
                    let copy = dictCopy(point)
                    let {year, event_id} = copy
                    let event = eventManager.get(event_id)
                    let prob = event.prob_year[year]
                    prob = prob || 0.2
                    copy.size = prob
                    uncertain_event_mark_data.push(point)
                }else{
                    const color = d3.rgb(30, 30, 30).brighter()
                    point.color = color.darker([main_people_num])
                    event_mark_data.push(point)
                }
            })
            if (event_mark_data.length===1) {
                event_mark_data[0].x = 0
                event_mark_data[0].y = 0
            }
            // uncertain_event_mark_data = uncertain_event_mark_data.sort((a,b)=>a.year-b.year)
            this.setState({
                event_mark_data: event_mark_data,
                uncertain_event_mark_data: uncertain_event_mark_data
            })
            // console.log(uncertain_event_mark_data)
        }

        // let func_arr = new Array(5).fill(()=> setTimeout(refresh, 1000))
        // func_arr.reduce(function(cur, next) {
        //     return cur.then(next);
        // }, Promise.resolve()).then(function() {
        //     console.log('job finished');
        // });
        refresh()
    }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }


    filtEvents = (events)=>{
        const {selected_addrs, selected_triggers, selected_people, selected_years} =  this
        const oneInAnother = (arr1, arr2)=>{
            let is_in = false
            arr1.forEach(elm1=>{
                if (is_in) {
                    return
                }
                if (arr2.includes(elm1)) {
                    is_in = true
                }
            })
            return is_in
        }
        return events.filter(event=> 
            oneInAnother(event.getPeople(), selected_people) || 
            oneInAnother(event.addrs, selected_addrs) || 
            selected_triggers.includes(event.trigger) ||
            selected_years.includes(event.time_range[0]) ||
            (selected_addrs.length===0 && selected_people.length===0 && selected_people.length===0 && selected_years.length===0)
        )
    }

    findSimilaerEvents = (show_event_mark_data, num)=>{
        show_event_mark_data = show_event_mark_data.sort((a,b)=>{
            let vec1 = a.vec, vec2 = b.vec
            return cos_dist(vec1, vec2)
        })
        return show_event_mark_data.slice(0,num)
    }
    render(){
        console.log('render 基于contour的推理试图')
        let {width, height} = this.props
        let {event_mark_data, highlighting, selected_event, selected_area, uncertain_event_mark_data, hint_value} = this.state
        const {center_event, all_people, all_addrs, all_triggers, all_years} = this
        let {trigger_p, addr_p, time_p, person_p} = this

        let show_event_mark_data = [] 
        let hint_values = []
        let neighbor_marks = []
        if (selected_event) {
            event_mark_data = event_mark_data.map(data=>{
                let temp_data = {}
                for(let key in data){
                    temp_data[key] = data[key]
                }
                if (data.event_id===selected_event.id) {
                    temp_data.color = 'blue'
                    temp_data.size = temp_data.size+2
                    hint_values.push(temp_data)
                }
                return temp_data
            })

            show_event_mark_data = event_mark_data
            // neighbor_marks = this.findSimilaerEvents(event_mark_data, 20)   //这里有问题呀
        }else{
            show_event_mark_data = event_mark_data
        }

        if (selected_area) {
            const is_in = (mark, area)=>{
                let {x,y} = mark
                let {right, left, bottom, top} = area
                return x<=right && x>=left && y<=top && y>=bottom
            }
            let temp_hint_values =  hint_values.filter(mark_data=>is_in(mark_data, selected_area))
            let temp_show_event_mark_data = show_event_mark_data.filter(mark_data=>is_in(mark_data, selected_area))
            let temp_uncertain_event_mark_data = uncertain_event_mark_data.filter(mark_data=>is_in(mark_data, selected_area))
            if (temp_show_event_mark_data.length>1 || temp_uncertain_event_mark_data.length>1 || temp_hint_values.length>1) {
                show_event_mark_data = temp_show_event_mark_data
                uncertain_event_mark_data = temp_uncertain_event_mark_data
                hint_values = temp_hint_values
            }
        }
        
        const right_bar_width = 300, range_height = 90, range_left = 50
        let show_table_events = show_event_mark_data.map(data=> eventManager.get(data.event_id))
        // neighbor_marks.length!==0? neighbor_marks.map(elm=> eventManager.get(elm.event_id)) : show_event_mark_data.map(elm=> eventManager.get(elm.event_id))
        show_table_events = [...new Set(show_table_events)]

        const onRangeChange = event=>{
            this.time_p = this.refs.time_p.value
            this.addr_p = this.refs.addr_p.value
            this.person_p = this.refs.person_p.value
            this.trigger_p = this.refs.trigger_p.value

            this.range_lock++
            let now_range_lock = this.range_lock
            setTimeout(()=>{
                if (this.range_lock===now_range_lock) {
                    this.calcualteEventMark()
                    this.range_lock = 0
                }
            }, 300)
        }
        return(
        <div className='InferContour' style={{width:width, height:height}} 
            onMouseLeave={
                ()=>this.setState(
                    {hint_value:undefined, selected_event:undefined, selected_area: undefined}
                )}>
            <div style={{
                left: width-right_bar_width+20, 
                width:right_bar_width, 
                top:0}}>
                {center_event && center_event.toText()}
            </div>
            {/* 调节权重 */}
            <div style={{left: width-right_bar_width+20, width:right_bar_width, top:30, position:'relative'}}>
                <div style={{top: 0,  width: right_bar_width}}>
                    <div>时间:</div>
                    <input type='range' ref='time_p' max={10} min={0}  step={1} onChange={onRangeChange} defaultValue={time_p}/>
                    <Dropdown 
                        fluid multiple search selection 
                        placeholder='时间' 
                        options={all_years.map(year=>{ return {'key': year, 'text': year, 'value':year}})}
                        onChange={(event,{value})=>{
                            this.selected_years = value.map(year=> parseInt(year))
                            this.calcualteEventMark()
                        }}/>
                </div>
                <div style={{top: 0,  width: right_bar_width}}>
                    <div>地点:</div>
                    <input type='range' ref='addr_p' max={10} min={0}  step={1} onChange={onRangeChange} defaultValue={addr_p}/>
                    <Dropdown 
                        fluid multiple search selection 
                        placeholder='地点' 
                        options={all_addrs.map(addr=>{ return {'key': addr.id, 'text': addr.name, 'value':addr.id}})}
                        onChange={(event,{value})=>{
                            const addrs = value.map(id=> addrManager.get(id))
                            this.selected_addrs = addrs
                            this.calcualteEventMark()
                        }}/>
                </div>
                <div style={{top: 0,  width: right_bar_width}}>
                    <div>人物:</div>
                    <input type='range' ref='person_p' max={10} min={0}  step={1} onChange={onRangeChange} defaultValue={person_p}/>
                    <Dropdown 
                        fluid multiple search selection 
                        placeholder='人物' 
                        options={all_people.map(person=>{ return {'key': person.id, 'text': person.name, 'value':person.id}})}
                        onChange={(event,{value})=>{
                            const people = value.map(id=> personManager.get(id))
                            this.selected_people = people
                            this.calcualteEventMark()
                        }}/>
                </div>
                <div style={{top: 0,  width: right_bar_width}}>
                    <div>事件类型:</div>
                    <input type='range' ref='trigger_p' max={10} min={0}  step={1} onChange={onRangeChange} defaultValue={trigger_p}/>
                    <Dropdown 
                        fluid multiple search selection 
                        placeholder='事件类型' 
                        options={all_triggers.map(trigger=>{ return {'key': trigger.id, 'text': trigger.name, 'value':trigger.id, 'object': trigger}})}
                        onChange={(event,{value})=>{
                            const triggers = value.map(id=> personManager.get(id))
                            this.selected_triggers = triggers
                            this.calcualteEventMark()
                        }}/>
                </div>
            </div> 

            {/* 显示其中的所有事件 375*/}
            <div style={{left: width-right_bar_width+20, width:right_bar_width, height:height-range_height-10, background:'white', top:375, overflowY:'scorll', overflowX:'hidden'}}>
                <Container fluid >
                {
                    show_table_events.map(event=>{
                        const text = event.toText()
                        return(
                            <Container key={'text_'+event.id} fluid text textAlign='justified'>
                                {text}
                                <Divider />
                            </Container>
                        )          
                    })
                }                      
                </Container>
            </div>
            <div style={{height:height, top:0}}>
                <XYPlot
                width={width-right_bar_width}
                height={height}
                onMouseLeave={event=> this.setState({hint_value:undefined})}>  

                    <Highlight
                        drag
                        style={{
                            '.rv-highlight':{
                                fill: 'white',
                                stroke: 'None'
                            },
                        }}
                        onBrushEnd={area => this.setState({highlighting: false,selected_area: area})}
                        onBrushStart={area => this.setState({highlighting: true})}
                    />
                    <MarkSeries
                        // animation
                        sizeRange={[2, 5]}
                        onValueClick={ value => {
                            console.log(value)
                            const event = eventManager.get(value.event_id)
                            this.setState({selected_event: event})
                        }}
                        // onValueMouseOver={value=> {
                        //     if(!hint_value || (hint_value.x!==value.x && hint_value.y!==value.y)){
                        //         this.setState({hint_value: value})
                        //     }
                        // }}
                        data={show_event_mark_data}
                        colorType= "literal"
                        opaceity={0.8}
                        style={{pointerEvents: highlighting ? 'none' : ''}}
                    />
                    <LineMarkSeries
                        data={uncertain_event_mark_data}
                        curve='curveMonotoneX'
                        color='red'
                        sizeRange={[1, 10]}
                        style={{
                            pointerEvents: highlighting ? 'none' : '',
                            lineerEvents: highlighting ? 'none' : ''
                        }}
                    />
                    {
                        hint_values[0] && 
                        hint_values.map(hint_value=>
                            <Hint 
                            value={hint_value}
                            key={hint_value.x + '_' + hint_value.y}>
                                <div style={{ fontSize: 8, padding: '10px', color:'white', background:'black'}}>
                                    {eventManager.get(hint_value.event_id).toText()}
                                </div>
                            </Hint>
                        )
                    }
                    {
                        hint_value &&
                        <Hint 
                        value={hint_value}
                        key={hint_value.x + '_' + hint_value.y}>
                            <div style={{ fontSize: 8, padding: '10px', color:'white', background:'black'}}>
                                {eventManager.get(hint_value.event_id).toText()}
                            </div>
                        </Hint>
                    }
                    {/* <XAxis/>
                    <YAxis/> */}
                </XYPlot>  
            </div>

        </div>
        )
    }
}

export default InferContour