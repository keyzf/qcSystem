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
    Hint
  } from 'react-vis';

// 暂用于加载数据
import SuShiLife from '../../data/temp_data/苏轼事件人物.json'
import xAxis from 'react-vis/dist/plot/axis/x-axis';
import eventType2json from '../../data/temp_data/event2vec.json'
import contourSeries from 'react-vis/dist/plot/series/contour-series';

// 2019/1/21 绘制像山水感觉的事件图
class LifeLikePaint extends Component{
    constructor(){
        super()
        console.log(eventType2json)
        console.log(SuShiLife)
        let events = SuShiLife.event

        let min_time = 900
        let max_time = 300 

        let time_scale = d3.scaleLinear()
        .domain([900, 1200])
        .range([900,1200])


        // 33为一段
        let event_class_scale = d3.scaleLinear()
        .domain([1,99])
        .range([1,99])

        // 一个事件的数据格式为{ x, y, l, w,  h}

        // 一个点(1*1*1)的数据  x,y     events_array: [event:   uncertainty:]
        let points_data = {}
        let getPoint = (x,y)=>{
            if (!points_data[x]) {
                points_data[x] = {}
            }
            if(points_data[x][y])
                return points_data[x][y]
            else{
                points_data[x][y] = {x:x, y:y, events_array:[]}
                return points_data[x][y]
            }
        }
        events.forEach(event => {
            let time_range = event.time_range
            let x = 0
            let trigger_name = event.trigger.name
            // console.log(trigger_name)
            if(eventType2json[trigger_name]){
                x = eventType2json[trigger_name]
            }else if(trigger_name.indexOf('担任')!==-1){
                x = eventType2json['担任'] 
            }else if(trigger_name.indexOf('卸任')!==-1){
                x = eventType2json['卸任']
            }else{
                console.log(trigger_name + '不存在对应的位置' )
            }
            // console.log(x)
            x = parseFloat(x)
            // console.log(x)
            // x = event_class_scale(x)
            // if (time_range[0]!==time_range[1]) {
            //     return
            // }
            // 合并完全一样的
            for (let index = time_range[0]; index <= time_range[1]; index++) {
                // for(let this_x in points_data){
                //     if (points_data[this_x][index]) {
                //         let point_data_events = points_data[this_x][index].events_array
                //         for(let this_event in point_data_events){
                //             // console.log(this_event)
                //             this_event = point_data_events[this_event].event
                //             // console.log(this_event)
                //             if (this_event.trigger.name === event.trigger.name) {
                //                 x = this_x
                //             }
                //         }
                //     }
                // }
                let point = getPoint(x,index)
                point.events_array.push({event:event, uncertainty: 1/(time_range[1]-time_range[0]+1)})
            }

            // let cube
        });
        // console.log(points_data)
        // console.log(Math.max)

        let bar_data = []
        for(let x in points_data){
            for(let y in points_data[x]){
                let point_data = getPoint(x,y)
                // console.log(point_data)

                // 直接崩了
                // let temp_y = parseFloat(y)
                // point_data.events_array.forEach(elm=>{
                //     let one_bar = {
                //         y: temp_y+elm.uncertainty,
                //         x: x,
                //         y0: temp_y,
                //         opacity: elm.uncertainty
                //     } 
                //     bar_data.push(one_bar)
                //     temp_y += elm.uncertainty
                // })

                let total_uncertainty = point_data.events_array.reduce((total, elm)=>{
                    // console.log(elm.uncertainty, total)
                    return total + parseFloat(elm.uncertainty)
                }, 0)
                let avg_uncertainty = total_uncertainty/point_data.events_array.length
                // console.log(total_uncertainty)
                x = parseFloat(x)
                bar_data.push({
                    y: parseFloat(y)+ point_data.events_array.length,   // total_uncertainty*5,
                    x: x,
                    y0: parseFloat(y),
                    opacity: avg_uncertainty*avg_uncertainty*10,
                    event: point_data.events_array
                })
                // console.log({
                //     y: parseFloat(y)+ point_data.events_array.length,   // total_uncertainty*5,
                //     x: x,
                //     y0: parseFloat(y),
                //     opacity: avg_uncertainty*avg_uncertainty*10,
                //     event: point_data.events_array
                // })
            }
        }
        console.log(bar_data)
        this.state = {
            bar_data: bar_data,
            hintValue: null
        }
        // this.state.bar_data = bar_data
    }
    
    static get defaultProps() {
        return {
          width: 1000,
          height: 1200,
        };
    }

    render(){
        return (
            <XYPlot
            width={this.props.width}
            height={this.props.height}
            // xDomain={[0,99]}
            yDomain={[1000,1200]}>
                <VerticalBarSeries
                data={this.state.bar_data}
                barWidth={10}
                onValueClick= { value =>  {
                    console.log(value)
                    this.setState({hintValue:value})
                }}/>
                <XAxis/>
                <YAxis/>
                {/* {this.state.hintValue ? <Hint value={this.state.hintValue.y} /> : null} */}
            </XYPlot>
        )
    }
}

export default LifeLikePaint