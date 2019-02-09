import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import {WhiskerSeries, AreaSeries, LabelSeries, LineMarkSeries, DecorativeAxis, VerticalGridLines , HorizontalGridLines, XAxis, YAxis} from 'react-vis'
import React, { Component } from 'react'
import * as d3 from 'd3'
import { max } from 'C:/Users/Tan Siwei/AppData/Local/Microsoft/TypeScript/3.2/node_modules/moment/moment.js';
import data from "../../data/temp_data/1762.json";
import jsonFormat from 'json-format'


class EventMatrix extends Component {
    constructor(){
        super()
        // console.log(data)
        this.state = {
            main_matrix: [],
            time_len: 5,
            addr_len: 20,
            center_padding: 0.5,
            person_len_y: 5,
            person_len_x: 10,
        }
    }

    
    componentWillMount(){
        let center_padding = this.state.center_padding
        let time_len = this.state.time_len,
            addr_len = this.state.addr_len,
            person_len_x = this.state.person_len_x,
            person_len_y = this.state.person_len_y  

        let start_x= 0, start_y = 0
            //矩阵宽高 , [1083,1156]
        let m1 = initOneMatrix('1762', data, start_x, start_y, center_padding, time_len, addr_len, person_len_x, person_len_y)

        this.setState({
            main_matrixs: [
                m1
            ]
        })
    }
    render(){
        let center_padding = this.state.center_padding
        let time_len = this.state.time_len,addr_len = this.state.addr_len,person_len = this.state.person_len  //矩阵高度

        let main_matrix = this.state.main_matrixs[0]

        let event_mark_datas = main_matrix.event_mark_datas || []
        let event_line_datas = main_matrix.event_line_datas || []

        let person2matrix_id = main_matrix.person2matrix_id
        let addr2matrix_id = main_matrix.addr2matrix_id
        let time_range = main_matrix.time_range
        let matrix_lines = main_matrix.matrix_lines
        let matrix_texts = main_matrix.matrix_texts
        let persons = main_matrix.persons
        let addrs = main_matrix.addrs
        let event2marks = main_matrix.event2marks

        let hint_value = this.state.hint_value
        let show_events = hint_value&&hint_value.events.sort((a,b)=> a.time_range[0]-b.time_range[0])
        let need_link_marks = []
        if (show_events) {
            show_events.forEach(event=>{
                let marks = event2marks[event.id]
                need_link_marks.push(marks)
                // marks.forEach(mark=>{
                //     need_link_marks.push([hint_value, mark])
                // })
            })
        }

        
        // console.log(hint_value, show_events, need_link_marks)
        // console.log(event_line_datas)
        // console.log(matrix_lines, matrix_texts, attr_mark_datas)
        return (
        <XYPlot
        width={this.props.width||1100}
        height={this.props.height||800}
        // yDomain={[(-center_padding-person_len)*1.1,(center_padding+time_len)*1.1]}
        // xDomain={[(-center_padding-person_len)*1.1,(center_padding+addr_len)*1.1]}
        onMouseLeave={()=> this.setState({hint_value:undefined})}
        >
            {
                matrix_lines.map((data,index)=> 
                    <LineSeriesCanvas
                    data={data}
                    key={'格子线'+index}
                    color='#e0dfdf'
                    opacity={0.5}/>                    
                )
            }
            {
                event_line_datas.map((data,index)=>
                    <LineSeries
                    data={data}
                    key={'事件范围线'+index}
                    strokeWidth = {0.2}
                    onSeriesClick = { (event)=> this.setState({hint_value:data[0]}) }
                    color='gray'/>  
                )
            }
            {
                event_mark_datas.map((elm,index)=>
                    <MarkSeries
                    className="mark-series-example"
                    sizeRange={[1, 5]}
                    // size={1}
                    key = {'矩阵事件点_'+index}
                    data={elm[0]}
                    onValueClick={value=> this.setState({hint_value:value})} 
                    color={elm[1]}/>

                )
            }

            <LabelSeries
                animation
                allowOffsetToBeReversed
                labelAnchorX ='middle'
                labelAnchorY = 'middle'
                rotation = {45}
                data={matrix_texts} />
            {
            show_events &&          
            <Hint value={hint_value}>
                <div style={{ fontSize: 10,background: 'black', padding: '10px', opacity: '0.5', width: 500}}>
                    {
                        show_events.map((show_event,index)=>
                                <div key={index+'show_event_event_matrix'}>
                                    <p>year:{show_event.time_range.toString()}</p>
                                    <span>{jsonFormat(show_event)}</span>
                                    {
                                        show_event.roles.map((elm,index)=>{
                                            return <p key={'hint'+index}>{persons[elm.person].name + ' ' + elm.role}</p>
                                        })
                                    }    
                                </div>                               
                        )
                    }

                    {/* <p>{myValue.x}</p> */}
                </div>
            </Hint>
            }
            {
                show_events && need_link_marks.map((data,index)=>
                    <MarkSeries
                    data={data}
                    key={'事件间连线'+index}
                    // color='#e0dfdf'
                    sizeRange={[5, 10]}
                    opacity={0.5}
                    animation = {false}/>  
                )
            }
            {/* <YAxis/>
            <XAxis/> */}
        </XYPlot>
        )
    }

}






