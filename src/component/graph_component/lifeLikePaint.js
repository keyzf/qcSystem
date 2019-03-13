// import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager, triggerManager, filtEvents, eventManager } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import stateManager from '../../dataManager/stateManager'
import { autorun } from 'mobx';
import Axis from './Axis';
import AreaLineChart from './AreaLineChart';
import BubbleChart from './BubbleChart';
import EventChart from './EventChart';

// 2019/2/25 线换成area，但是计算似乎出现了巨大的问题
class LifeLikePaint extends Component{
    selected_person = undefined
    selected_event_types = []
    all_events = []
    xscale=d3.scaleLinear();
    yscale=d3.scaleLinear();
    uncertainHeight= 100;
    maxy=0;
    maxy_sum=0;
    socre_range = [-1,35]

    constructor(){
        super()
       
        this.state = {
            checked:false,
            area_datas: [],
            showEventMark: undefined,
            prob_mark_data: [],
            selected_prob_year: undefined,
            event_tree_data: {
                title: ''
            },
            trigger_label_data: []
        }
        this.handleEventMarkClick = this.handleEventMarkClick.bind(this);
        this.changeViewType=this.changeViewType.bind(this);
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

        let prob_mark_data = [];
        console.log(year2events);
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
        console.log(prob_mark_data)
        this.setState({
            prob_mark_data: year2events,
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
        
        let maxy_sum=0;
        let maxy=0;
        years.forEach(year=>{
          let events = year2events[year]
          let scores = this.calculateScore(year2events, year, calcualte_method, selected_person, [...parent_types, '总'])
          // console.log(scores)
          let stack_y = 0
          parent_types.forEach(type=>{
              let this_events = events.filter(event => event.trigger.parent_type===type)
              if (scores[type] || scores[type]===0) {
                  // console.log(scoreScale(scores[type]), stack_y)
                  type2area_datas[type].push({
                      x: yearScale(year),
                      y: stack_y + scoreScale(scores[type]) ,
                      y0: stack_y,
                      size: eventNumScale(this_events.length),
                      events: this_events, //this.events_filter(events)
                      color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
                  })
                  stack_y += scoreScale(scores[type])   
              }
              if(maxy<stack_y){maxy=stack_y};
          })
          if (scores['总'] || scores['总']===0){
              type2area_datas['总'].push({
                  x: yearScale(year),
                  y: scoreScale(scores['总']),
                  y0: 0,
                  size: eventNumScale(events.length),
                  events: events,
                  color: events.includes(birth_event)||events.includes(death_event) ? 'red' : 'black'
              })   
          }
          if(maxy_sum<scoreScale(scores['总'])){
              maxy_sum=scoreScale(scores['总']);
          }
      })
      this.maxy=maxy;
      this.maxy_sum=maxy_sum;
      console.log('type',type2area_datas);

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

    changeViewType=()=>{
      this.setState({
          checked: !this.state.checked
      });
    }

    static get defaultProps() {
      return {
          padding:{
              right: 50,
              left: 50,
              top:10,
              bottom:10
          }
      };
    }

    render(){
        const padding_bottom = 20
        const {height, width, selected_person, padding} = this.props
        console.log('render lifeLikePaint 主视图', selected_person)
        let {area_datas, showEventMark, prob_mark_data, selected_prob_year, event_tree_data,  trigger_label_data, selected_trigger} = this.state
        let svgWidth=width-padding.left-padding.right;
        let svgHeight=height-padding.top-padding.bottom;
        let x_domain = [
            Math.min(...area_datas.map(data=> data.x_domain[0]).filter(elm=>elm)),
            Math.max(...area_datas.map(data=> data.x_domain[1]).filter(elm=>elm))
        ];
        console.log(area_datas);
        let select_bar_width = 325;
        this.xscale.domain(x_domain)
                   .range([0,svgWidth]);
        this.yscale.domain([0,this.maxy_sum])
                   .range([svgHeight-this.uncertainHeight,0]);
        console.log(prob_mark_data);
        // prob_mark_data = prob_mark_data.filter(data=> selected_prob_year && data.year===selected_prob_year).filter(elm=> elm)
        // prob_mark_data = prob_mark_data || []
        console.log(prob_mark_data)
        return (
          <div className="lifeMountain" style={{ height: height, width:width}}>
            <div className="ui toggle checkbox">
                <input type="checkbox" name="public" onChange={this.changeViewType} checked={this.state.checked}/>
                <label>分类视图</label>
            </div>
            <svg width={svgWidth} height={svgHeight} transform={`translate(${padding.left},${padding.top})`}>
                <Axis xscale={this.xscale} translate={`translate(0, ${svgHeight-this.uncertainHeight})`}></Axis>
                <AreaLineChart data={area_datas.map((d)=>d.line_data)} xscale={this.xscale} yscale={this.yscale} translate={`translate(0, ${height-this.uncertainHeight})`} viewType={this.state.checked}></AreaLineChart>
                <EventChart data={area_datas.map((d)=>d.event_graph_datas)} xscale={this.xscale} yscale={this.yscale} translate={`translate(0, ${height-this.uncertainHeight})`} viewType={this.state.checked}></EventChart>
                <BubbleChart data={prob_mark_data} areaHeight={svgHeight-this.uncertainHeight} translate={`translate(0, ${svgHeight-this.uncertainHeight+20})`} xscale={this.xscale} onEventClick={this.handleEventMarkClick}></BubbleChart>
            </svg>
          </div>
        )
    }
}

export default LifeLikePaint