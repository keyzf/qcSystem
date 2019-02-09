import dataGetter from '../../dataManager/dataGetter2'
import dataStore, { personManager } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import {
    XYPlot,
    XAxis,
    YAxis,
    // VerticalGridLines,
    // HorizontalGridLines,
    // VerticalBarSeries,
    // VerticalBarSeriesCanvas,
    // DiscreteColorLegend,
    // Hint,
    // AreaSeries,
    LineMarkSeries,
    // LineSeries
  } from 'react-vis';

import {observer, inject} from 'mobx-react';
import {observable, action, autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager'

// 2019/2/8 可以选择人物
@observer 
class LifeLikePaint extends Component{
    constructor(){
        super()
        this.state = {
            // selectedPeople: [],
            line_datas: [],
            showEventMark: undefined
        }
        
    }
    
    _changeSelectedPeople = autorun(()=>{
        let selectedPeople = stateManager.selected_people
        if (stateManager.is_ready) {
            console.log(selectedPeople)
            console.log('_changeSelectedPeople')
            fetch('http://localhost:8000/getPersonEvents/?person_id=3767',{
                method:'GET',
                headers:{
                    'Content-Type':'application/json;charset=UTF-8'
                },
                cache:'default'
            })
            .then(res =>res.json())
            .then((data) => {
                data = dataStore.processResults(data)
                this.loadData(data)
                // this.setState({row_data:data})
            })            
        }
    })

    calculateScore(events, method, selected_person){
        let total_score = events.reduce((total, event) => {
            // console.log(total, event, event.getScore(selected_person))
            return total+event.getScore(selected_person)
        }, 0)
        return total_score/events.length * Math.log(events.length+1)
    }

    loadData(data){
        let line_datas = []

        // console.log(data)
        let selected_person = personManager.get('3767')
        let year2events = selected_person.year2events()
        let events = selected_person.getCertainEvents()
        // console.log(selected_person, year2events, events)

        let years = Object.keys(year2events).map(year=> parseInt(year))
        years = years.sort((a,b)=> a-b)
        let max_year = Math.max(...years)
        let min_year = Math.min(...years)

        let yearScale = year=> year
        let scoreScale = score => score
        let eventNumScale = num => Math.log(num)

        //暂时只画一个
        let line_data = years.map(year=>{
            let events = year2events[year]
            let score = this.calculateScore(events, '平均乘log(数量)', selected_person)
            return {
                x: yearScale(year),
                y: scoreScale(score),
                size: eventNumScale(events.length),
                events: events
            }
        })
        line_datas.push({
            type:  '平均乘log(数量)',
            person: selected_person,
            line_data: line_data
        })
        this.setState({line_datas: line_datas})
        console.log(line_data)
    }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    randerLifeLine = line_datas => 
        line_datas.map(elm=>                
            <LineMarkSeries
                key = {elm.person.id + '_' + elm.type}
                sizeRange = {[1,10]}
                data={elm.line_data}
                curve={'curveMonotoneX'}
                onValueClick={this.handleEventMarkClick}
            />
        )


    handleEventMarkClick = (value) => {
        console.log(value)
        this.setState({showEventMark:value})
    }
    render(){
        console.log('render lifeLikePaint 主视图')
        let {line_datas} = this.state
        // console.log(line_datas, this.state.line_datas)
        console.log(this.randerLifeLine(line_datas))
        console.log(line_datas[0])

        return (
            <XYPlot
            width={this.props.width}
            height={this.props.height}
            // xDomain={[1036,1200]}
            >
            {
                this.randerLifeLine(line_datas)
            }
            <XAxis/>
            <YAxis/>
            </XYPlot>
        )
    }
}

export default LifeLikePaint