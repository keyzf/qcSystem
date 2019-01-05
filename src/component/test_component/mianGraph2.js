                        import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import React, { Component } from 'react'
import * as d3 from 'd3'
import vis from 'vis'
import moment from 'moment'
import 'vis/dist/vis.min.css'
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import {WhiskerSeries, LineMarkSeries, VerticalGridLines , HorizontalGridLines, XAxis, YAxis} from 'react-vis'
import { set } from 'mobx';
// import tsnejs from 'tsne'
import * as hdsp from "hdsp";
class MainGraph extends Component{
    constructor(){
        super()
        this.state = {
            peopleData: [], 
            allPeopleList: [],
            show_people: ['苏轼', '杨万里', '程颐', '孔文仲', '苏辙', '孔武仲'],
            hintValue: undefined,
            scale_start_time: new Date(900, 0, 0, 0),
            scale_end_time: new Date(1300, 0, 0, 0),
        }

    }

    static get defaultProps() {
        return {
          width: 3000,
          height: 1200,
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

    componentWillMount(){
        let colors = []
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
            // console.log(person, timeLine)
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
                        let time_range = element.time_range.map(time => Date.parse(time))
                        let middle_time = new Date( (time_range[0]+time_range[1])/2)
                        // console.log(element.time_range, middle_time)
                        return {
                            size: 1,
                            // color: color,
                            xVariance: time_scale(middle_time)-time_scale(element.time_range[0]), 
                            yVariance: 0,
                            x: time_scale(element.time_range[0]),   //.valueof(),
                            y: place2y[element.place]?place2y[element.place]:-99, //place2xy[element.place][0] //
                            activity: element.activity,
                            // color: Math.random(),
                            // stroke: '#' + Math.ceil(Math.random()*10000000)
                        }
                    // }
                }
            }).filter(element => element)
            data= data.sort((point1, point2) => {
                return point2.x -point1.x   //需要改成头比尾
            })

            // 暂用删除重叠点的店
            let temp_data = []
            data.forEach((element, index) => {
                if (temp_data[temp_data.length-1] && element.x===temp_data[temp_data.length-1].x  && element.y===temp_data[temp_data.length-1].y){
                    
                }else{
                    temp_data.push(element)
                }
            })
            data = temp_data
            // pontsData.push(data)
            // console.log(data)
            return {data: data, person: person}
        })
        this.setState({
            pointsData: pointsData,
            all_places: all_places,
            place_vecs: place_vecs
        })
        // console.log(place_vecs, all_places)
    }

    render(){
        console.log('render main graph')
        let pointsData = this.state.pointsData
        let all_places = this.state.all_places
        let place_vecs = this.state.place_vecs
        let change_selectedValue = value =>  this.setState({hintValue:value})
        return (
            <div>
                <XYPlot
                width={this.props.width}
                height={this.props.height}
                onMouseLeave={() => this.setState({hintValue: undefined})}
                animation>
                    <XAxis
                        title="时间"
                    />
                    <YAxis
                        title="地点"
                        tickValues={place_vecs}
                        tickFormat={(d,i) => i%6==0?all_places[i] : ''}
                    />
                    {
                        pointsData.map(data => {
                            // console.log(data)
                            return <LineMarkSeries 
                                data={data.data}
                                sizeRange={[1, 2]}
                                curve={'curveMonotoneX'}
                                key = {data.person + '_LineMark'}
                                onNearestXY= {change_selectedValue}
                            />   
                        })
                    }
                    {
                        pointsData.map(data => {
                            // console.log(data)
                            return <WhiskerSeries
                                data={data.data}
                                sizeRange={[1, 2]}
                                color='black'
                                curve={'curveMonotoneX'}
                                key = {data.person + '_Whisker'}
                            />   
                        })
                    }
                    {this.state.hintValue ? <Hint value={this.state.hintValue} /> : null}
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