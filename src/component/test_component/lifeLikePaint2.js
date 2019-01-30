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
    AreaSeries
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
            }else if(trigger_name.indexOf('文学作品')!==-1){
                x = eventType2json['文学作品']
            }else{
                console.log(trigger_name + '不存在对应的位置' )
            }

            x = parseFloat(x)
            if (event.time_range[0]!==event.time_range[1]) {
                return
            }
            for (let index = time_range[0]; index <= time_range[1]; index++) {
                let point = getPoint(x,index)
                point.events_array.push({event:event, uncertainty: 1/(time_range[1]-time_range[0]+1)})
            }
        });
        let bar_data = []
        let area_datas = []

        for(let x in points_data){
            for(let y in points_data[x]){
                let point_data = getPoint(x,y)
                // console.log(point_data)
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
            }
        }
        let point_reverse = {}
        for(let x in points_data){
            for(let y in points_data[x]){
                let point_data = getPoint(x,y)
                point_reverse[y] = point_reverse[y]||{}
                point_reverse[y][x] = point_data
            }
        }
        for(let y in point_reverse){
            let area_data = []
            for(let x in point_reverse[y]){
                let point_data = point_reverse[y][x]
                area_data.push({
                    y: parseFloat(y)+ point_data.events_array.length*5,   // total_uncertainty*5,
                    x: parseFloat(x),
                    y0: parseFloat(y),
                })
            }
            area_data = area_data.sort((a,b)=>{
                return a.x-b.x
            })
            // console.log(area_data)

            // 插值算法
            
            area_data = [{
                y: area_data[0].y0,
                y0:area_data[0].y0,
                x: area_data[0].x-0.1
            },...area_data,{
                y: area_data[0].y0,
                y0: area_data[0].y0,
                x: area_data[area_data.length-1].x+0.3
            }]

            // console.log(area_data)
            for (let time = 0; time < 2; time++) {
                let temp_area_data = []
                // eslint-disable-next-line no-loop-func
                area_data.forEach((point, index)=>{
                    // console.log(area_data,index)
                    if (index==area_data.length-1 && area_data.length!==1) {
                        return
                    }
                    // point
                    let next_point = area_data[index+1]
                    temp_area_data.push(point)
                    // let y = point.y0
                    // if (time%2!==0 || (next_point.x-point.x)<0.1 ) {
                    //     y = ((point.y+next_point.y)-2*point.y0)/2*(Math.random()*0.4+0.6)+point.y0
                    // }
                    // temp_area_data.push({
                    //     y: y,
                    //     x: (point.x+area_data[index+1].x)/2,
                    //     y0: point.y0
                    // })
                    // console.log(point, next_point)

                    // 
                    if (next_point&& next_point.x-point.x>=0.1) {
                        temp_area_data.push({
                            y: point.y0,
                            x: (point.x+next_point.x)/2,
                            y0: point.y0
                        })            
                    }

                    // console.log("HHHHHH")
                })                
                // console.log(temp_area_data)
                temp_area_data = temp_area_data.sort((a,b)=>{
                    return a.x-b.x
                })
                area_data = temp_area_data
            }
            // console.log(area_data)
            area_datas.push(area_data)
        }


        console.log(bar_data, area_datas)
        area_datas = area_datas.reverse()
        this.state = {
            bar_data: bar_data,
            hintValue: null,
            area_datas: area_datas
        }
    }
    
    static get defaultProps() {
        return {
          width: 1200,
          height: 1200,
        };
    }

    render(){
        let showValues = []
        let showEvents = []
        for(let event_tag in eventType2json){
            if (Math.random()<0.1) {
                showValues.push(eventType2json[event_tag])
                showEvents.push(event_tag)                
            }
        }
        // console.
        
        return (
            <XYPlot
            width={this.props.width}
            height={this.props.height}
            // xDomain={[0,99]}
            // margin={{botton:400}}
            yDomain={[1000,1200]}>
                {/* <VerticalBarSeries
                data={this.state.bar_data}
                barWidth={10}
                onValueClick= { value =>  {
                    console.log(value)
                    this.setState({hintValue:value})
                }}/> */}
                {
                this.state.area_datas.map(area_data=>{
                    return <AreaSeries 
                        getNull={(d) => d.y !== null} 
                        data={area_data} 
                        curve={'curveBasis'}
                        opacity= {0.9}
                        fill= 'rgb(124, 125, 127)'
                        stroke= {'None'}/>
                })
                }
                {/* <AreaSeries getNull={(d) => d.y !== null} data={this.state.AreaSeries} curve={'curveMonotoneX'} /> */}
                <XAxis
                tickValues={showValues}
                tickFormat={(d,i) => showEvents[i]}
                tickLabelAngle={-90}/>
                <YAxis/>
                {/* {this.state.hintValue ? <Hint value={this.state.hintValue.y} /> : null} */}
            </XYPlot>
        )
    }
}

export default LifeLikePaint