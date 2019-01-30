// 绘制时间轴
import React, { Component } from 'react'
import {
    XYPlot,
    XAxis,
    YAxis,
    HorizontalGridLines,
    LineSeries,
    VerticalBarSeries,
    VerticalBarSeriesCanvas,
  } from 'react-vis';
// import NumPerYear from '../../data/temp_data/时间事件数.json'
import person2year from '../../data/temp_data/person2year.json'
import person2vec from '../../data/temp_data/person2vec.json'
import { keys } from 'mobx';

class EventHappenOverview extends Component {
    constructor(props, context){
        super(props, context)
        
        let datas = []
        // console.log(person2year)
        for(let person in person2year){
            let data = []
            let y = person2vec[person]
            if (y) {
                let years = person2year[person]
                data = [...data, 
                    ...years.map(year=> {return { 
                    'x':parseInt(year),
                    'y':y, 
                    'y0':y-1/100000
                    }})
                ]
            }else{
                // console.log(person + '不存在对应的y')
            }
            datas.push(data)
            // console.log(data)
        }
        this.state = {
            datas : datas
        }
    }

    componentDidMount(){
    }
    render() {
        const myData = [
            {x: 3, y: 10},
            {x: 1, y: 5},
            {x: 2, y: 15}
          ]
        let datas =this.state.datas.slice(0,3000)
        // console.log(datas)
        console.log(datas.length)
        return (
            <XYPlot
            // xDomain={[-200,2000]}
            width={900}
            height={800}>
            <HorizontalGridLines />
            {
                datas.map((data, index)=> <VerticalBarSeriesCanvas data={data} key={index}/>)
            }
            {/* <VerticalBarSeriesCanvas data={myData}/> */}
            <XAxis title="year" />
            <YAxis />
            </XYPlot>
        );
    }
}

export default EventHappenOverview;