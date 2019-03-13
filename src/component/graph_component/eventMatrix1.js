import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import {WhiskerSeries, AreaSeries, LabelSeries, LineMarkSeries, DecorativeAxis, VerticalGridLines , HorizontalGridLines, XAxis, YAxis} from 'react-vis'
import React, { Component } from 'react'
import * as d3 from 'd3'
import { max } from 'C:/Users/Tan Siwei/AppData/Local/Microsoft/TypeScript/3.2/node_modules/moment/moment.js';
import data from "../../data/temp_data/1762.json";
import jsonFormat from 'json-format'

import eventManager, { addrManager } from '../../dataManager/dataStore2'
import net_work from '../../dataManager/netWork'
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import dataStore, { personManager, isValidYear } from '../../dataManager/dataStore2'

class EventMatrix extends Component {
    constructor(){
        super()
        // console.log(data)
        this.state = {
            matrix_graph_datas: [],
            hint_value: undefined
        }
    }

    _changeSelectedEevnt = autorun(()=>{
        let event_id = stateManager.selected_event_id.get()
        if (stateManager.is_ready) {
            console.log('_changeSelectedEevnt')
            net_work.require('getRelatedEvents', {event_id:event_id})
            .then(data=>{
                console.log(data)
                let graph_data = dataStore.processResults(data.data)
                let {events, addrs, people} = graph_data
                // console.log(events, addrs, people)
                let config = {
                    start_x: 0, 
                    start_y: 0,
                    height: 25,
                    width: 25,
                    center_padding: 0.5, 
                    time_len: 5, 
                    addr_len: 20, 
                    person_len_x: 10, 
                    person_len_y: 5,
                }
                let m = initMatrix(events[data.center_event], graph_data, config)

                let {matrix_graph_datas} = this.state
                let index = matrix_graph_datas.findIndex(elm=>elm.matrix_id===m.id)
                if( index===-1 )
                    matrix_graph_datas.splice(index,1)
                matrix_graph_datas.push(m)
                this.setState({matrix_graph_datas: matrix_graph_datas})
            })
        }
    })
    

    renderMatrixGraph = main_matrix=> main_matrix.map(data=>{
        let {event_mark_datas, event_line_datas, matrix_lines, matrix_texts, matrix_id} = data
        var handle_mark_click = value =>{
            console.log(value)
            this.setState({hint_value: value})
        }
        return [
            // matrix_lines.map((data,index)=> 
            //     <LineSeriesCanvas
            //     data={data}
            //     key={matrix_id+'格子线'+index}
            //     color='#e0dfdf'
            //     opacity={0.5}/>                    
            // ),
            event_line_datas.map((data,index)=>
                <LineSeries
                data={data}
                key={matrix_id+'事件范围线'+index}
                strokeWidth = {1}
                onSeriesClick = {event => this.setState({hint_value: data[0]})}
                color='gray'/>  
            ),
            event_mark_datas.map((elm,index)=>
                <MarkSeries
                sizeRange={[1, 2]}
                // size={1}
                key = {matrix_id+'矩阵事件点_'+index}
                data={elm[0]}
                onValueClick={handle_mark_click} 
                color={elm[1]}/>

            ),
            <LabelSeries
                allowOffsetToBeReversed
                labelAnchorX ='middle'
                labelAnchorY = 'middle'
                rotation = {45}
                data={matrix_texts} />
        ]

    })

    render(){
        console.log('render 矩阵推理试图')
        let {matrix_graph_datas, hint_value} = this.state
        let show_events = hint_value&&hint_value.events.sort((a,b)=> a.time_range[0]-b.time_range[0])
        console.log(hint_value)

        return (
            <XYPlot
            width={this.props.width||1100}
            height={this.props.height||800}
            onMouseLeave={event=> this.setState({hint_value: undefined})}
            >
                {this.renderMatrixGraph(matrix_graph_datas)}
                {
                show_events &&          
                <Hint value={hint_value}>
                    <div style={{ fontSize: 10,background: 'black', padding: '10px', opacity: '0.5', width: 500}}>
                    {
                        show_events.map((show_event,index)=>
                            <div key={index+'show_event_event_matrix'}>
                                <span>{jsonFormat(show_event.toDict())}</span>  
                            </div>                               
                        )
                    }
                    </div>
                </Hint>
                }
            </XYPlot>
        )
    }

}


