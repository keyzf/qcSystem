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
import jsgraphs from 'js-graph-algorithms'

// import tsnejs from 'tsne'
import * as hdsp from "hdsp";
class MainGraph extends Component{
    constructor(){
        super()
        this.state = {
            peopleData: [], 
            allPeopleList: [],
            show_people:  ['孔文仲','孔武仲', '程颐', '孔文仲','苏辙', '苏轼' ],  // 
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
    getDist(xy1, xy2){
        let d_x = xy1[0]-xy2[0]
        let d_y = xy1[1]-xy2[1]
        return Math.sqrt( d_x * d_x + d_y *d_y )
    }
    componentWillMount(){
        let colors = []
        let show_people = this.state.show_people

        let time_scale = d3.scaleTime()
                    .domain([this.state.scale_start_time, this.state.scale_end_time])
                    .range([900,1300])

        let place2y = {}, all_places = new Set([]), place2xy = {}, place2count = {}


        for(let index in show_people){
            // console.log(index)
            let person = show_people[index]

            let timeLine = dataGetter.getPersonalTimeLineByName(person)
            // console.log(person, timeLine)
            for(let i in timeLine){
                let place = timeLine[i]
                if (place.Detail) {
                    let place_name = place.Title.replace(/ *\(.*\)/,'')
                    all_places.add({ place_name: place_name, xy:[place.Latitude, place.Longitude]})
                    place2xy[place_name] = [place.Latitude, place.Longitude]
                }
            }
        }
        all_places = [...all_places]
        // console.log(all_places)
        all_places.forEach(place => {
            place2count[place] = 0
        })
        let place_vecs = all_places.map(element => element.xy)
        all_places = all_places.map(element => element.place_name)

        place_vecs = this.twoDim2OneDim(place_vecs)

        place_vecs.forEach((element, index) => {
            place2y[all_places[index]] = element
        })

        // 构建无向加权图,现在还没有考虑无联通怎么办
        let g = new jsgraphs.WeightedGraph(all_places.length);

       
        let pointsData = show_people.map((person,i) => {
            let timeLine = dataGetter.getPersonalTimeLineByName(person)
            let tempTimeLine = []
            let person_added_place = new Set()
            timeLine.forEach((place, index) => {
                let place_name = place['Title'].replace(/ *\(.*\)/,'')
                if(place['Detail']){
                    place['Detail'].forEach(element => {
                        tempTimeLine.push({
                            time_range: this.strToRange(element.time),
                            time_str: element.time,
                            place: place_name,
                            activity: element.activity,
                        })
                    })
                    place2count[place_name] += 1                
                }
            })
            timeLine = tempTimeLine

            let data = timeLine.map(element=> {
                if (time_scale(element.time_range[0])) {
                        let time_range = element.time_range.map(time => Date.parse(time))
                        let middle_time = new Date( (time_range[0]+time_range[1])/2)
                        return {
                            size:  show_people.length - i,
                            xVariance: time_scale(middle_time)-time_scale(element.time_range[0]), 
                            yVariance: 0,
                            x: time_scale(element.time_range[0]),   //.valueof(),
                            y: place2y[element.place]?place2y[element.place]:-99, //place2xy[element.place][0] //
                            activity: element.activity,
                            place: element.place,
                            place_index: all_places.indexOf(element.place),
                            person: person
                        }
                }
            }).filter(element => element)
            data= data.sort((point1, point2) => {
                return point2.x -point1.x   //需要改成头比尾
            })

            // 暂用删除重叠点
            let temp_data = []
            data.forEach((element, index) => {
                let last_index = temp_data.length-1
                if (temp_data[last_index] && element.x===temp_data[last_index].x  && element.y===temp_data[last_index].y){
                    
                }else{
                    temp_data.push(element)
                }
            })
            data = temp_data

            // 添加图
            let all_added_place = new Set()
            data.forEach((element,index) => {
                // console.log(element,index)
                if(index!==0){
                    let place = element.place
                    let former_place = data[index-1].place
                    g.addEdge(new jsgraphs.Edge(all_places.indexOf(place), all_places.indexOf(former_place), this.getDist( place2xy[place], place2xy[former_place]) / Math.sqrt(place2count[place] + place2count[former_place]) ));
                }
                person_added_place.add(index )
            })
            // 假如非联通将其联通
            if (all_added_place.length != 0) {
                let is_connected = false
                person_added_place.forEach(place => {
                    // console.log(place)
                    if (all_added_place.has(place)) {
                        is_connected = true
                    }
                })       
                if (!is_connected) {
                    let min_place = -1, min_target_place = -1, min_dist = 9999999
                    person_added_place.forEach((place1,index1) => {
                        all_added_place.forEach((place2, index2) => {
                            let dist = this.getDist(place2xy[place1], place2xy[place2])
                            if (min_dist > dist) {
                                min_place = index1
                                min_target_place = index2
                                min_dist = dist
                            }
                        })
                    })
                    if (min_dist!==9999999) {
                        g.addEdge(new jsgraphs.Edge(min_place, min_target_place, this.getDist( place2xy[all_places[min_place]], place2xy[all_places[min_target_place]])));
                    }
                }       
            }
            return {data: data, person: person}
        })
        console.log(g)
        var kruskal = new jsgraphs.KruskalMST(g);
        console.log(kruskal)
        var mst = kruskal.mst;
        // for(var i=0; i < mst.length; ++i) {
        //     var e = mst[i];
        //     var v = e.either();
        //     var w = e.other(v);
        //     console.log('(' + all_places[v] + ', ' + all_places[w] + '): ' + e.weight);
        // }
        // 暂定随机找到中心点
        let center_place_index = all_places.indexOf('西安') //Math.floor(Math.random()*all_places.length);   //

        console.log(center_place_index, all_places[center_place_index])

        // 递归遍历生成直线,之后还应该对排序做一个优化
        let new_place_array = []
        let used_v = []
        let itr_push = this_place_index => {
            used_v.push(this_place_index)
            let neighbors = []
            mst.forEach((edge, index)=>{
                let v = edge.either();
                let w = edge.other(v);
                if ( v===this_place_index) {
                    if (!used_v.includes(w)) {
                        neighbors.push(w)
                    }
                }else if ( w === this_place_index && !used_v.includes(v))
                    neighbors.push(v)
            })
            // 针对子节点做排序，需要优化，暂定之前的聚类
            neighbors.push(this_place_index)
            neighbors.sort(
                (p_i1, p_i2) => 
                place2y[all_places[p_i1]] - place2y[all_places[p_i2]]
            )
            // console.log(neighbors)
            neighbors.forEach(element => {
                if (element===this_place_index) {
                    new_place_array.push(this_place_index)
                }else{
                    itr_push(element)
                }
            })
            
        }
        itr_push(center_place_index)
        console.log(new_place_array)

        // 重新设置data的y值
        pointsData = pointsData.map(element=>{
            element.data = element.data.map(points=> {
                points.y = new_place_array.indexOf(points.place_index)
                // if (points.y===-1) {
                //     console.log(points)
                // }
                // console.log(points.y)
                return points
            })
            return element
        })


        this.setState({
            pointsData: pointsData,
            all_places: all_places,
            place_vecs: place_vecs,
            new_place_array: new_place_array
        })
        // console.log(place_vecs, all_places)
    }

    render(){
        console.log('render main graph')
        let pointsData = this.state.pointsData
        let all_places = this.state.all_places
        let show_people = this.state.show_people
        let place_vecs = this.state.place_vecs
        let new_place_array = this.state.new_place_array
        let change_selectedValue = value =>  this.setState({hintValue:value})
        return (
            <div>
                <XYPlot
                width={this.props.width}
                height={this.props.height}
                // onMouseLeave={() => this.setState({hintValue: undefined})}
                animation>

                    <XAxis
                        title="时间"
                    />
                    {/* <YAxis
                        title="地点"
                        tickValues={place_vecs}
                        tickFormat={(d,i) => i%6===0?all_places[i] : ''}
                    /> */}
                    <YAxis
                        title="地点"
                        tickFormat={ i => all_places[new_place_array[i]] }
                    />
                    {
                        pointsData.map(data => {
                            // console.log(data)
                            // console.log(this.state.hintValue)
                            return <LineMarkSeries
                                data={data.data}
                                size = {2}
                                // sizeRange={[5, 5+show_people.length*2]}
                                // curve={'curveCardinal'}
                                curve={'curveMonotoneX'}
                                key = {data.person + '_LineMark'}
                                onValueClick= {change_selectedValue}
                            />   
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
                    {this.state.hintValue ? <Hint value={this.state.hintValue} /> : null}
                </XYPlot>
            </div>
        )
    }
}

class TempGraph extends Component{

    render(){
        console.log('tempGraph')
        var pointsData = this.props.pointsData
        let change_selectedValue = value =>  this.props.parentNode.setState({hintValue:value})
        console.log(pointsData)
        return (
            <g>

            </g>
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