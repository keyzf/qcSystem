// import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager, triggerManager } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import jsonFormat from 'json-format'
import net_work from '../../dataManager/netWork'
import LifeLineMethod  from '../UI_component/lifeLineMethod'
import {
    XYPlot,
    XAxis,
    YAxis,
    // VerticalGridLines,
    // HorizontalGridLines,
    // VerticalBarSeries,
    // VerticalBarSeriesCanvas,
    // DiscreteColorLegend,
    Hint,
    AreaSeries,
    LineMarkSeries,
    MarkSeries,
    LineSeries,
    Highlight
  } from 'react-vis';

import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
// import { red } from 'ansi-colors';

// 2019/2/8 可以选择人物
@observer 
class LifeLikePaint extends Component{
    calculate_methods = [
        // '平均数',
        // '平均数 * log(事件数)',
        // '众数',
        // '中位数',
        '加权平均'
        // 'LSI': undefined,
        // 'LDA': undefined,
    ]
    // event_type = 
    constructor(){
        super()
        this.state = {
            // selectedPeople: [],
            line_datas: [],
            showEventMark: undefined,
            prob_mark_datas: [],
            chosed_calculate_method:  this.calculate_methods[0],
            events: new Set(),
            selected_event_types: []
        }
    }
    
    _changeSelectedPeople = autorun(()=>{
        let selectedPeople = stateManager.selected_people
        if (stateManager.is_ready) {
            // console.log(selectedPeople)
            console.log('_changeSelectedPeople')

            let selected_person = selectedPeople[0] || personManager.get('3767')
            console.log(selected_person)
            net_work.require('getPersonEvents', {person_id:selected_person.id})
            .then(data=>{
                data = dataStore.processResults(data)
                // console.log(data)
                this.loadLifeLineData(selected_person)
            })
            // 推测的那几个圆
            net_work.require('infer_person', {person_id:selected_person.id})
            .then(data=>{
                let infer = data.infer
                data = data.data
                data = dataStore.processResults(data)
                // this.loadInferMarkData(data, infer)
            })   
        }
    })
    events_filter = (events)=>{
        let event_types = this.state.selected_event_types
        if (event_types.length==0) {
            return events
        }else{
            return events.filter(event=> {
                let trigger = event.trigger
                // console.log(trigger, event_types, trigger.parent_type, event_types.includes(trigger.parent_type))
                return event_types.includes(trigger.name) || event_types.includes(trigger.type) || event_types.includes(trigger.parent_type)
            })
        }
    }

    calculateScore(year2events, year, events, method, selected_person, types){
        // 加一个窗口 windows
        const windows_size = 5
        for (let this_year = year-windows_size; this_year < year; this_year++) {
            if (year2events[this_year]) {
                events = [...events, ...year2events[this_year]]
            }
        }
        events = [... new Set(events)]

        let type2events = {}, type2score = {}
        types.forEach(type => {
            type2events[type] = events.filter( event => event.trigger.parent_type===type || type==='总')
            type2score[type] = 0
        })
        
        // console.log(type2events)
        let total_imp = events.reduce((total, event) => {
            let imp = event.getImp(selected_person) * Math.exp(-(year-event.time_range[0])/windows_size)
            return total+imp
        }, 0)

        // if (method==='平均数') {
        //     return total_score/events.length
        // }else if(method==='平均数 * log(事件数)') {
        //     return total_score/events.length * Math.log(events.length+1)
        // }else if(method==='众数') {
        //     const majorityElement = (nums) => {
        //         let map = {};
        //         let max_num = 0
        //         map[0] = 0
        //         nums.forEach(num=> {
        //             if (map[num]) {
        //                 map[num]++;
        //             } else {
        //                 map[num] = 1;
        //             }
        //             if (map[num]>map[max_num]) {
        //                 max_num = num
        //             }
        //         })
        //         return max_num
        //     };
        //     return majorityElement(scores)
        // }else if(method==='中位数'){
        //     scores.sort(function(a,b){return a-b;});
        //     var l = scores.length-1;
        //     var n = Math.floor(l/2);
        //     return (scores[n]+scores[l-n])/2;
        // }else 
        if(method==='加权平均' || true){
            types.forEach(type =>{
                if (type2events[type].length==0) {
                    type2score[type] = 0  //undefined //叠起来时为0
                }else{
                    type2score[type] = type2events[type].reduce((total, event)=>{
                        let imp = event.getImp(selected_person)  * Math.exp(-(year-event.time_range[0])/windows_size)
                        let score = event.getScore(selected_person) * imp / total_imp
                        // console.log(score, event.getScore(selected_person), imp, total_imp)
                        return total + score
                    }, 0)                    
                }
            })
        }
        return type2score
    }

    yearScale = year=> parseInt(year)
    scoreScale = score => parseFloat(score)
    eventNumScale = num => Math.log(num+1)

