// 绘制时间轴
import React, { Component } from 'react'
import {
    XYPlot,
    XAxis,
    YAxis,
    HorizontalGridLines,
    LineSeries,
    VerticalBarSeries,
  } from 'react-vis';
import NumPerYear from '../../data/temp_data/时间事件数.json'
class EventNumPerYear extends Component {
    constructor(props, context){
        super(props, context)
        console.log(NumPerYear)
        let data = []
        for(let year in NumPerYear){
            if (year==='0') {
                continue
            }
            // console.log(year)
            let num = NumPerYear[year]
            data.push({
                x: parseInt(year),
                y: num
            })
        }
        this.state = {
            data : data
        }
    }

    componentDidMount(){
    }
    render() {

        return (
            <XYPlot
            xDomain={[-200,2000]}
            width={900}
            height={1300}>
            <HorizontalGridLines />
            <VerticalBarSeries data={this.state.data}/>
            <XAxis title="X" />
            <YAxis />
            </XYPlot>
        );
    }
}

export default EventNumPerYear;