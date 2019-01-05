import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import React, { Component } from 'react'
import * as d3 from 'd3'
import vis from 'vis'
import moment from 'moment'
import 'vis/dist/vis.min.css'
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import {LineMarkSeries, VerticalGridLines , HorizontalGridLines, XAxis, YAxis} from 'react-vis'
import { set } from 'mobx';
// import tsnejs from 'tsne'
import * as hdsp from "hdsp";
class MainGraph extends Component{
    constructor(){
        super()
        this.state = {
            peopleData: [], 
            allPeopleList: [],
            show_people:  ['孔文仲'],
            value: false,
            scale_start_time: new Date(900, 0, 0, 0),
            scale_end_time: new Date(1300, 0, 0, 0),
        }

    }

    static get defaultProps() {
        return {
          width: 1500,
          height: 900,
        };
    }

    componentDidMount(){

    }

    strToRange(str){
        // console.log(str)
        let result = []
        if(/-/.test(str)){
            let start = str.split('-')[0]
            let end = str.split('-')[1].replace('年')
            // console.log(5)
            result = [
                new Date(parseInt(start),1,1),
                new Date(parseInt(end),11,31)
            ]
        }else{
            if(/年/.test(str)){
                let year = str.split('年')[0]
                str = str.replace(/[0-9]+年/, '')
                // console.log(str)
                if(/月/.test(str)){
                    let month = str.split('月')[0]
                    str = str.replace(/[0-9]+月/, '')
                    if(/日/.test(str)){
                        let day = str.split('日')[0]
                        result = [
                            new Date(parseInt(year),parseInt(month)-1,parseInt(day)),
                            new Date(parseInt(year),parseInt(month)-1,parseInt(day))
                        ]
                        // console.log(1)
                    }else{
                        // console.log(parseInt(year),parseInt(month))
                        result = [
                            new Date(parseInt(year),parseInt(month)-1,1),
                            new Date(parseInt(year),parseInt(month)-1,30)
                        ]
                        // console.log(2)
                    }
                }else{
                    result = [
                        new Date(parseInt(year),1,1),
                        new Date(parseInt(year),11,31)
                    ]
                    // console.log(3)
                }                
            }else{
                result = [
                    new Date(900,1,1),
                    new Date(1300,12,31)
                ]
                // console.log(4)
            }

        }
        // console.log(result)
        return result
    }

    twoDim2OneDim(dists){
        if(true){
            let results = hdsp.PivotMDS.project(
                dists,
                6, // number of pivots
                1  // output dimensionality
            );
            return results.map(element => element[0])
        }
    }

    render(){
        console.log('render')
        let show_people = this.state.show_people

        let time_scale = d3.scaleTime()
                    .domain([this.state.scale_start_time, this.state.scale_end_time])
                    .range([900,1300])
        // 重新计算地点坐标(有问题)
        let place2y = {}, place2xy = {}, all_places = new Set([]), index2place = {}, index = 0
        for(let index in show_people){
            // console.log(index)
            person = show_people[index]

            let timeLine = dataGetter.getPersonalTimeLineByName(person)
            console.log(person, timeLine)
            for(let i in timeLine){
                let place = timeLine[i]
                if (place.Detail) {
                    let place_name = place.Title.replace(/ *\(.*\)/,'')
                    all_places.add({ place_name: place_name, xy:[place.Latitude, place.Longitude]})
                }
            }
        }
        all_places = [...all_places]
        // console.log(all_places)

        let place_vecs = all_places.map(element => element.xy)
        all_places = all_places.map(element => element.place_name)

        place_vecs = this.twoDim2OneDim(place_vecs)

        place_vecs.map((element, index) => {
            place2y[all_places[index]] = element
        })
        // console.log(place2y)
        // console.log(Object.keys(place2y))
        // console.log(place2y)
        // console.log(show_people)
        let pointsData = show_people.map(person => {
            // console.log(person)
            let timeLine = dataGetter.getPersonalTimeLineByName(person)
            let tempTimeLine = []
            // let placeArray = []
            
            timeLine.map((place, index) => {
                let place_name = place['Title'].replace(/ *\(.*\)/,'')
                if(place['Detail']){
                    place['Detail'].map(element => {
                        tempTimeLine.push({
                            time_range: this.strToRange(element.time),
                            time_str: element.time,
                            place: place_name,
                            activity: element.activity
                        })
                    })                
                }
            })
            timeLine = tempTimeLine
            // console.log(timeLine)
            let data = timeLine.map(element=> {
                // var color = '#3876c2'
                // if(element.time_range[0] != element.time_range[1])
                //     color = '#afadad'
                // if (!place2y[element.place]) {
                //     console.log(element)
                // }
                if (time_scale(element.time_range[0])) {
                    // console.log(element, element.time_range[0], element.time_range[1], time_scale(element.time_range[0])) 
                    // if(place2y[element.place]){
                        // console.log(element)
                        return {
                            size: 1,
                            // color: color,
                            x: time_scale(element.time_range[0]),   //.valueof(),
                            y: place2y[element.place]?place2y[element.place]:-99, //place2xy[element.place][0] //
                            // activity: element.activity
                        }
                    // }
                }
            }).filter(element => element)
            data= data.sort((point1, point2) => {
                // if (point1.x == NaN || point2.x == NaN) {
                //     console.log(point1)
                // }
                return point2.x -point1.x   //需要改成头比尾
            })
            // pontsData.push(data)
            // console.log(data)
            return {data: data, person: person}
        })
        // pointsData = [{
        //     data: 
        //         [{x:1,y:0},
        //         {x:2, y:2}],
        //     person: 12
        // },
        // {
        //     data: 
        //         [{x:1,y:0},
        //         {x:2, y:2}],
        //     person: 14
        // }]
        // console.log(place2y)
        return (
            <div>
                <XYPlot
                width={this.props.width}
                height={this.props.height}
                // onMouseLeave={() => this.setState({value: false})}
                animation>
                    <XAxis
                        title="时间"
                    />
                    <YAxis
                        title="地点"
                        tickFormat={(d) => {
                            // console.log(d)
                            let nearest_index = 0
                            for(let i = 1; i<all_places.length; i++){
                                const dis = (i)=> Math.abs(place_vecs[i]-d)
                                if(dis(i)<dis(nearest_index))
                                    nearest_index = i
                            }
                            return all_places[nearest_index]
                        }}
                    />
                    {
                        pointsData.map(data => {
                            console.log(data)
                            return <LineMarkSeries 
                                data={data.data}
                                sizeRange={[1, 2]}
                                curve={'curveMonotoneX'}
                                key = {data.person}
                                // onNearestXY= {value => this.setState({value})}
                            />   
                        })
                    }
                </XYPlot>
            </div>
        )
    }
}
// {this.state.value ? 
//     <Hint 
//         value={this.state.value} 
//         horizontal= 'top'
//         vertical= 'right'
//     /> : 
//     null
// }
class person{
    constructor(){
        this.name = []
        this.id = []
        this.gender = '未知'

        this.birth_year = 0
        this.die_year = 0

        this.events = []
        this.relations = []
    }
}

class myTime{
    constructor(year, month, day, range){
        this.year = year
        this.month = month
        this.day = day
        this.range = range
    }
}
export default MainGraph;