    loadInferMarkData(data, infer){
        // console.log(data, infer)
        let {yearScale, scoreScale, eventNumScale} = this
        let id2event = data.events
        let mark_datas = []
        let event_array = []
        let temp_index = 0
        for (let event_id in infer) {
            let mark_data = []
            let event = id2event[event_id]
            event_array.push(event)

            for(let year in infer[event_id]){
                let prob = parseFloat(infer[event_id][year])
                year = parseInt(year)
                mark_data.push({
                    x: yearScale(year),
                    y: temp_index*(10/Object.keys(infer).length),  //0
                    size: prob,
                    opacity: prob,
                    events: [event]
                })
            }
            mark_data = mark_data.sort((a,b)=>a.x-b.x)
            mark_datas.push(mark_data)

            temp_index++
        }
        this.setState({
            prob_mark_datas: mark_datas, 
            showEventMark:undefined, events: 
            new Set([...this.state.events, ...event_array])
        })
    }


    loadLifeLineData(selected_person){
        console.log('loadLifeLineData', selected_person, this.state.chosed_calculate_method)
        let {chosed_calculate_method} = this.state
        let parent_types = [...triggerManager.parent_types].sort()  //分类

        let year2events = selected_person.year2events()
        let events = selected_person.getCertainEvents()
        // 找到出生和死亡
        let birth_event = undefined, death_event = undefined
        events.forEach(event=>{
            if (event.trigger.name==='出生') {
                birth_event = event
            }else if (event.trigger.name==='死亡') {
                death_event = event
            }
        })


        let years = Object.keys(year2events).map(year=> parseInt(year))
        years = years.sort((a,b)=> a-b)
        let max_year = Math.max(...years)
        let min_year = Math.min(...years)

        let {yearScale, scoreScale, eventNumScale} = this

        for(let year in year2events){
            year2events[year] = this.events_filter(year2events[year])
        }

        // let line_datas = []
        let type2line_datas = {}
        type2line_datas['总'] = []
        parent_types.forEach(type=>{
            type2line_datas[type] = []
        })
        // parent_types = Object.keys(type2line_datas).sort()

        years.forEach(year=>{
            let events = year2events[year]
            let scores = this.calculateScore(year2events, year, events, chosed_calculate_method, selected_person, [...parent_types, '总'])
            // console.log(scores)
            let stack_y = 0
            // parent_types.forEach(type=>{
            //     let this_events = events.filter(event => event.trigger.parent_type===type)
            //     if (scores[type]) {
            //         stack_y += scoreScale(scores[type])
            //         // console.log(scoreScale(scores[type]), stack_y)
            //         type2line_datas[type].push({
            //             x: yearScale(year),
            //             y: stack_y,
            //             size: eventNumScale(this_events.length),
            //             events: this_events, //this.events_filter(events)
            //             color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
            //         })               
            //     }
            // })
            if (scores['总']){
                type2line_datas['总'].push({
                    x: yearScale(year),
                    y: scoreScale(scores['总']),
                    size: eventNumScale(events.length),
                    events: events,
                    color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
                })   
            }

        })

        let line_datas = []
        for(let type in type2line_datas){
            line_datas.push({
                type:  chosed_calculate_method + '-' + selected_person.name + '-' + type,
                person: selected_person,
                line_data: type2line_datas[type],
                event_graph_datas: [],  //记录笔画表示事件的数据
                x_domain: [
                    birth_event?birth_event.time_range[0]:min_year, 
                    death_event?death_event.time_range[0]:max_year
                ] 
            })
        }
        line_datas = line_datas.filter(line_data=> line_datas.length>0)
        console.log(line_datas)

        // 在line data上用area来编码事件
        line_datas.forEach(elm=>{
            let {line_data, person} = elm
            
            line_data.forEach(point => {
                let {events, x, y} = point
                let this_graph_datas = {}

                let this_time_event_graphs = events.map(event =>{
                    const max_left_angle = 90
                    const max_right_angle = 90
                    const score2angle = score =>{
                        if (score<0) {
                            return score/10*Math.abs(max_left_angle)/360*Math.PI
                        }else{
                            return score/10*Math.abs(max_right_angle)/360*Math.PI
                        }
                    }
                    const area_width = 0.3
                    const area_height = 0.1

                    let score = event.getScore(selected_person)
                    let angle = score2angle(score)

                    let x2 = Math.sin(angle) * area_width * 10 + x //10是因为比例导致的，之后要修改
                    let y2 = -Math.cos(angle) * area_width + y

                    this_graph_datas[x2] = this_graph_datas[x2] || {}
                    this_graph_datas[x2][y2] = this_graph_datas[x2][y2] || []

                    this_graph_datas[x2][y2].push({
                        event: event,
                        importance: Math.log( event.getImp(person) * 10000+1),
                        data: [
                            { x: x, y:y, y0:y-area_height},
                            { x: x2, y:y2, y0:y2-area_height},
                        ]
                    })
                    // console.log(event.getImp(person))
                })
                // 去除重叠
                const margin_y = 0.1
                let this_graph_data_array = []
                for(let x in this_graph_datas){
                    for(let y in this_graph_datas[x]){
                        let stack_graph_datas = this_graph_datas[x][y].map((data, index)=>{
                            data.data = data.data.map(point=>{
                                point.y -= margin_y  *index
                                return point
                            })
                            return data
                        })
                        this_graph_data_array = [...this_graph_data_array, ...stack_graph_datas]
                    }
                }

                elm.event_graph_datas = [...elm.event_graph_datas, ...this_graph_data_array]
            })
        })

        this.setState({line_datas: line_datas, events: new Set([...events, ...this.state.events])})
    }

    
    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    randerLifeLine = (line_datas) => 
        line_datas.map(elm=> [
            <LineMarkSeries
                key = {elm.person.id + '_' + elm.type}
                sizeRange = {[0,10]}
                data={elm.line_data}
                curve='curveMonotoneX' //{d3.curveCardinal}
                onValueClick={this.handleEventMarkClick}
                colorType= "literal"
                // stroke={elm.type.search("2")!==-1? 'black': 'gray' }
            />,
            elm.event_graph_datas.map(graph_data=>{
                // console.log(graph_data)
                return (
                    <LineSeries 
                    data={graph_data.data} 
                    curve={'curveMonotoneX'} 
                    strokeWidth={graph_data.importance}
                    color='gray' 
                    onValueClick = { value=> console.log(value)}
                    opacity='0.1'/> //                    
                )

            })
        ]

        )
    renderProbEventMark = (prob_mark_datas)=>
        prob_mark_datas.map(elm=>
            <MarkSeries
                key={elm[0].events[0].id + '_prob_marks'}
                sizeRange = {[1,10]}
                data={elm}
                onValueClick={this.handleEventMarkClick}
            />
        )

