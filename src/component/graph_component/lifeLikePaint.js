// import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager, triggerManager, filtEvents, eventManager, triggerFilter, peopleFilter, addrFilter, yearFilter, ruleFilter } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3';
import _ from 'lodash';
import net_work from '../../dataManager/netWork'
import stateManager from '../../dataManager/stateManager'
import { autorun } from 'mobx';
import Axis from './Axis';
import AreaLineChart from './AreaLineChart';
import BubbleChart from './BubbleChart';
import EventChart from './EventChart';
import MountainChart from './MountainChart';
import EventTooltip from '../UI_component/eventTooltip';
import './lifeLikePaint.scss';

// 2019/2/25 线换成area，但是计算似乎出现了巨大的问题
class LifeLikePaint extends Component{
    selected_person = undefined
    selected_event_types = []
    all_events = []
    yscale=d3.scaleLinear();
    maxy=0;
    maxy_sum=0;
    socre_range = [-1,35]

    constructor(props){
        super(props)
       
        this.state = {
            area_datas: [],
            showEventMark: undefined,
            prob_mark_data: [],
            selected_prob_year: undefined,
            event_tree_data: {
                title: ''
            },
            trigger_label_data: [],
            relationLines:undefined,
            chooseEvent: undefined,
            triggerName: new Set(),
        }
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.renderLines = this.renderLines.bind(this);
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
    _onType2pChange = autorun(()=>{
        if (stateManager.is_ready) {
            this.type2p = stateManager.type2p
            let life_refresh = stateManager.life_refresh
            // console.log(this.type2p)
            this.loadLifeLineData()
            // this.loadInferMarkData()
            // this.getRelationLine()
        }
    })
    componentWillMount(){
        let {selected_person,index} = this.props
        this.selected_person = selected_person;
        this.setState({
            vis:index===0?'visible':'hidden'
        })
        // console.log(selected_person);
        net_work.require('getPersonEvents', {person_id:selected_person.id})
        .then(data=>{
            if(data){
                data = dataStore.processResults(data)
                this.all_events = dataStore.dict2array(data.events)
                // console.log(data)
                this.loadLifeLineData()
                this.loadInferMarkData()
                this.getRelationLine()
            }
        })
    }

    componentWillReceiveProps(nextProps){
        this.loadLifeLineData()
    }

    getRelationLine(){
        let selected_people = stateManager.selected_people;
        let len = selected_people.length;
        let other_people = selected_people.slice(0,len-1);
        let new_person = selected_people[len-1];
        let relationLines={};
        let yearmap = new Map();
        new_person.events.forEach((d,index)=>{
            let tmp = {};
            if(d.roles.length>1){
                for(let i=0;i<d.roles.length;i++){
                    let person_index = other_people.indexOf(d.roles[i].person);
                    if(person_index!==-1){
                        let year;
                        if(d.time_range[0]===d.time_range[1]){
                            year = d.time_range[0];
                        }else{
                            year = _.max(Object.keys(d.prob_year),o=>d.prob_year[o]);
                        }
                        if(relationLines[year]){
                            let tmp=relationLines[year];
                            tmp.event.push(d);
                            tmp.count++;
                            relationLines[year]=tmp;
                        }else if(year){
                            let tmp={};
                            tmp.event=[d];
                            tmp.count = 1;
                            let tmpLines=[];
                            tmpLines[0]={'person_index':len,'x':parseInt(year)};
                            tmpLines[1]={'person_index':person_index+1,'x':parseInt(year)};
                            tmp.lines = tmpLines;
                            relationLines[year]=tmp;
                        }
                    }
                }
            }
        })
        this.setState({
            relationLines:relationLines
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

    loadInferMarkData(){
        const {yearScale, eventNumScale, socre_range} = this
        const selected_person = this.selected_person
        if (!selected_person) {
            console.warn('没有选择的人物')
            return
        }
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
        // console.log(all_events);

        let year2events = eventManager.array2year2events(all_events)
        // 找到出生和死亡
        let birth_event = undefined, death_event = undefined
        let triggerName = new Set();
        all_events.forEach(event=>{
            if (event.trigger.name==='出生') {
                birth_event = event
            }else if (event.trigger.name==='死亡') {
                death_event = event
            }
            triggerName.add(event.trigger.getName());
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
        //   console.log(scores)
          let stack_y = 0
          parent_types.forEach((type,i)=>{
              let this_events = events.filter(event => event.trigger.parent_type===type)
              if (scores[type] || scores[type]===0) {
                  // console.log(scoreScale(scores[type]), stack_y)
                  type2area_datas[type].push({
                      x: yearScale(year),
                      y: stack_y +  scoreScale(scores[type]),
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
        this.setState({area_datas: area_datas,triggerName:triggerName})
    }

    
    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
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

    onMouseOver = (value,pos) => {
        this.setState({
          chooseEvent : value,
        })
        d3.select(this.refs.svg).select('#bubbleEventTooltip')
          .attr('visibility', 'visible')
          .attr('x',pos[0])
          .attr('y',pos[1])
    }
    onMouseOut = () =>{
        d3.select(this.refs.svg).select('#bubbleEventTooltip')
          .attr('visibility', 'hidden')
    }

    closePopup(){
        d3.select(this.refs.svg).select('#bubbleEventTooltip').attr('visibility','hidden');
    }    

    renderLines(){
        let node = this.refs.relationLineDom;
        let {line,xscale,height} = this.props;
        let {relationLines} = this.state;
        let linedoms = d3.select(node)
          .selectAll('.relationLine')
          .data(Object.values(relationLines));
        linedoms.selectAll('path')
                .attr('d',(d,i)=>{
                    return line(d.lines)
                })
        linedoms.selectAll('.upcircle')
                .attr('cx',d=>xscale(d.lines[0].x))
                .attr('cy',d=>height*d.lines[0].person_index-50)
        linedoms.selectAll('.downcircle')
                .attr('cx',d=>xscale(d.lines[0].x))
                .attr('cy',d=>height*d.lines[1].person_index-50)
        linedoms.exit().remove();
        let newgdom = linedoms.enter().append('g').attr('class','relationLine');
        newgdom.append('path')
                .attr('d',(d,i)=>{
                    return line(d.lines)
                })
                .attr('stroke','#000')
                .attr('stroke-width',d=>d.count)
                .attr('stroke-dasharray','4 1')
        newgdom.append('circle')
                .attr('class','upcircle')
                .attr('cx',d=>xscale(d.lines[0].x))
                .attr('cy',d=>height*d.lines[0].person_index-50)
                .attr('r',4)
                .attr('stroke','#000')
                .on('mouseover',(d)=>{
                    this.setState({
                        chooseEvent : d.event,
                    })
                    let pos = d3.mouse(this.refs.content);
                    d3.select(this.refs.content).select('#bubbleEventTooltip')
                    .attr('visibility', 'visible')
                    .attr('x',pos[0]+10)
                    .attr('y',pos[1]-130)
                })
                .on('mouseout',()=>{
                    d3.select(this.refs.content).select('#bubbleEventTooltip').attr('visibility','hidden');
                })
        newgdom.append('circle')
            .attr('class','downcircle')
            .attr('cx',d=>xscale(d.lines[0].x))
            .attr('cy',d=>height*d.lines[1].person_index-50)
            .attr('r',4)
            .attr('stroke','#000')
            .on('mouseover',(d)=>{
                this.setState({
                    chooseEvent : d.events,
                })
                let pos = d3.mouse(this.refs.content);
                d3.select(this.refs.content).select('#bubbleEventTooltip')
                .attr('visibility', 'visible')
                .attr('x',pos[0]+10)
                .attr('y',pos[1]-130)
            })
            .on('mouseout',()=>{
                d3.select(this.refs.content).select('#bubbleEventTooltip').attr('visibility','hidden');
            })
    }

    render(){
        const {transform, checked, zoomTransform, xscale, height, width, selected_person, line, index,uncertainHeight, handleEventMarkClick} = this.props
        console.log('render lifeLikePaint 主视图', area_datas)
        let {area_datas, relationLines, prob_mark_data, selected_prob_year, triggerName, chooseEvent, vis } = this.state
        this.yscale.domain([0,this.maxy_sum])
                   .range([height-uncertainHeight,30]);
        if(selected_prob_year){
            prob_mark_data = prob_mark_data[selected_prob_year];
        }
        console.log(area_datas);
        return (
            <g ref="svg" width={width} height={height}>
                <g ref="content" transform={transform}>
                    <g className="triggerName" transform={`translate(${width-10},${10})`} visibility={vis}>
                        {Array.from(triggerName).map((d,i)=>{
                            return (<text x={-i*20} key={i}>{d}</text>)
                        })}
                    </g>
                    <text className="personName" x={20} y={20}>{selected_person.name}</text>
                    <Axis xscale={xscale} translate={`translate(0, ${height-uncertainHeight})` } zoomTransform={zoomTransform} width={width}></Axis>
                    <MountainChart data={area_datas.map((d)=>d.line_data)} xscale={xscale} yscale={this.yscale} width={width} height={height-uncertainHeight} translate={`translate(0, ${height-uncertainHeight})`} viewType={checked} selected_person={selected_person} index={index} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut}></MountainChart>
                    <BubbleChart data={prob_mark_data} areaHeight={height-uncertainHeight} translate={`translate(0, ${height-uncertainHeight+22})`} xscale={xscale} onEventClick={handleEventMarkClick} onMouseOver={this.onMouseOver} onMouseOut={this.onMouseOut} width={width}></BubbleChart>
                    <foreignObject id="bubbleEventTooltip" x="20" y="22" width="200" height="140" visibility={'hidden'}>
                        <EventTooltip event={chooseEvent} name={selected_person.name} closePopup={this.closePopup}/>
                    </foreignObject>
                </g>
                <g ref="relationLineDom">
                {relationLines&&this.renderLines()}
                </g>
            </g>
        )
    }
}

export default LifeLikePaint