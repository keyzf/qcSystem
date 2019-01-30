import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import React, { Component } from 'react'
import * as d3 from 'd3'
import vis from 'vis'
import moment from 'moment'
import 'vis/dist/vis.min.css'
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';
import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import {WhiskerSeries, AreaSeries, LineMarkSeries, VerticalGridLines , HorizontalGridLines, XAxis, YAxis} from 'react-vis'
import { set } from 'mobx';
import jsgraphs from 'js-graph-algorithms'

// 连接CBDB数据的
// import tsnejs from 'tsne'
import * as hdsp from "hdsp";
import { print } from 'util';
class MainGraph extends Component{
    constructor(){
        super()
        this.state = {
            peopleData: [], 
            allPeopleList: [],
            show_people_id:  ['643488'],  // , '孔武仲', '程颐', ,'苏辙', '苏轼'
            hintValue: undefined,
            scale_start_time: new Date(900, 0, 0, 0),
            scale_end_time: new Date(1300, 0, 0, 0),
        }

    }

    static get defaultProps() {
        return {
          width: 3000,
          height: 2000,
        };
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
    getDist(xy1, xy2){
        let d_x = xy1[0]-xy2[0]
        let d_y = xy1[1]-xy2[1]
        return Math.sqrt( d_x * d_x + d_y *d_y )
    }
    componentWillMount(){
        let show_people_id = this.state.show_people_id

        let time_scale = d3.scaleTime()
                    .domain([this.state.scale_start_time, this.state.scale_end_time])
                    .range([900,1300])

        let place2y = {}, all_places = new Set([]), place2xy = {}, place2count = {}

        show_people_id.forEach(id => {
            let data = dataGetter.getPersonalTimeLineByIdFromCBDB(id)
            if (data) {
                console.log(data)
                let timeLine = data.time_line
                let person = data.person
                
                timeLine = timeLine?timeLine:[]
                // console.log(person, timeLine)
                for(let time in timeLine){
                    let time_events = timeLine[time]
                    for (let place in time_events) {
                        const element = time_events[place];
                        let xy = element.coord
                        xy = xy.length==2?xy:[0,0]
                        xy = xy.map(element => element?parseInt(element):0)
                        all_places.add({ place_name: place, xy:xy})
                        place2xy[place] = xy
                    }
                }                
            }
        })
        // 暂时改为均等排序
        all_places = [...all_places]
        all_places.forEach(place => {
            place2count[place] = 1
        })
        // console.log(all_places)
        let place_vecs = all_places.map(element => element.xy)
        all_places = all_places.map(element => element.place_name)

        // place_vecs = this.twoDim2OneDim(place_vecs)

        all_places.forEach((place, index)=>{
            place2y[place] = index
            place_vecs[index] = index
        })
        console.log(place2y)
        // place_vecs.forEach((element, index) => {
        //     place2y[all_places[index]] = element
        // })



        // console.log(place2y)
        var MUST_POSITIVE = ['峡江', '眉山']
        for (let index = 0; index < MUST_POSITIVE.length; index++) {
            const element = MUST_POSITIVE[index];
            if (place2y[element] && place2y[element]<0) {
                for (let key in place2y) {
                    place2y[key] = -place2y[key]
                }
                break
            }
        }


        let pointsData = show_people_id.map(id => {
            let data = dataGetter.getPersonalTimeLineByIdFromCBDB(id)
            
            if (data) {
                console.log(data)
                let timeLine = data.time_line
                let person = data.person
                let point_data = []
                console.log(timeLine)
                for (let time in timeLine) {
                    const time_period =timeLine[time];
                    // console.log(time)
                    for (let place in time_period) {
                        const element = {};
                        element.x = time_scale(time_period[place].time)
                        element.y = place2y[place]
                        console.log(place2y[place], element.y)
                        element.size = time_period[place].event_count    
                        // element.activities = ''  
                        // element.x = 0
                        // element.y = 0
                        // element.y0 = 0 
                        if (element.y>all_places.length) {
                            console.log(element)
                        }else{
                            point_data.push(element)
                        }        
                    }
                }              
                point_data= point_data.sort((point1, point2) => {
                    return point2.x -point1.x   //需要改成头比尾
                })
                console.log(point_data)
                return {data: point_data, person: person.c_name_chn}
            }
            return undefined
        }).filter(element => element)
        console.log(pointsData)

        function deepClone(obj){
            let objClone = Array.isArray(obj)?[]:{};
            if(obj && typeof obj==="object"){
                for(let key in obj){
                    if(obj.hasOwnProperty(key)){
                        //判断ojb子元素是否为对象，如果是，递归复制
                        if(obj[key]&&typeof obj[key] ==="object"){
                            objClone[key] = deepClone(obj[key]);
                        }else{
                            //如果不是，简单复制
                            objClone[key] = obj[key];
                        }
                    }
                }
            }
            return objClone;
        }    

        let flowData = pointsData.map((pointData, index)=>{
            let person = pointData.person
            let data = pointData.data.map(element => {
                // console.log(element)
                element = deepClone(element)
                let flow_height = element.size*2
                let center_y = element.y
                element.y =  center_y - flow_height
                element.center_y = center_y
                element.y0 =  center_y + flow_height                
                return element
            })
            return {data: data, person: person}
        }).map( (pointData, index)=>{
            let tempFlowData = []
            let data = pointData.data
            let person = pointData.person
            data.forEach((element, index) => {
                let next = data[index+1]
                tempFlowData.push(element)
                if (next) {
                    tempFlowData.push(
                        {
                            x: (element.x + next.x)/2,   //.valueof(),
                            y: (element.center_y + next.center_y)/2, //place2xy[element.place][0] //
                            y0: (element.center_y + next.center_y)/2,
                            person: person,
                        }
                    )
                }                
            })
            // console.log(tempFlowData)
            return {data: tempFlowData, person: person}
        })
        // flowData = []
        this.setState({
            pointsData: pointsData,
            all_places: all_places,
            place_vecs: place_vecs,
            flowData: flowData
        })
        // console.log(place_vecs, all_places)
    }

    render(){
        console.log('render main graph')
        let pointsData = this.state.pointsData
        let flowData = this.state.flowData
        let all_places = this.state.all_places
        let show_people = this.state.show_people_id
        let place_vecs = this.state.place_vecs
        let change_selectedValue = value =>  {
            console.log(value)
            this.setState({hintValue:value})
        }
        // console.log(flowData)
        console.log(pointsData)
        return (
            <div>
                <XYPlot
                width={this.props.width}
                height={this.props.height}
                yDomain={[0, 100]}
                // onMouseLeave={() => this.setState({hintValue: undefined})}
                animation>

                    <XAxis
                        title="时间"
                    />
                    {/* <YAxis
                        title="地点"
                        tickValues={place_vecs}
                        tickFormat={(d,i) => i%1===0?all_places[i] : ''}
                    /> */}
                    <YAxis
                        title="地点"
                        tickValues={all_places.map((place,index)=>{
                            // console.log(place, index)
                            return index
                        })}
                        tickFormat={(d,i) => {
                            // console.log(d,i, all_places[d])
                            return all_places[d]
                        }}
                    />
                    <YAxis
                        title="地点"
                    />
                    {
                        pointsData.map(data => {
                            // console.log(data)
                            // console.log(this.state.hintValue)
                            return <LineMarkSeries
                                data={data.data}
                                // size = {2}
                                sizeRange={[3, 20]}
                                // curve={'curveCardinal'}
                                curve={'curveMonotoneX'}
                                key = {data.person + '_LineMark'}
                                onValueClick= {change_selectedValue}
                            />   
                        })
                    }
                    {
                        flowData.map(data => {
                            return <AreaSeries 
                                data={data.data} 
                                curve={'curveMonotoneX'} 
                                opacity = {0.8}
                                key = {data.person + '_FlowSeries'}
                                getNull={(d) => d.y !== null && d.x !== null && d.y0 !== null}
                            />;
                        })
                    }
                    {/* {
                        pointsData.map(data => {
                            // console.log(data)
                            return <WhiskerSeries
                                data={data.data}
                                sizeRange={[1, 2]}
                                color='black'
                                key = {data.person + '_Whisker'}
                            />   
                        })
                    } */}
                    <VerticalGridLines />
                    <HorizontalGridLines />
                    {this.state.hintValue ? <Hint value={this.state.hintValue.y} /> : null}
                </XYPlot>
            </div>
        )
    }
}

export default MainGraph;