    handleEventMarkClick = (value) => {
        console.log(value)
        this.setState({showEventMark:value})
        stateManager.setSelectedEvent(value.events[0])
    }

    handleSelectBarChange = (event, {checked, my_type, label})=>{
        console.log(event, checked, my_type, label, this)
        if (my_type === 'method') {
            if (checked) {
                if (stateManager.is_ready) {
                    this.setState({chosed_calculate_method: label})       
                    this.state.chosed_calculate_method = label
                }
            }
        }else{
            // 这个写法肯定有问题，暂用
            if (stateManager.is_ready) {
                let selected_event_types = this.state.selected_event_types
                let trigger_name = label
                // console.log(checked)
                if (checked) {
                    if (!selected_event_types.includes(trigger_name)) {
                        selected_event_types.push(trigger_name)
                        this.setState({selected_event_types: selected_event_types})
                        this.state.selected_event_types = selected_event_types
                    }     
                }else{
                    let index = selected_event_types.findIndex(elm=> elm===trigger_name)
                    // console.log(index)
                    if (index!==-1) {
                        selected_event_types.splice(index,1)
                        this.setState({selected_event_types: selected_event_types})
                        this.state.selected_event_types = selected_event_types
                    }
                }
                // console.log(selected_event_types)
            }
        }
        // 现在只显示了一个人    
        let selectedPeople = stateManager.selected_people
        let selected_person = selectedPeople[0] || personManager.get('3767')
        this.loadLifeLineData(selected_person)         
    }

    render(){
        console.log('render lifeLikePaint 主视图')
        let {line_datas, showEventMark, prob_mark_datas, events} = this.state
        // events 有问题，以前存过的都会被保存
        let ownCountType = triggerManager.ownCountType(events)

        let x_domain = [
            Math.min(...line_datas.map(data=> data.x_domain[0]).filter(elm=>elm)),
            Math.max(...line_datas.map(data=> data.x_domain[1]).filter(elm=>elm))
        ]
        // console.log(line_datas.map(data=> data.x_domain[0]).filter(elm=>elm),x_domain)
        let select_bar_width = 325
        return (
            <div style={{}}>
                <div style={{
                    left:0, 
                    top:0,
                    position:'relative', 
                    width:select_bar_width, 
                    height:this.props.height,
                    overflowY:'scroll',
                }}>
                    <LifeLineMethod 
                        data={ownCountType} 
                        methods={this.calculate_methods}
                        onChange={this.handleSelectBarChange}
                    />
                </div>
                <div style={{left:select_bar_width+5, top:0,position:'absolute'}}>
                    <XYPlot
                    width={this.props.width-select_bar_width}
                    height={this.props.height/1}
                    onMouseLeave = {()=> this.setState({showEventMark: undefined})}
                    xDomain={x_domain}
                    // yDomain={[0,12]}
                    >
                    <XAxis/>
                    <YAxis/>
                    {
                        this.randerLifeLine(line_datas)
                    }
                    {
                        this.renderProbEventMark(prob_mark_datas)
                    }
                    {
                        this.state.showEventMark&&
                        <Hint value={showEventMark}>
                            <div style={{ fontSize: 8,background: 'black', padding: '10px'}}>
                                {
                                    showEventMark.events.map((show_event,index)=>
                                        <div key={index+'show_event_event_matrix'}>
                                            <span>{jsonFormat(show_event.toDict())}</span>  
                                        </div>                               
                                    )
                                }
                            </div>
                        </Hint>            
                    }
                    </XYPlot>   
                </div>             
            </div>

        )
    }
}

export default LifeLikePaint