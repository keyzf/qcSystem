// import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager, triggerManager, filtEvents, eventManager } from '../../dataManager/dataStore2'
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
    Treemap,
    Hint,
    AreaSeries,
    LineMarkSeries,
    MarkSeries,
    LineSeries,
    Highlight,
    LabelSeries
  } from 'react-vis';

// import {observer, inject} from 'mobx-react';
// import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'
import { autorun } from 'mobx';
// import { red } from 'ansi-colors';

// 2019/2/25 线换成area，但是计算似乎出现了巨大的问题
class LifeLikePaint extends Component{
    selected_person = undefined
    selected_event_types = []
    all_events = []

    socre_range = [-1,35]

    constructor(){
        super()
       
        this.state = {
            area_datas: [],
            showEventMark: undefined,
            prob_mark_data: [],
            prob_layout_data: [],
            selected_prob_year: undefined,
            event_tree_data: {
                title: ''
            },
            trigger_label_data: []
        }
    }

    _onEventFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            console.log('更新事件筛选')
            let used_types = stateManager.used_types
            this.loadLifeLineData()
        }
    })

    componentWillMount(){
        let {selected_person} = this.props
        this.selected_person = selected_person
        net_work.require('getPersonEvents', {person_id:selected_person.id})
        .then(data=>{
            data = dataStore.processResults(data)
            this.all_events = dataStore.dict2array(data.events)
            // console.log(data)
            this.loadLifeLineData()
            this.loadInferMarkData()
        })
    }

    calculateScore(year2events, year, method, selected_person, types){
        // 加一个窗口 windows
        const windows_size = 5
        let events = []
        for (let this_year = year-windows_size; this_year <= year; this_year++) {
            if (year2events[this_year]) {
                events = [...events, ...year2events[this_year]]
            }
        }
        events = [...new Set(events)]

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
        // console.log(total_imp)
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
        // console.log(type2score)
        return type2score
    }

    yearScale = year=> parseInt(year)
    scoreScale = score => parseFloat(score)
    eventNumScale = num => Math.log(num+1)

    loadInferMarkData(){
        const {yearScale, eventNumScale, socre_range} = this

        let {all_events} = this
        all_events = all_events.filter(event=> !event.isTimeCertain())
        // console.log(all_events)
        let year2events = {}
        all_events.forEach(event=>{
            let {prob_year} = event
            // console.log(prob_year, event)
            let max_prob = 0
            let max_year = -9999
            for(let year in prob_year){
                year = parseInt(year)
                let prob = prob_year[year]
                if (prob>max_prob) {
                    max_prob = prob
                    max_year = year
                }
            }
            if (max_year!==-9999) {
                year2events[max_year] = year2events[max_year] || []
                year2events[max_year].push(event)                
            }
        })

        let prob_layout_data = Object.keys(year2events).map(year=>{
            year = parseInt(year)
            const events = year2events[year]
            return {
                x: yearScale(year),
                y: -1,  //0
                year: year,
                size: eventNumScale(events.length),
                events: events.map(event=> event.id)
            }
        })

        let prob_mark_data = []
        for (let year in year2events) {
            const events = year2events[year];
            // eslint-disable-next-line no-loop-func
            let mark_datas = events.map((event,index)=>{
                let {prob_year} = event 
                let prob = parseFloat(prob_year[year])
                year = parseInt(year)
                return {
                    x: yearScale(year),
                    y: index,
                    year: year,
                    size: prob*3,
                    opacity: prob,
                    prob: prob,
                    event_id: event.id
                }
            })
            mark_datas = mark_datas.sort((a,b)=> b.prob-a.prob)
            let d = (socre_range[1]-socre_range[0])/mark_datas.length
            d = d>1? 1:d
            mark_datas = mark_datas.map((elm,index)=> {
                elm.y =  d * index
                return elm
            })
            prob_mark_data = [...prob_mark_data, ...mark_datas]
        }
        this.setState({
            prob_mark_data: prob_mark_data,
            prob_layout_data: prob_layout_data,
            showEventMark:undefined,
        })
    }


    loadLifeLineData(){
        const selected_person = this.selected_person
        if (!selected_person) {
            console.warn('没有选择的人物')
            return
        }
        console.log('loadLifeLineData', selected_person)
        let {calcualte_method} = this.props
        if(!calcualte_method){
            console.warn('没有calcualte_method')
            return
        }
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
            year2events[year] = filtEvents(year2events[year])
        }

        // let area_datas = []
        let type2area_datas = {}
        type2area_datas['总'] = []
        parent_types.forEach(type=>{
            type2area_datas[type] = []
        })
        // parent_types = Object.keys(type2area_datas).sort()
        
        for (let year = min_year; year <= max_year; year++){
            let events = year2events[year] || []
            let scores = this.calculateScore(year2events, year, calcualte_method, selected_person, [...parent_types, '总'])
            // console.log(scores)
            let stack_y = 0
            // parent_types.forEach(type=>{
            //     let this_events = events.filter(event => event.trigger.parent_type===type)

            //     if (scores[type] || scores[type]===0) {
            //         // console.log(scoreScale(scores[type]), stack_y)
            //         type2area_datas[type].push({
            //             x: yearScale(year),
            //             y: stack_y + scoreScale(scores[type]) ,
            //             y0: stack_y,
            //             size: eventNumScale(this_events.length),
            //             events: this_events, //this.events_filter(events)
            //             color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
            //         })
            //         stack_y += scoreScale(scores[type])   
            //     }
            // })
            if (scores['总'] || scores['总']===0){
                type2area_datas['总'].push({
                    x: yearScale(year),
                    y: scoreScale(scores['总']),
                    y0: 0,
                    size: eventNumScale(events.length),
                    events: events.map(event=> event.id),
                    color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
                })   
            }
        }

        let area_datas = []
        for(let type in type2area_datas){
            area_datas.push({
                type: calcualte_method+ '-' + selected_person.name + '-' + type,
                person: selected_person,
                line_data: type2area_datas[type],
                event_graph_datas: [],  //记录笔画表示事件的数据
                x_domain: [
                    birth_event?birth_event.time_range[0]:min_year, 
                    death_event?death_event.time_range[0]:max_year
                ] 
            })
        }
        area_datas = area_datas.filter(line_data=> area_datas.length>0)
        // console.log(area_datas)

        let all_events = selected_person.events
        all_events = filtEvents(all_events)
        parent_types = [...new Set(all_events.map(event=> event.trigger.parent_type))]
        let tree_data = {
            title: "",
            color: Math.random(), 
            children: parent_types.map(parent_type=>{
                // let events = all_events.filtEvents(event=> event.trigger.parent_type===parent_type)
                let types = [...new Set(all_events.map(event=> event.trigger.type))]
                let events = all_events.filter(event=> event.trigger.parent_type===parent_type)
                return {
                    title: parent_type + '(' + events.length + ')',
                    color: Math.random(), 
                    size: events.length,
                    // children: types.map(type=>{
                    //     let triggers = [...new Set(all_events.map(event=> event.trigger.name))]
                    //     let events = all_events.filter(event=> event.trigger.type===type)
                    //     return {
                    //         title: type,
                    //         size: events.length,
                    //         color: Math.random(), 
                    //         // children: triggers.map(trigger=>{
                    //         //     let events = all_events.filter(event=> event.trigger.name===trigger)
                    //         //     return {
                    //         //         title: trigger,
                    //         //         size: events.length
                    //         //     }
                    //         // })
                    //     }
                    // })
                }
            })
        }
        
        // 加载上面的词云
        let all_triggers = all_events.map(event=> event.trigger)
        all_triggers = [...new Set(all_triggers)]

        let trigger_label_data = []
        all_triggers.forEach(trigger=>{
            let events = all_events.filter(event=> event.trigger===trigger)
            let certain_events = events.filter(event=> event.isTimeCertain())
            if (certain_events.length===0) {
                return
            }
            const name = trigger.getName()
            let size = events.length
            let x = certain_events.reduce((total, event)=> total+event.time_range[0], 0)/certain_events.length
            let y = Math.random()*6+6  //需要改进，去重叠

            trigger_label_data.push({
                x:x,
                y:y,
                label: name,
                style: {fontSize: Math.log(Math.log(size+1)+1)*10},
                event_ids: events.map(event=> event.id),
                trigger_id: trigger.id
            })
        })


        this.setState({area_datas: area_datas, event_tree_data: tree_data, trigger_label_data: trigger_label_data})
    }

    
    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    randerLifeLine = (area_datas) => 
        area_datas.map(elm=> [
            <AreaSeries
                key = {elm.person.id + '_' + elm.type}
                sizeRange = {[0,10]}
                data={elm.line_data}
                curve='curveMonotoneX' //{d3.curveCardinal}
                onValueClick={this.handleEventMarkClick}
                colorType= "literal"
                opacity='0.2'
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

    handleEventMarkClick = value => {
        const event = eventManager.get(value.event_id)
        console.log(value, event)
        stateManager.setSelectedEvent(event)
    }

    handleSelectBarChange = (event, {checked, my_type, label})=>{
        const {selected_person} = this.props
        // console.log(event, checked, my_type, label, this)
        if (stateManager.is_ready) {
            let {selected_event_types} = this
            let trigger_name = label
            if (checked) {
                if (!selected_event_types.includes(trigger_name)) {
                    selected_event_types.push(trigger_name)
                }     
            }else{
                this.selected_event_types = selected_event_types.filter(elm=> elm!==trigger_name)
            }
        }
        this.loadLifeLineData(selected_person)         
    }

    render(){
        const padding_bottom = 20
        const {height, width, selected_person} = this.props
        console.log('render lifeLikePaint 主视图', selected_person)
        let {area_datas, showEventMark, prob_mark_data, prob_layout_data, selected_prob_year, event_tree_data,  trigger_label_data, selected_trigger} = this.state

        let x_domain = [
            Math.min(...area_datas.map(data=> data.x_domain[0]).filter(elm=>elm)),
            Math.max(...area_datas.map(data=> data.x_domain[1]).filter(elm=>elm))
        ]
        let select_bar_width = 325


        prob_mark_data = prob_mark_data.filter(data=> selected_prob_year && data.year===selected_prob_year).filter(elm=> elm)
        prob_mark_data = prob_mark_data || []
        // console.log(prob_mark_data)
        return (
            <div style={{position:'absolute', height: height, width:width, paddingRight:10}}>
                <div style={{
                    left:0, 
                    top:0,
                    position:'absolute',
                    width:select_bar_width, 
                    height: height-padding_bottom,
                    overflowY:'scroll',
                }}> 
                    <div>{selected_person.toText()}</div>
                    <div>
                        <Treemap
                        width={select_bar_width-10}
                        height={select_bar_width-10}
                        data={event_tree_data}/>
                    </div>
                </div>
                
                <div style={{left:select_bar_width+5, top:0,position:'absolute'}}>
                    <XYPlot
                    width={width-select_bar_width}
                    height={(height-padding_bottom)/1}
                    onMouseLeave = {()=> this.setState({showEventMark: undefined, selected_prob_year: undefined})}
                    xDomain={x_domain}
                    // animation
                    yDomain={this.socre_range}
                    >
                    <XAxis/>
                    {/* <YAxis/> */}
                    {
                        selected_trigger && 
                        area_datas.map(data=>{
                            let type = data.type
                            return data.line_data.map((point_data, index)=>{
                                let events = point_data.events.map(id=> eventManager.get(id))
                                events = events.filter(event=> event.trigger===selected_trigger)
                                if (events.length>0) {
                                    return (
                                        <Hint value={point_data} key={type+ index + 'hint'}>
                                        <div style={{ fontSize: 8,background: 'black', padding: '10px'}}>
                                            {
                                                events.map((event, index)=> 
                                                    <div key={index+'hint_div'}>
                                                        <span>{event.toText()}</span>  
                                                    </div>  )
                                            }
                                        </div>
                                        </Hint>   
                                    )                                    
                                }else{
                                    return undefined
                                }
                            })
                        })
                    }
                    {
                        this.state.showEventMark&&
                        <Hint value={showEventMark}>
                            <div style={{ fontSize: 8,background: 'black', padding: '10px'}}>
                                { eventManager.get(showEventMark.event_id) && eventManager.get(showEventMark.event_id).toText()}
                            </div>
                        </Hint>            
                    }
                    {
                        this.randerLifeLine(area_datas)
                    }
                    <MarkSeries
                        key='layout_prob_marks'
                        sizeRange = {[1,10]}
                        data={prob_layout_data}
                        onValueMouseOver ={value => this.setState({selected_prob_year: value.year})}
                    />
                    <MarkSeries
                        key='prob_marks_data'
                        sizeRange = {[1,10]}
                        data={prob_mark_data}
                        onNearestXY = {value => this.setState({showEventMark: value})}
                        onValueClick = {this.handleEventMarkClick}
                    />
                    <LabelSeries
                        labelAnchorX = 'middle'
                        labelAnchorY = 'middle'
                        data={trigger_label_data}
                        allowOffsetToBeReversed
                        onValueMouseOut={value=> this.setState({selected_trigger: undefined})}
                        onValueMouseOver={value=> this.setState({selected_trigger: triggerManager.get(value.trigger_id)})}
                    />
                    </XYPlot>   
                </div>             
            </div>

        )
    }
}

export default LifeLikePaint