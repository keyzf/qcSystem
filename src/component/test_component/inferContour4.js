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

// 3/5 对新的embedding方法做帮助
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
            uncertain_event_mark_data: [],
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
            let center_event = eventManager.get(event_id)
            let people = []
            if (!center_event) {
                people = stateManager.selected_people
            }else{
                people = center_event.getPeople()
            }
            console.log(people)
            net_work.require('getRelatedPeopleEvents', {person_ids:people.map(person=> person.id), depth:2})
            .then(data=>{
                let graph_data = dataStore.processResults(data.data)
                let {events} = graph_data
                this.events = dataStore.dict2array(events)
                console.log(events)
                if(!center_event){
                    center_event = people[0].events[0]
                }
                this.center_event = center_event
                this.calcualteEventMark()
            })
            // net_work.require('getAllRelatedEvents', {event_id:event_id, depth:3, trigger_num:50, event_num:2000})
            // .then(data=>{
            //     let graph_data = dataStore.processResults(data.data)
            //     let {events} = graph_data
            //     let center_event = eventManager.get(event_id)
            //     this.events = dataStore.dict2array(events)
            //     if (!this.events.includes(center_event)) {
            //         this.events.push(center_event)
            //     }
            //     this.center_event = center_event
            //     this.calcualteEventMark()
            // })
        }
    })

    calcualteEventMark = ()=>{
        let {events, center_event} = this
        if (!center_event) {
            console.log('center_event不存在')
            return
        }
        console.log('推断', center_event.toText())

        // let max_time = Math.max(...events.map(event=>{
        //     let time_range = event.time_range
        //     return time_range[1]
        // }).filter(year => isValidYear(year)))

        // let min_time = Math.min(...events.map(event=>{
        //     let time_range = event.time_range
        //     return time_range[0]
        // }).filter(year => isValidYear(year)))
        
        // prob表示的该点对应的可能性
        let index2prob = {}, index = 0, vecs = []
        events.forEach(event=>{
            // || event===center_event
            if (event.isTimeCertain()) {
                const vec = event.toVec()
                vecs.push(vec)
                index2prob[index] = {
                    event_id: event.id,
                    year: event.time_range[0],
                    addr_id: event.addrs.map(addr=> addr.id),  //这里之后要改呀
                    people_id: event.getPeople().map(person=> person.id),
                }
                index++
            }
        })

        const opt = {
            epsilon: 30,  // epsilon is learning rate (10 = default)
            perplexity: 10, // roughly how many neighbors each point influences (30 = default)
            dim: 2 // dimensionality of the embedding (2 = default)
        }
        let tsne = new tsnejs.tSNE(opt); // create a tSNE instance
        
        tsne.initDataRaw(vecs);  //这里用dist会出问题

        const refresh = ()=>{
            console.log('开始计算TSNE', vecs.length)
            for(var k = 0; k <100; k++) {
                tsne.step();
            }
            let new_vecs =  tsne.getSolution();
        
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
                const color = d3.rgb(30, 30, 30).brighter()
                // console.log(color, main_people_num, color.darker([main_people_num]), main_people)
                let point = {
                    x: x, 
                    y: y,
                    year: prob.year,
                    addr:prob.addr_id,
                    event_id: prob.event_id,
                    size: imp,
                    vec: vecs[index],
                    color: color.darker([main_people_num])
                }
                // if (event===center_event) {
                //     uncertain_event_mark_data.push(point)
                // }else{
                    
                // }
                event_mark_data.push(point)
            })

            // uncertain_event_mark_data = uncertain_event_mark_data.sort((a,b)=>a.year-b.year)
            this.setState({
                event_mark_data: event_mark_data,
                uncertain_event_mark_data: uncertain_event_mark_data
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
        let {event_mark_data, highlighting, selected_event, selected_area, uncertain_event_mark_data, hint_value} = this.state
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
            let temp_uncertain_event_mark_data = uncertain_event_mark_data.filter(mark_data=>is_in(mark_data, selected_area))
            if (temp_show_event_mark_data.length>1 || temp_uncertain_event_mark_data.length>1 || temp_hint_values.length>1) {
                show_event_mark_data = temp_show_event_mark_data
                uncertain_event_mark_data = temp_uncertain_event_mark_data
                hint_values = temp_hint_values
            }
        }
        
        const right_bar_width = 300, range_height = 90, range_left = 50
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
                        data={uncertain_event_mark_data}
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
                        onValueMouseOver={value=> this.setState({hint_value: value})}
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
                    <XAxis/>
                    <YAxis/>
                </XYPlot>  
            </div>

        </div>
        )
    }
}

export default InferContour