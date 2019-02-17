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
    // AreaSeries,
    LineMarkSeries,
    MarkSeries,
    // LineSeries
  } from 'react-vis';

import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'

// 2019/2/8 可以选择人物
@observer 
class LifeLikePaint extends Component{
    calculate_methods = [
        '平均数',
        '平均数 * log(事件数)',
        '众数',
        '中位数',
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
            chosed_calculate_method:  this.calculate_methods[1],
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

    calculateScore(year2events, year, events, method, selected_person){
        // 加一个窗口 windows
        let windows_size = 5
        for (let this_year = year-windows_size; this_year < year; this_year++) {
            if (year2events[this_year]) {
                events = [...events, ...year2events[this_year]]
            }
        }
        // events = [...new Set(events)]

        // events = this.events_filter(events)
        if (events.length==0) {
            return -9999
        }
        let total_imp = events.reduce((total, event) => {
            // console.log(event)
            let imp = event.getImp(selected_person)
            return total+imp
        }, 0)
        let scores = events.map(event=> {
            // let imp = event.getImp(selected_person)
            // let score = event.getScore(selected_person) * imp/total_imp
            console.log(Math.exp(-(year-event.time_range[0])/windows_size))
            return event.getScore(selected_person) * Math.exp(-(year-event.time_range[0])/windows_size)
        })
        let total_score = scores.reduce((total, score) => {
            return total+score
        }, 0)

        if (method==='平均数') {
            return total_score/events.length
        }else if(method==='平均数 * log(事件数)') {
            return total_score/events.length * Math.log(events.length+1)
        }else if(method==='众数') {
            const majorityElement = (nums) => {
                let map = {};
                let max_num = 0
                map[0] = 0
                nums.forEach(num=> {
                    if (map[num]) {
                        map[num]++;
                    } else {
                        map[num] = 1;
                    }
                    if (map[num]>map[max_num]) {
                        max_num = num
                    }
                })
                return max_num
            };
            return majorityElement(scores)
        }else if(method==='中位数'){
            scores.sort(function(a,b){return a-b;});
            var l = scores.length-1;
            var n = Math.floor(l/2);
            return (scores[n]+scores[l-n])/2;
        }else if(method==='加权平均'){
            return events.reduce((total,event)=> {
                let imp = event.getImp(selected_person)
                let score = event.getScore(selected_person) * imp/total_imp
                return total + score
            }, 0)
        }

        return total_score/events.length * Math.log(events.length+1)
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
        let line_datas = []

        // console.log(data)
        // let selected_person = personManager.get('3767')
        let year2events = selected_person.year2events()
        let events = selected_person.getCertainEvents()
        // console.log(selected_person, year2events, events)

        let years = Object.keys(year2events).map(year=> parseInt(year))
        years = years.sort((a,b)=> a-b)
        let max_year = Math.max(...years)
        let min_year = Math.min(...years)

        let {yearScale, scoreScale, eventNumScale} = this

        for(let year in year2events){
            year2events[year] = this.events_filter(year2events[year])
        }
        //暂时只画一个
        let line_data = years.map(year=>{
            let events = year2events[year]
            let score = this.calculateScore(year2events, year, events, this.state.chosed_calculate_method, selected_person)
            console.log(events)
            return {
                x: yearScale(year),
                y: scoreScale(score),
                size: eventNumScale(events.length),
                events: events, //this.events_filter(events)
            }
        }).filter(elm=> elm.y!==scoreScale(-9999))

        line_datas.push({
            type:  this.chosed_calculate_method,
            person: selected_person,
            line_data: line_data
        })
        this.setState({line_datas: line_datas, events: new Set([...events, ...this.state.events])})
    }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    randerLifeLine = line_datas => 
        line_datas.map(elm=>                
            <LineMarkSeries
                key = {elm.person.id + '_' + elm.type}
                sizeRange = {[3,10]}
                data={elm.line_data}
                curve={'curveMonotoneX'}
                onValueClick={this.handleEventMarkClick}
            />
        )
    renderProbEventMark = prob_mark_datas=>
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

        // console.log(line_datas, this.state.line_datas)
        // console.log(this.randerLifeLine(line_datas))
        // console.log(line_datas[0])
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
                    // xDomain={[1036,1200]}
                    yDomain={[0,12]}
                    >
                    {
                        this.randerLifeLine(line_datas)
                    }
                    <XAxis/>
                    <YAxis/>
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