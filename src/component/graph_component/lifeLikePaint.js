// import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager, triggerManager, filtEvents, eventManager, triggerFilter, peopleFilter, addrFilter, yearFilter, ruleFilter } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import stateManager from '../../dataManager/stateManager'
import { autorun } from 'mobx';
import Axis from './Axis';
import AreaLineChart from './AreaLineChart';
import BubbleChart from './BubbleChart';
import EventChart from './EventChart';
import HistoryEvent from './HistoryEvent';
import './lifeLikePaint.scss';

// 2019/2/25 线换成area，但是计算似乎出现了巨大的问题
class LifeLikePaint extends Component{
    selected_person = undefined
    selected_event_types = []
    all_events = []
    yscale=d3.scaleLinear();
    uncertainHeight= 80;
    maxy=0;
    maxy_sum=0;
    socre_range = [-1,35]

    constructor(props){
        super(props)
       
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
        // let {width,height,padding} = this.props;
    }

    _onEventFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            console.log('更新事件筛选')
            let used_types = stateManager.used_types
            let need_refesh = stateManager.need_refresh
            this.loadLifeLineData()
            this.loadInferMarkData()
        }
    })

    componentWillMount(){
        let {selected_person} = this.props
        this.selected_person = selected_person
        // console.log(selected_person);
        net_work.require('getPersonEvents', {person_id:selected_person.id})
        .then(data=>{
            // console.log(data);
            if(data){
                data = dataStore.processResults(data)
                this.all_events = dataStore.dict2array(data.events)
                // console.log(data)
                this.loadLifeLineData()
                this.loadInferMarkData()
            }
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
        let birth_year = this.selected_person.birth_year;
        let death_year = this.selected_person.death_year;
        let {all_events} = this
        all_events = filtEvents(all_events)
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
                // if(year < birth_year || year > death_year) continue;
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
        let parent_types = [...triggerManager.getParentTypes()].sort()  //分类
        let all_events = selected_person.getCertainEvents()  
        all_events = filtEvents(all_events)
        all_events = ruleFilter(all_events)
        // all_events = triggerFilter(all_events)
        // all_events = peopleFilter(all_events)
        // all_events = addrFilter(all_events)
        // all_events = yearFilter(all_events)

        let year2events = eventManager.array2year2events(all_events)
        // 找到出生和死亡
        let birth_event = undefined, death_event = undefined
        all_events.forEach(event=>{
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
          let events = year2events[year] || []
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
                      events: this_events,
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
    //   console.log('type',type2area_datas);

        let area_datas = []
        for(let type in type2area_datas){
            let tmp_certain ={};
            type2area_datas[type].forEach(d=>{
                tmp_certain[d.x]=d.events;
            })
            // console.log(tmp_certain);
            area_datas.push({
                type: calcualte_method+ '-' + selected_person.name + '-' + type,
                person: selected_person,
                line_data: type2area_datas[type],
                certain_events: tmp_certain,  //记录笔画表示事件的数据
                x_domain: [
                    birth_event?birth_event.time_range[0]:min_year, 
                    death_event?death_event.time_range[0]:max_year
                ] 
            })
        }
        area_datas = area_datas.filter(line_data=> area_datas.length>0)
        // console.log(area_datas)
        this.setState({area_datas: area_datas})
    }

    
    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    handleEventMarkClick = value => {
        const event = eventManager.get(value.id)
        // console.log(value, event)
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

    render(){
        const padding_bottom = 20
        const { zoomTransform, xscale, height, width, selected_person, padding, index} = this.props
        console.log('render lifeLikePaint 主视图', selected_person)
        let {area_datas, showEventMark, prob_mark_data, selected_prob_year, event_tree_data,  trigger_label_data, selected_trigger} = this.state
        // let x_domain = [
        //     Math.min(...area_datas.map(data=> data.x_domain[0]).filter(elm=>elm)),
        //     Math.max(...area_datas.map(data=> data.x_domain[1]).filter(elm=>elm))
        // ];
        // console.log(area_datas);
        // let select_bar_width = 325;
        this.yscale.domain([0,this.maxy_sum])
                   .range([height-this.uncertainHeight,0]);
        // console.log(prob_mark_data);
        if(selected_prob_year){
            prob_mark_data = prob_mark_data[selected_prob_year];
        }
        // prob_mark_data = prob_mark_data.filter(data=> selected_prob_year && data.year===selected_prob_year).filter(elm=> elm)
        // prob_mark_data = prob_mark_data || []
        console.log(prob_mark_data)
        return (
            <g ref="svg" width={width} height={height}>
                {/* <HistoryEvent xscale={xscale} translate={`translate(0, 0)` } zoomTransform={zoomTransform}></HistoryEvent> */}
                <Axis xscale={xscale} translate={`translate(0, ${height-this.uncertainHeight})` } zoomTransform={zoomTransform} width={width}></Axis>
                <AreaLineChart data={area_datas.map((d)=>d.line_data)} xscale={xscale} yscale={this.yscale} translate={`translate(0, ${height-this.uncertainHeight})`} viewType={this.state.checked}></AreaLineChart>
                <BubbleChart data={area_datas[0]?area_datas[0].certain_events:[]} xscale={xscale} translate={`translate(0, ${height-this.uncertainHeight+40})`} viewType={this.state.checked}></BubbleChart>
                <BubbleChart data={prob_mark_data} areaHeight={height-this.uncertainHeight} translate={`translate(0, ${height-this.uncertainHeight+20})`} xscale={xscale} onEventClick={this.handleEventMarkClick}></BubbleChart>
            </g>
        // </g>
        )
    }
}

export default LifeLikePaint