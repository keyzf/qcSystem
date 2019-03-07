// 用于绘制力图

import React from 'react';
import PropTypes from 'prop-types';

import {XYPlot,ContourSeries, YAxis, LineMarkSeries, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint, XAxis, Highlight} from 'react-vis';
import * as d3 from 'd3'
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import net_work from '../../dataManager/netWork'
import dataStore, { eventManager, addrManager, personManager, isValidYear } from '../../dataManager/dataStore2'
import tsnejs from '../../dataManager/tsne'
import { Divider, Container, Header, Table} from 'semantic-ui-react'
import cos_dist from 'compute-cosine-distance'


class InferContour extends React.Component {
    events = []
    center_event = undefined  //目前正在推的事件

    constructor(){
        super()
        this.state = {
            event_mark_data: [],
            event_link_datas: [],  //同类事件连起来
            hint_value: undefined,
            selected_event : undefined,
            selected_area : undefined,
            uncertain_event_line: [],
            time_p: 0.5,
            addr_p: 0.5,
            person_p: 0.5,
            trigger_p: 0.5,
            highlighting: false
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
            net_work.require('getAllRelatedEvents', {event_id:event_id, depth:3, trigger_num:50, event_num:2000})
            .then(data=>{
                console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events, addrs, people} = graph_data
                let center_event = eventManager.get(event_id)
                // console.log()
                this.events = dataStore.dict2array(events)
                if (!this.events.includes(center_event)) {
                    this.events.push(center_event)
                }
                this.center_event = center_event
                this.calcualteEventMark()
            })
            // net_work.require('getRelatedEvents', {event_id:event_id})
            // .then(data=>{
            //     console.log(data)
            //     let graph_data = dataStore.processResults(data.data)
            //     let {events, addrs, people} = graph_data
            //     let center_event = eventManager.get(event_id)
            //     this.calcualteEventMark(events, center_event)
            //     // console.log(events)
            // })
        }
    })

    calcualteEventMark = ()=>{
        let {events, center_event} = this
        let {trigger_p, addr_p, time_p, person_p} = this.state

        console.log('推断', center_event.toText())
        let event2vec = {}
        const DIM = 20

        let max_time = Math.max(...events.map(event=>{
            let time_range = event.time_range
            return time_range[1]
        }).filter(year => isValidYear(year)))

        let min_time = Math.min(...events.map(event=>{
            let time_range = event.time_range
            return time_range[0]
        }).filter(year => isValidYear(year)))
        // console.log(max_time, min_time)

        events.forEach(event=>{
            if (event.isTimeCertain() || event===center_event) {
                let vec_dicts = event.toVecs(min_time, max_time)
                // console.log(vec_dicts)
                // if (!event.isTimeCertain()) {
                //     console.log(vec_dicts.length)
                // }
                event2vec[event.id] = vec_dicts.map(elm=>{
                    let {time_vec, person_vec1, trigger_vec1, person_vec2, trigger_vec2, addr_vec, addr, year} = elm
                    // console.log(time_vec, person_vec1, trigger_vec1, person_vec2, trigger_vec2, addr_vec, addr, year)
                    return {
                        vec: [
                            ...time_vec.map(value=> (value-min_time)/(max_time-min_time) *time_p),
                            ...person_vec1.map(value=> value*person_p), 
                            ...trigger_vec1.map(value=> value*trigger_p), 
                            ...person_vec2.map(value=> value*person_p), 
                            ...trigger_vec2.map(value=> value*trigger_p), 
                            ...addr_vec.map(value=> value*addr_p)
                        ],
                        year: year,
                        addr: addr,
                        event: event
                    }
                })
                // if (event===center_event) {
                //     console.log(vec_dicts)
                // }
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

        const opt = {
            epsilon: 30,  // epsilon is learning rate (10 = default)
            perplexity: 10, // roughly how many neighbors each point influences (30 = default)
            dim: 2 // dimensionality of the embedding (2 = default)
        }
        let tsne = new tsnejs.tSNE(opt); // create a tSNE instance
        
        tsne.initDataRaw(vecs);  //这里用dist会出问题

        let refresh = ()=>{
            console.log('开始计算TSNE', vecs.length)
            for(var k = 0; k <100; k++) {
                tsne.step();
            }
            let new_vecs =  tsne.getSolution();
        
            // console.log(vecs, new_vecs)
            let event_mark_data = [], uncertain_event_line= []
            let main_people = center_event.roles.map(elm=> elm.person)
            new_vecs.forEach((vec,index)=>{
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
                const color = d3.rgb(30, 30, 30).brighter()
                // console.log(color, main_people_num, color.darker([main_people_num]), main_people)
                let point = {
                    x: x, 
                    y: y,
                    year: vec.year,
                    addr:vec.addr,
                    event_id: event.id,
                    size: imp,
                    vec: vecs[index],
                    color: color.darker([main_people_num])
                }
                if (event===center_event) {
                    uncertain_event_line.push(point)
                }else{
                    event_mark_data.push(point)
                }
            })

            uncertain_event_line = uncertain_event_line.sort((a,b)=>a.year-b.year)
            this.setState({
                event_mark_data: event_mark_data,
                uncertain_event_line: uncertain_event_line
            })
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
        let {event_mark_data, highlighting, selected_event, selected_area, uncertain_event_line} = this.state
        let {trigger_p, addr_p, time_p, person_p} = this.state
        const {center_event} = this

        // console.log(event_mark_data)
        // let sim_addr_links = [], sim_year_links = [], sim_person_links = []
        let show_event_mark_data = [] 
        let hint_values = []
        if (selected_event) {
            event_mark_data = event_mark_data.map(data=>{
                let temp_data = {}
                for(let key in data){
                    temp_data[key] = data[key]
                }
                if (data.event_id===selected_event.id) {
                    temp_data.color = 'red'
                    temp_data.size = temp_data.size+2
                    hint_values.push(temp_data)
                }
                return temp_data
            })

            show_event_mark_data = this.findSimilaerEvents(event_mark_data, 20)
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
            let temp_uncertain_event_line = uncertain_event_line.filter(mark_data=>is_in(mark_data, selected_area))
            if (temp_show_event_mark_data.length>1 || temp_uncertain_event_line.length>1 || temp_hint_values.length>1) {
                show_event_mark_data = temp_show_event_mark_data
                uncertain_event_line = temp_uncertain_event_line
                hint_values = temp_hint_values
            }
        }
        
        const right_bar_width = 300, range_height = 90, range_left = 50
        const onRangeChange = event=>{
            let time_p = this.refs.time_p.value
            let addr_p = this.refs.addr_p.value
            let person_p = this.refs.person_p.value
            let trigger_p = this.refs.trigger_p.value
            this.setState({time_p: time_p, addr_p:addr_p, person_p:person_p, trigger_p:trigger_p})
            this.state.time_p = this.refs.time_p.value
            this.state.addr_p = this.refs.addr_p.value
            this.state.person_p = this.refs.person_p.value
            this.state.trigger_p = this.refs.trigger_p.value
            this.calcualteEventMark()
        }
        const handleRowChange = ()=>{
            console.log(this)
        }

        let show_table_events = show_event_mark_data.map(elm=> eventManager.get(elm.event_id))
        show_table_events = [...new Set(show_table_events)]

        return(
        <div className='InferContour' style={{width:width, height:height}} 
            onMouseLeave={
                ()=>this.setState(
                    {hint_value:undefined, selected_event:undefined, selected_area: undefined}
                )}>
            {/* 调节权重 */}
            <div style={{
                left: width-right_bar_width+20, 
                width:right_bar_width, 
                height: range_height, 
                background:'white', 
                top:0, 
                position:'absolute'}}>
                {center_event && center_event.toText()}
            </div>
            <div style={{
                left: width-right_bar_width+20, 
                width:right_bar_width, 
                height: range_height, 
                background:'white', 
                top:30, 
                position:'absolute'}}>
                <input type='range' ref='time_p' max={1} min={0}  step={0.1} onChange={onRangeChange} value={time_p} style={{top: 0, left:range_left, position:'absolute'}}/>
                <input type='range' ref='addr_p' max={1} min={0} step={0.1} onChange={onRangeChange} value={addr_p} style={{top: range_height/4, left:range_left, position:'absolute'}}/>
                <input type='range' ref='person_p' max={1} min={0} step={0.1} onChange={onRangeChange} value={person_p} style={{top: range_height/4*2, left:range_left, position:'absolute'}}/>
                <input type='range' ref='trigger_p' max={1} min={0} step={0.1} onChange={onRangeChange} value={trigger_p} style={{top: range_height/4*3, left:range_left, position:'absolute'}}/>
            </div>
            {/* 显示其中的所有事件 */}
            <div style={{
                left: width-right_bar_width+20, 
                width:right_bar_width, 
                height:height-range_height-10, 
                background:'white', 
                top:10+range_height, 
                position:'absolute', 
                overflowY:'scroll'}}>
                <Container fluid >
                    <Table celled size='small' striped compact singleLine collapsing sortable selectable>
                    <Table.Header>
                        <Table.Row>
                        <Table.HeaderCell width={3}>起始年份</Table.HeaderCell>
                        <Table.HeaderCell width={3}>结束年份</Table.HeaderCell>
                        <Table.HeaderCell width={3}>事件类型</Table.HeaderCell>
                        <Table.HeaderCell width={5}>人物/角色</Table.HeaderCell>
                        <Table.HeaderCell width={3}>地点</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {
                        show_table_events.map(event=>{
                            // const event = eventManager.get(data.event_id)
                            // const text = event.toText()
                            return(
                                <Table.Row key={'table_row' + event.id} onClick={()=> this.setState({selected_event: event, hint_value:undefined})}>
                                    <Table.Cell>{event.time_range[0]}</Table.Cell>
                                    <Table.Cell>{event.time_range[1]}</Table.Cell>
                                    <Table.Cell>{event.trigger.name}</Table.Cell>
                                    <Table.Cell singleLine>
                                        {
                                            event.roles.map(elm=>{
                                                return elm.person.name + '/' + elm.role
                                            }).join(' ')
                                        }
                                    </Table.Cell>
                                    <Table.Cell>{event.addrs.map(addr=>addr.name).join(',')}</Table.Cell>
                                </Table.Row>
                            ) 
                        })
                        }
                    </Table.Body>
                    </Table>                        
                </Container>
            </div>
            <div style={{height:height, top:0, position:'absolute'}}>
                <XYPlot
                width={width-right_bar_width}
                height={height}
                onMouseLeave={event=> this.setState({hint_value:undefined})}>  

                    <Highlight
                        onBrushEnd={area => this.setState({highlighting: false,selected_area: area})}
                        onBrushStart={area => this.setState({highlighting: true})}
                    />
                    <LineMarkSeries
                        data={uncertain_event_line}
                        curve='curveMonotoneX'
                        color='#dcdcf1'
                        style={{
                            pointerEvents: highlighting ? 'none' : '',
                            lineerEvents: highlighting ? 'none' : ''
                        }}
                    />
                    <MarkSeries
                        animation
                        sizeRange={[2, 5]}
                        onValueClick={ value => {
                            // console.log(hint_value)
                            const event = eventManager.get(value.event_id)
                            this.setState({selected_event: event})
                        }}
                        data={show_event_mark_data}
                        colorType= "literal"
                        opaceity={0.8}
                        style={{pointerEvents: highlighting ? 'none' : ''}}
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

                    <XAxis/>
                    <YAxis/>
                </XYPlot>  
            </div>

        </div>
        )
    }
}

export default InferContour