let isValidRange = time_range=>{
    return time_range[0]!==-9999 && time_range[1]!==9999
}


function initMatrix(center_event, data, config){
    let {events, addrs, people, triggers} = data
    let {start_x, start_y, center_padding, time_len, addr_len, person_len_x, person_len_y, width, height} = config

    let total_time_range = [9999,-9999]

    // 改为时间不连续
    let year_array = new Set()
    // console.log(events)
    for(let event_id in events){
        let event = events[event_id]
        let time_range = event.time_range
        year_array.add(time_range[0])
        year_array.add(time_range[1])
        if (isValidRange(time_range)) {
            if (time_range[0]<total_time_range[0]) 
                total_time_range[0] = time_range[0]
            if (time_range[1]>total_time_range[1])
                total_time_range[1] = time_range[1]
        }
    }
    if (year_array.length===0) {
        console.warn('啥时间都没有，没得救了')
        return {
            event_mark_datas: [],
            event_line_datas:  [],
            matrix_lines: [],
            matrix_texts: [],
            matrix_id: '没得救了的矩阵'
        }
    }
    year_array = [...year_array].sort((a,b)=>a-b)

    // console.log(year_array)

    // 给人物分配一个新的id
    let person2matrix_id = {}
    let addr2matrix_id = {}

    // 暂用于分配一个新的id
    let person_array = dataStore.dict2array(people)
    person_array = person_array.sort((a,b)=> a.id-b.id)
    person_array.forEach((person,index)=>{
        person2matrix_id[person.id] = index
    })

    let addr_array = dataStore.dict2array(addrs)
    addr_array = addr_array.sort((a,b)=> a.id-b.id)
    if (addr_array.length===0) {
        addr_array = [addrManager.get('2809')]
        addrs = {
            '2809': addrManager.get('2809')
        }
    }
    addr_array.forEach((addr,index)=>{
        addr2matrix_id[addr.id] = index
    })

    // console.log(person_array, people)

    let time_unit, addr_unit, person_unit_x,person_unit_y
    time_unit = person_unit_y = height/(year_array.length+person_array.length)
    person_unit_x = addr_unit = width/(addr_array.length+person_array.length)

    // //注意之后还要加上正负映射
    let timeScale = year => {
        let index = year_array.findIndex(elm=>elm==year)
        index===-1 && console.warn(year, '没有找到')
        return center_padding + index*time_unit + time_unit/2 + start_y
    }

    // 写的很蠢懒得改了
    let personScaleX = person => {
        if (person2matrix_id[person.id] || person2matrix_id[person.id]===0) {
            return -(person2matrix_id[person.id]*person_unit_x + person_unit_x/2 + center_padding)  + start_x
        }else{
            return null
        }
    }

    let personScaleY = person => {
        if (person2matrix_id[person.id] || person2matrix_id[person.id]===0) {
            return -(person2matrix_id[person.id]*person_unit_y + person_unit_y/2 + center_padding)  + start_y
        }else{
            return null
        }
    }

    let addrScale = addr => addr2matrix_id[addr.id]*addr_unit + addr_unit/2 + center_padding + start_x

    let event_mark_datas = []
    let event_line_datas = []
    for(let event_id in events){
        let event = events[event_id]
        
        let event_mark_data = []
        // console.log(event_addr)
        let event_addrs = event.addrs
        let event_persons = event.roles.map(elm=> elm['person'])
        let event_time_ranges = event.time_range

        // +y: 时间, -x,-y: 人, +x 地点
        // 画点
        // eslint-disable-next-line no-loop-func
        event_persons.forEach(person=>{
            // !(event_time_ranges[1]===9999 && event_time_ranges[0]===-9999)
            // 人 X 时间 
            if ( event_time_ranges[0]===event_time_ranges[1] && event_time_ranges[0]!==-9999) {
                let mark_year = event_time_ranges[0]
                // console.log(timeScale(mark_year))
                if (mark_year>total_time_range[0] && mark_year<total_time_range[1]) {
                    let new_point = {
                        x: personScaleX(person),
                        y: timeScale(mark_year),
                        opacity: 0.8,
                        quadrant: '时间-人',
                        events: [event],
                        size: 1
                    }
                    event_mark_data.push(new_point)                        
                }
            }else{
                let start_year = event_time_ranges[0]>total_time_range[0]? event_time_ranges[0] : total_time_range[0]
                let end_year = event_time_ranges[1]<total_time_range[1]? event_time_ranges[1] : total_time_range[1]
                let x = personScaleX(person)-person_unit_x/2*(Math.random()-0.5)
                if(start_year<total_time_range[1] && end_year>total_time_range[0] &&  personScaleX(person)){
                    let event_line_data = [
                        {
                            x: x,
                            y: timeScale(start_year),
                            opacity: 0.8,
                            quadrant: '时间-人',
                            events: [event],
                            size: 1
                        },
                        {
                            x: x,
                            y: timeScale(end_year),
                            opacity: 0.8,
                            quadrant: '时间-人',
                            events: [event],
                            size: 1
                        }
                    ]
                    event_line_datas.push(event_line_data)                    
                }
            }
            
            // 人 X 地点
            event_addrs.forEach(addr=>{
                let new_point = {
                    x: addrScale(addr),
                    y: personScaleY(person),
                    opacity: 0.8,
                    quadrant: '地点-人',
                    events: [event],
                    size: 1
                }
                event_mark_data.push(new_point)
            })

            // 人 X 人
            event_persons.forEach(person2=>{
                if (person2===person && event_persons.length>1) {
                    return
                }
                let new_point = {
                    x: personScaleX(person),
                    y: personScaleY(person2),
                    opacity: 0.8,
                    quadrant: '人-人',
                    events: [event],
                    size: 1
                }
                event_mark_data.push(new_point)
            })
        })
        // 地点X时间
        if (event_time_ranges[0]===event_time_ranges[1]) {
            let mark_year = event_time_ranges[0]
            event_addrs.forEach(addr=>{
                let new_point = {
                    x: addrScale(addr)+start_x,
                    y: timeScale(mark_year)+start_y,
                    opacity: 0.8,
                    quadrant: '地点-时间',
                    events: [event],
                    size: 1
                }
                event_mark_data.push(new_point)                          
            })
        }else{
            let start_year = event_time_ranges[0]
            let end_year = event_time_ranges[1]
            event_addrs.forEach(addr=>{
                // 为了方便看清设了个值以后要改
                let x = addrScale(addr)-addr_unit/2*(Math.random()-0.5)
                if(start_year<total_time_range[1] && end_year>total_time_range[0] && x){
                    let event_line_data = [
                        {
                            x: x,
                            y: timeScale(start_year),
                            opacity: 0.8,
                            quadrant: '时间-人',
                            events: [event],
                            size: 1
                        },
                        {
                            x: x,
                            y: timeScale(end_year),
                            opacity: 0.8,
                            quadrant: '时间-人',
                            events: [event],
                            size: 1
                        }
                    ]
                    event_line_datas.push(event_line_data)                 
                }                
            })
        }

        let color = 'gray'
        if (event===center_event)
            color = '#cd3b54'

        // console.log(event_mark_data.filter(elm => !(!isNaN(elm.x) && !isNaN(elm.y) && elm.x!==null && elm.y!==null)))
        // event_mark_data = event_mark_data.filter(elm => !isNaN(elm.x) && !isNaN(elm.y) && elm.x!==null && elm.y!==null)
        event_mark_datas.push([event_mark_data, color])
    }
    event_mark_datas = event_mark_datas.filter(data=> data[0].length>0)


    // 重叠的点需要合并
    let mark_dict = {}
    // let personal_mark_dict = {}
    let new_attr_mark_datas = []
    for(let index in event_mark_datas){
        let attr_mark_data = event_mark_datas[index][0]
        let color = event_mark_datas[index][1]
        attr_mark_data = attr_mark_data.filter(elm=>{
            let x = elm.x
            let y = elm.y
            if(!mark_dict[x]){
                mark_dict[x] = {}
                mark_dict[x][y] = elm
                return true
            }else if(!mark_dict[x][y]){
                mark_dict[x][y] = elm
                return true
            }else{
                mark_dict[x][y].size++
                mark_dict[x][y].events =  [...mark_dict[x][y].events,...elm.events]
                // 颜色是个问题
                // if()
                return false
            }
        })
        new_attr_mark_datas.push([attr_mark_data, color])
    }
    event_mark_datas = new_attr_mark_datas
    event_mark_datas = event_mark_datas.filter(data=> data[0].length>0)

    // 为之后连线做准备
    let event2marks = {}
    event_mark_datas.forEach(attr_mark_data=>{
        attr_mark_data[0].forEach(mark_data=>{
            let events = mark_data.events
            events.forEach(event=>{
                let id = event.id
                event2marks[id] = event2marks[id] || []
                event2marks[id].push(mark_data)
            })
        })
    })
    // console.log(event2marks)
    // 画格子线
    let matrix_lines = []
    // eslint-disable-next-line no-lone-blocks
    {
        person_array.forEach((person, index)=>{
            let x = personScaleX(person)-person_unit_x/2
            // 二象限竖
            let line_data = [
                {
                    x: x,
                    y: timeScale(total_time_range[0])-time_unit/2
                },
                {
                    x: x,
                    y: timeScale(total_time_range[1])+time_unit/2
                }
            ]
            matrix_lines.push(line_data)
            // 三象限竖
            line_data = [
                {
                    x: x,
                    y: personScaleY(person_array[0])+person_unit_y/2
                },
                {
                    x: x,
                    y: personScaleY(person_array[person_array.length-1])-person_unit_y/2
                }
            ]
            matrix_lines.push(line_data) 

            let y = personScaleY(person)-person_unit_y/2
            //三象限横
            line_data = [
                {
                    x: personScaleX(person_array[0])+person_unit_x/2,
                    y: y
                },
                {
                    x: personScaleX(person_array[person_array.length-1])-person_unit_x/2,
                    y: y
                }
            ]
            matrix_lines.push(line_data)

            // 人物平行于Y轴
            //四象限横
            line_data = [
                {
                    x: addrScale(addr_array[0])-addr_unit/2,
                    y: y
                },
                {
                    x: addrScale(addr_array[addr_array.length-1])+addr_unit/2,
                    y: y
                }
            ]
            matrix_lines.push(line_data)
        })

        // 时间平行于x轴
        year_array.forEach( year=> {
            let y = timeScale(year)-time_unit/2
            // 一现象限横
            let line_data = [
                {
                    x: addrScale(addr_array[0])-addr_unit/2,    
                    y: y
                },
                {
                    x: addrScale(addr_array[addr_array.length-1])+addr_unit/2,
                    y: y
                }
            ]
            matrix_lines.push(line_data)

            // 二现象限横
            line_data = [
                {
                    x: personScaleX(person_array[0])+person_unit_x/2,
                    y: y
                },
                {
                    x: personScaleX(person_array[person_array.length-1])-person_unit_x/2,
                    y: y
                }
            ]
            matrix_lines.push(line_data) 
        })

        addr_array.forEach((addr, index)=>{
            let x = addrScale(addr)+addr_unit/2
            // // 一现象限竖
            let line_data = [
                {
                    x: x,    
                    y: timeScale(total_time_range[0])-time_unit/2
                },
                {
                    x: x,
                    y: timeScale(total_time_range[1])+time_unit/2
                }
            ]
            matrix_lines.push(line_data)

            // // 四现象限竖
            line_data = [
                {
                    x: x,
                    y: personScaleY(person_array[0])+person_unit_y/2
                },
                {
                    x:x,
                    y: personScaleY(person_array[person_array.length-1])-person_unit_y/2
                }
            ]
            matrix_lines.push(line_data)
        })        
    }

    // 封边
    {
        let x = personScaleX(person_array[0])+person_unit_x/2
        let line_data = [
            {
                x: x,
                y: timeScale(total_time_range[0])-time_unit/2
            },
            {
                x: x,
                y: timeScale(total_time_range[1])+time_unit/2
            }
        ]  
        matrix_lines.push(line_data)

        line_data = [
            {
                x: x,
                y: personScaleY(person_array[0])+person_unit_y/2
            },
            {
                x: x,
                y: personScaleY(person_array[person_array.length-1])-person_unit_y/2
            }
        ] 
        matrix_lines.push(line_data)

        x = addrScale(addr_array[0])-addr_unit/2
        line_data = [
            {
                x: x,
                y: timeScale(total_time_range[0])-time_unit/2
            },
            {
                x: x,
                y: timeScale(total_time_range[1])+time_unit/2
            }
        ]  
        matrix_lines.push(line_data)

        line_data = [
            {
                x: x,
                y: personScaleY(person_array[0])+person_unit_y/2
            },
            {
                x: x,
                y: personScaleY(person_array[person_array.length-1])-person_unit_y/2
            }
        ] 
        matrix_lines.push(line_data)

        let y = personScaleY(person_array[0])+person_unit_y/2
        line_data = [
            {
                x: personScaleX(person_array[0])+person_unit_x/2,
                y: y
            },
            {
                x: personScaleX(person_array[person_array.length-1])-person_unit_x/2,
                y: y
            }
        ]  
        matrix_lines.push(line_data)

        line_data = [
            {
                x: addrScale(addr_array[0])-addr_unit/2,
                y: y
            },
            {
                x: addrScale(addr_array[addr_array.length-1])+addr_unit/2,
                y: y
            }
        ]  
        matrix_lines.push(line_data)
    }


    // console.log(matrix_lines)

    // 添加字
    let matrix_texts = []
    // eslint-disable-next-line no-lone-blocks
    {
        
        for(let person_index in person_array){
            let person = person_array[person_index]

            // 人平行于X轴
            let x = personScaleX(person)
            matrix_texts.push({
                x: x,
                y: start_y,
                label: person.name + '(' + person.id + ')'
            })
            // 人物平行于Y轴
            let y = personScaleY(person)
            matrix_texts.push({
                x: start_x,
                y: y,
                label: person.name
            })
        }
        // 时间平行于y轴
        year_array.forEach(year=> {
            let y = timeScale(year)
            matrix_texts.push({
                x: start_x,
                y: y,
                label: year.toString()
            })
        })

        // 地点平行于x轴
        for(let addr_id in addrs){
            let addr = addrs[addr_id]
            let x = addrScale(addr)
            matrix_texts.push({
                x: x,
                y: start_y,
                label: addr.name
            })
        }
        matrix_texts = matrix_texts.map(text=> {
            text.style={fontSize: 6}
            return text
        })

    }

    return {
        event_mark_datas:event_mark_datas,
        event_line_datas: event_line_datas,
        matrix_lines: matrix_lines,
        matrix_texts: matrix_texts,
        matrix_id: center_event.id
    }
}

export default EventMatrix