let isValidRange = time_range=>{
    return time_range[0]!==-9999 && time_range[1]!==9999
}

function initOneMatrix(selected_person_id, data, start_x, start_y, center_padding, time_len, addr_len, person_len_x, person_len_y, temp_time_range=undefined){
    let persons = data.persons,
        events = data.events,
        addrs = data.addr,
        triggers = data.triggers

    let total_time_range = [9999,-9999]

    for(let event_id in events){
        let event = events[event_id]
        event.trigger = triggers[event.trigger]
        let time_range = event.time_range
        if (isValidRange(time_range)) {
            if (time_range[0]<total_time_range[0]) 
                total_time_range[0] = time_range[0]
            if (time_range[1]>total_time_range[1])
                total_time_range[1] = time_range[1]
        }
    }
    if (total_time_range[0]===9999 && total_time_range[1]===-9999) {
        console.log('啥时间都没有，没得救了')
        return
    }

    if (temp_time_range) {
        total_time_range = temp_time_range
    }
    total_time_range = [1069,1080]   //暂用于给李清照强行赋值
    // console.log(total_time_range)


    // 给人物分配一个新的id
    let person2matrix_id = {}
    let addr2matrix_id = {}

    // 暂用于分配一个新的id
    let person_array = new Set()
    // for(let person_id in persons){
    //     person_array.add(persons[person_id])
    // }
    for(let event_id in events){
        let event = events[event_id]
        let roles = event.roles
        let is_in = false
        for(let index in roles){
            let elm = roles[index]
            // console.log(elm)
            if(elm.person===selected_person_id){
                is_in = true
            }
        }
        if (is_in) {
            for(let index in roles){
                let elm = roles[index]
                person_array.add(persons[elm.person])
            }
        }
    }
    person_array = [...person_array]
    
    // person_array = person_array.slice(0,10)

    person_array = person_array.sort((a,b)=> a.id-b.id)
    person_array.forEach((person,index)=>{
        person2matrix_id[person.id] = index
    })

    let addr_array = []
    for(let addr_id in addrs){
        addr_array.push(addrs[addr_id])
    }
    addr_array = addr_array.sort((a,b)=> a.id-b.id)
    addr_array.forEach((addr,index)=>{
        addr2matrix_id[addr.id] = index
    })

    let time_unit = time_len/(total_time_range[1]-total_time_range[0]),
        addr_unit = addr_len/addr_array.length,
        person_unit_x = person_len_x/person_array.length,
        person_unit_y = person_len_y/person_array.length

    // console.log(addr_unit, person_unit, addr2graph_id, person2graph_id)
    //注意之后还要加上正负映射
    let timeScale = d3.scaleLinear()
                    .domain(total_time_range)
                    .range([
                        center_padding+time_unit/2+start_y,
                        time_len+center_padding+time_unit/2+start_x
                    ])
    
    let personScaleX = person => {
        // console.log(person.id, person2matrix_id, person2matrix_id[person.id])
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
        let event_addrs = event.addr.map(addr_id=>addrs[addr_id])
        // console.log(event_addr, event.addr)
        let event_persons = event.roles.map(elm=> persons[elm.person])
        let event_time_ranges = event.time_range

        if (event_addrs.length===2) {
            console.log(event)
        }
        // 判断是否是中心人物参与的事件
        let is_in = false
        event.roles.forEach(elm=>{
            let person_id = elm.person
            if (person_id===selected_person_id){
                is_in = true
            }
        })

        // +y: 时间, -x,-y: 人, +x 地点

        // 画点
        // eslint-disable-next-line no-loop-func
        event_persons.forEach(person=>{
            // !(event_time_ranges[1]===9999 && event_time_ranges[0]===-9999)
            // 人 X 时间 
            if ( event_time_ranges[0]===event_time_ranges[1] && event_time_ranges[0]!==-9999) {
                let mark_year = event_time_ranges[0]
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
                // console.log(event_addr)
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
        if (event_addrs.length!==0 && event_time_ranges[0]===event_time_ranges[1] && event_time_ranges[0]!==-9999) {
            let mark_year = event_time_ranges[0]
            if (mark_year>total_time_range[0] && mark_year<total_time_range[1]) {
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
              
            }
        }else if(event_addrs.length!==0){
            let start_year = event_time_ranges[0]>total_time_range[0]? event_time_ranges[0] : total_time_range[0]
            let end_year = event_time_ranges[1]<total_time_range[1]? event_time_ranges[1] : total_time_range[1]
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

        let color = '#cd3b54'
        if (!is_in) {
            color = 'gray'
        }
        event_mark_data = event_mark_data.filter(elm => !isNaN(elm.x) && !isNaN(elm.y) && elm.x!==null && elm.y!==null)
        event_mark_datas.push([event_mark_data, color])
    }
    event_mark_datas = event_mark_datas.filter(data=> data[0].length>0)


    // 重叠的点需要合并
    let mark_dict = {}
    let personal_mark_dict = {}
    let new_attr_mark_datas = []
    for(let index in event_mark_datas){
        let attr_mark_data = event_mark_datas[index][0]
        let color = event_mark_datas[index][1]
        attr_mark_data = attr_mark_data.filter(elm=>{
            let used_dict = null
            if(color==='gray')
                used_dict = mark_dict
            else
                used_dict = personal_mark_dict

            // console.log(elm)
            let x = elm.x
            let y = elm.y
            if(!used_dict[x]){
                used_dict[x] = {}
                used_dict[x][y] = elm
                return true
            }else if(!used_dict[x][y]){
                used_dict[x][y] = elm
                return true
            }else{
                used_dict[x][y].size++
                used_dict[x][y].events =  [...used_dict[x][y].events,...elm.events]
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
        for (let year = total_time_range[0]; year <= total_time_range[1]+1; year+=1) {
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
        }

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
        for (let year = total_time_range[0]; year <= total_time_range[1]; year+=1) {
            let y = timeScale(year)
            matrix_texts.push({
                x: start_x,
                y: y,
                label: year.toString()
            })
        }

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
        person2matrix_id: person2matrix_id,
        addr2matrix_id: addr2matrix_id,
        time_range: total_time_range,
        matrix_lines: matrix_lines,
        matrix_texts: matrix_texts,
        persons: persons,
        addrs: addrs,
        event2marks:  event2marks
        // events:events
    }
}



export default EventMatrix