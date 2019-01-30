// import dataGetter from '../../dataManager/dataGetter'
// import dataStore from '../../dataManager/dataStore'
import React, { Component } from 'react'
import * as d3 from 'd3'
import {
    XYPlot,
    XAxis,
    YAxis,
    VerticalGridLines,
    HorizontalGridLines,
    VerticalBarSeries,
    VerticalBarSeriesCanvas,
    DiscreteColorLegend,
    Hint,
    AreaSeries,
    LineMarkSeries,
    LineSeries
  } from 'react-vis';

// 暂用于加载数据
// import SuShiLife from '../../data/temp_data/苏轼事件人物.json'
import SuShi from '../../data/temp_data/苏轼.json'
import xAxis from 'react-vis/dist/plot/axis/x-axis';
// import eventType2json from '../../data/temp_data/event2vec.json'
// import contourSeries from 'react-vis/dist/plot/series/contour-series';
import event2score from '../../data/temp_data/event2score.json'
import { print } from 'util';

// 2019/1/21 绘制像山水感觉的事件图
class LifeLikePaint extends Component{
    constructor(){
        super()
        console.log('Construct')
        // 暂用于补足
        event2score['担任'] = {
            "type": "政治",
            "parent_type": "政治",
            "score": 9
        }
        // 暂用于处理多出来的奇怪的[]
        let SuShiLife = {}
        for(let year in SuShi){
            // console.log(SuShi,  SuShi[year])
            let events = SuShi[year][0]
            SuShiLife[year] = events
            // events.forEach(event=>{
            //     let roles = event.roles
            //     roles.forEach(elm=>{
            //         if (elm.person==='苏轼' && elm.role==='主角') {
            //             SuShiLife[year].push(event)
            //         }
            //     })
            // })           
        }

        // console.log(eventType2json)
        console.log(event2score)
        console.log(SuShiLife)

        let min_time = 900
        let max_time = 300 

        let time_scale = d3.scaleLinear()
        .domain([900, 1200])
        .range([900,1200])


        // 33为一段
        let event_class_scale = d3.scaleLinear()
        .domain([1,99])
        .range([1,99])

        let line_data1 = []   //取一定范围类的总和
        let line_data2 = []   //一定范围综合的平均数
        let line_data3 = []   //当年的最大值
        let line_datas1 = {}   //按当年类型分类，然后取平均值

        for(let year in SuShiLife){
            // console.log(year)
            // console(SuShiLife)
            let events = SuShiLife[year]
            // console.log(events)
            let this_events_num =  Math.log(events.length)
            let max = 0
            console.log(events)
            events.forEach(event=>{
                // console.log(event,event.trigger)
                let event_type = event.trigger.name
                let score = event2score[event_type]
                if(score){
                    score = parseFloat(score.score)
                }else{
                    // console.log(event_type + ' 不存在评分')
                    score = parseFloat(3)
                }
                if(score>max){
                    max = score
                }
            })
            let event_array = events.map(event=>{
                // console.log(event)
                return event.time_range.join('-') + ' ' + event.trigger.name  + ':' + event.roles.map(elm=>elm.person+'('+elm.role+')').join(' ')
                // + event.trigger.name.replece('Y', )
            })
            line_data3.push({
                x: parseInt(year),
                y: max,
                size: this_events_num,
                events: event_array
            })

            

            // 取一定范围内的关系
            let middle = parseInt(year)
            let total_score = 0
            let events_num = 0 
            let type_score = {}
            let type_num = {}
            let type_event = {}
            let range = 1
            for(let year=middle-range; year<=middle+range; year++){
                let events = SuShiLife[year.toString()]
                events = events?events:[]
                console.log(events)
                // eslint-disable-next-line no-loop-func
                events.forEach(event=>{
                    let event_type = event.trigger.name
                    let score = event2score[event_type]
                    if(score){
                        total_score += parseFloat(score.score)
                        events_num++
                        
                        let type = score.parent_type.toString()
                        console.log(event_type, type)
                        score = parseFloat(score.score)
                        // console.log(type, score)
                        type_score[type] = type_score[type] || 0
                        type_num[type] = type_num[type] || 0
                        type_score[type] += score
                        type_num[type]++
                        if (year===middle) {
                            type_event[type] = type_event[type] || []
                            type_event[type].push(event)
                        }
                        // console.log(event_type,score,score.score)
                    }else{
                        // console.log(event_type + ' 不存在评分')
                        total_score += parseFloat(3)
                        events_num++
                    }
                })
            }
            console.log(type_event)

            for(let type in type_score){
                if (!type_event[type]) {
                    continue
                }
                console.log(type_event[type])
                line_datas1[type] = line_datas1[type] || []
                line_datas1[type].push({
                    x: parseInt(year),
                    y: type_score[type]/type_num[type]*Math.log(type_num[type]+1),
                    size: type_num[type],
                    type: type,
                    events: type_event[type].map(event=>{
                        return event.time_range.join('-') + ' ' + event.trigger.name  + ':' + event.roles.map(elm=>elm.person+'('+elm.role+')').join(' ')
                    })
                })
            }

            // console.log(total_score)
            line_data1.push({
                x: parseInt(year),
                y: Math.log(total_score),
                size: this_events_num,
                events: event_array
            })
            // console.log(this_events_num)
            line_data2.push({
                x: parseInt(year),
                y: total_score/events_num,
                size: this_events_num,
                events: event_array
            })
        }

        this.state = {
            line_data1: line_data1,
            line_data2: line_data2,
            line_data3: line_data3,
            line_datas1: line_datas1,
            value: null
        }
    }
    
    static get defaultProps() {
        return {
          width: 1600,
          height: 1200,
        };
    }

    render(){
        // let line_data = this.state.line_data
        let showEventValue = (value)=>{
            console.log(value)
            this.setState({value:value})
        }
        return (
            <XYPlot
            width={this.props.width}
            height={this.props.height}
            xDomain={[1036,1200]}
            // margin={{botton:400}}
            // yDomain={[0,10]}
            >
                {/* <LineMarkSeries
                    sizeRange = {[1,10]}
                    data={this.state.line_data1}
                    curve={'curveMonotoneX'}
                    onValueClick={showEventValue}
                /> */}
                {/* <LineMarkSeries
                    sizeRange = {[1,10]}
                    data={this.state.line_data2}
                    curve={'curveMonotoneX'}
                    onValueClick={showEventValue}
                /> */}
                {/* <LineMarkSeries
                    sizeRange = {[1,10]}
                    data={this.state.line_data3}
                    curve={'curveMonotoneX'}
                    onValueClick={showEventValue}
                /> */}
                {
                    Object.keys(this.state.line_datas1).map(type=>{
                        return  <LineMarkSeries
                                sizeRange = {[3,13]}
                                data={this.state.line_datas1[type]}
                                curve={'curveMonotoneX'}
                                onValueClick={showEventValue}
                                />
                    })
                }
                {
                this.state.value&&                
                <Hint value={this.state.value}>
                    <div style={{ fontSize: 14,background: 'black', padding: '10px'}}>
                        <h3>{this.state.value.type}</h3>
                        <p>year:{this.state.value.x}</p>
                        {
                            this.state.value.events.map(event=>{
                                return <p>{event}</p>
                            })
                        }
                        {/* <p>{myValue.x}</p> */}
                    </div>
                </Hint>
                }
                <XAxis/>
                <YAxis/>
            </XYPlot>
        )
    }
}

export default LifeLikePaint