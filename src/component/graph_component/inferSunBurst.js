import dataStore, { personManager, triggerManager, filtEvents, eventManager, eucDist, addrManager, timeManager, arrayAdd, simplStr, objectManager, dictCopy, sortBySimilar, ruleFilterWith } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import { Button, Card, Image, Container, Divider, Checkbox, Dropdown} from 'semantic-ui-react'
import tsnejs from '../../dataManager/tsne'

import {
    XYPlot,
    XAxis,
    YAxis,
    Hint,
    AreaSeries,
    LineMarkSeries,
    MarkSeries,
    LineSeries,
    Highlight,
    LabelSeries
  } from 'react-vis';

import stateManager from '../../dataManager/stateManager'
import { autorun, values } from 'mobx';
import cos_dist from 'compute-cosine-distance'
import { yellow } from 'ansi-colors';

const PI = Math.PI
class InferSunBurst extends React.Component{
    all_events = []
    center_event = undefined

    all_addrs = []
    all_triggers = []
    all_people = []
    all_years = []

    constructor(){
        super()
        this.state = {
            trigger_label_data: [],
            people_label_data: [],
            addr_label_data: [],
            year_label_data: [],

            label_data: [],
            center_event_label_data: [],

            selected_people: [],
            selected_years: [],
            selected_addrs: [],
            selected_triggers: [],

            hint_value: undefined,
        }
    }

    onFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            const need_refresh = stateManager.need_refresh
            this.loadData()
        }
    })

    loadNewEvent = autorun(()=>{
        // console.log(stateManager.selected_event)
        if (stateManager.is_ready) {
            let selected_event_id = stateManager.selected_event_id.get()
            // let selected_event = eventManager.get(selected_event_id)
            net_work.require('getAllRelatedEvents', {event_id:selected_event_id, depth:1, event_num:1000})
            .then(data=>{
                console.log(data)
                data = dataStore.processResults(data.data)
                let {events} = data
                let center_event = eventManager.get(selected_event_id)
                // console.log(center_event)
                this.all_events = dataStore.dict2array(events)
                if (!this.all_events.includes(center_event)) {
                    this.all_events.push(center_event)
                }
                this.center_event = center_event
                this.loadData()
            })
        }
    })

    loadData(){
        let {all_events, center_event} = this
        if (!center_event) {
            console.warn('center_event 不存在')
            return
        }
        let {prob_year, prob_addr, prob_person} = center_event
        const main_people = center_event.getPeople()

        // all_events = ruleFilterWith(all_events, ['y','t','a', 'p'])

        let all_triggers = [...new Set(ruleFilterWith(all_events, ['y','p','a']).map(event=> event.trigger))]
        // console.log(all_triggers)
        let trigger2sim = {}
        all_triggers.forEach(trigger=>{
            if (trigger.vec.length !== center_event.trigger.vec.length)
                return
            trigger2sim[trigger.id] = cos_dist(trigger.vec, center_event.trigger.vec)
        })
        all_triggers = all_triggers.sort((a,b)=> trigger2sim[a.id]-trigger2sim[b.id]).slice(0, 30)
        all_triggers = all_triggers.sort((a,b)=> a.name-b.name)

        let all_people = []
        ruleFilterWith(all_events, ['y','t','a']).forEach(event=>{
            let people = event.getPeople()
            all_people = [...all_people, ...people]
        })
        all_people = [...new Set(all_people)]
        let people2sim = {}
        all_people.forEach(person=>{
            const center_people = center_event.getPeople()
            people2sim[person.id] = center_people.reduce((total, center_person)=>{
                // console.log(total + cos_dist(person.vec, center_person.vec), total, center_people.length)
                return total + cos_dist(person.vec, center_person.vec)
            }, 0)/center_people.length
        })

        // let test_trigger = triggerManager.getByName('弹劾')[0]
        // let test = sortBySimilar(all_people, [center_event], [], 100)
        // console.log(test, test_trigger)

        // person_11645
        // console.log(people2sim['person_11645'], people2sim['person_3767'])
        all_people = all_people.sort((a,b)=> people2sim[a.id]-people2sim[b.id]).slice(0, 30)

        let all_addrs = []
        ruleFilterWith(all_events, ['y','t','p']).forEach(event=>{
            let addr = event.addrs
            all_addrs = [...all_addrs, ...addr]
        })
        all_addrs = [...new Set(all_addrs)]
        let addr2sim = {}
        all_addrs.forEach(addr=>{
            if (center_event.addrs.length!==0) {
                const center_addrs = center_event.addrs
                addr2sim[addr.id] = center_addrs.reduce((total, center_addr)=>{
                    return total + cos_dist(addr.vec, center_addr.vec)
                }, 0)/center_addrs.length
            }else{
                addr2sim[addr.id] = cos_dist(addr.vec, center_event.vec)
            }
        })
        all_addrs = all_addrs.sort((a,b)=> addr2sim[a.id]-addr2sim[b.id]).slice(0,30)

        let all_years = Object.keys(prob_year).map(year=> timeManager.get(year))
        // console.log(all_years, timeManager.id_set)
        all_years = all_years.sort((a,b)=> parseFloat(prob_year[b])-parseFloat(prob_year[a])).slice(0,30)

        const center_x = 0, center_y = 0

        const objects2Vec = (all_objects, start_angle, end_angle, center_index = undefined, center_vec = undefined, object_type, color) =>{
            start_angle += PI/20
            end_angle -= PI/20

            let vecs = all_objects.map(elm=> elm.toVec())
            if (center_vec) {
                vecs.push(center_vec)
                center_index = vecs.length-1
            }
            const myTsne = (vecs)=>{
                const opt = {
                    epsilon: 10,  // epsilon is learning rate (10 = default)
                    perplexity: 10, // roughly how many neighbors each point influences (30 = default)
                    dim: 1 // dimensionality of the embedding (2 = default)
                }
                let tsne = new tsnejs.tSNE(opt); // create a tSNE instance
                if (vecs.length===0) {
                    return []
                }
                tsne.initDataRaw(vecs);  //这里用dist会出问题
                for(var k = 0; k < 0; k++) {
                    tsne.step();
                }
    
                return  tsne.getSolution();
            }
    
            let angles = myTsne(vecs).map(elm=> elm[0])
            let min_angle = Math.min(...angles),
                max_angle = Math.max(...angles)

            angles = angles.map(elm=> (elm-min_angle)/(max_angle-min_angle)*2*PI)

            // console.log(new_vecs, vecs)
            // let center_index = all_objects.findIndex(elm=> elm===center_event.trigger)

            // let center_angle = angles[center_index]

            let dists = vecs.map(elm=> cos_dist(elm, vecs[center_index]) )
            let max_dist = Math.max(...dists.filter((elm,index)=> index!==center_index)),
                min_dist = Math.min(...dists.filter((elm,index)=> index!==center_index))
            dists = dists.map(elm => (elm-min_dist)/(max_dist-min_dist))

            angles[center_index] = Math.random()*(max_angle-min_angle)+min_angle
            let label_data = all_objects.map((elm, index)=>{
                let r = dists[index] + 0.3
                let angle = angles[index]*(end_angle-start_angle)/PI/2 + start_angle
                let x = center_x + r*Math.cos(angle), y = r*Math.sin(angle) + center_y
                let text_rotate = -angle/PI*180
                if (text_rotate<-90&& text_rotate>-270) {
                    text_rotate = 180+text_rotate
                }
                return {
                    x: x,
                    y: y,
                    rotation: text_rotate,
                    label: simplStr(elm.getName(), 4),
                    object_id: elm.id,
                    vec: vecs[index],
                    new_vec: angles[index],
                    object_type: object_type,
                    style: {
                        stroke: color,
                        cursor: "pointer",
                        fontSize: 30,
                        // opacity: 0.1
                    },
                }
                // return {
                //     x: vec[0],
                //     y: vec[1],
                //     label: simplStr(elm.getName(), 4),
                //     object_id: elm.id,
                //     vec: vecs[index],
                //     new_vec: new_vecs[index],
                // }
            })
            return label_data
        }

        const total_angle = 2*PI
        let stack_angle = 0
        let trigger_num = all_triggers.length, addr_num = all_addrs.length,  people_num = all_people.length, year_num = all_years.length
        let angle_per_object = total_angle/(trigger_num+addr_num+people_num+year_num)
        
        let center_people = center_event.getPeople()
        let center_people_vec = center_people.reduce((total, elm)=>{
            return arrayAdd(total, elm.vec)
        }, undefined)
        center_people_vec = center_people_vec.map(elm=> elm/center_people.length)

        let center_addr_vec = center_event.vec
        if (center_event.addrs.length>0) {
            center_addr_vec = center_event.addrs.reduce((total, elm)=>{
                return arrayAdd(total, elm.vec)
            }, undefined)
            center_addr_vec = center_addr_vec.map(elm=> elm/center_event.addrs.length)
        }
        let trigger_label_data = objects2Vec(all_triggers, stack_angle, stack_angle += trigger_num*angle_per_object, undefined, center_event.trigger.vec, 'trigger', '#f4cea3')
        let people_label_data = objects2Vec(all_people, stack_angle, stack_angle += people_num*angle_per_object, undefined, center_people_vec, 'people', '#9a8bb9')
        let addr_label_data = objects2Vec(all_addrs, stack_angle, stack_angle += addr_num*angle_per_object, undefined, center_addr_vec, 'addr', '#bfdda8')
        let year_label_data = objects2Vec(all_years, stack_angle, stack_angle += year_num*angle_per_object, undefined, center_event.toVec(), 'year', '#e29cae')

        this.all_triggers = all_triggers
        this.all_people = all_people
        this.all_triggers = all_triggers
        this.all_years = all_years
        // this.all_events = all_events

        let center_event_label_data = [{
            x: center_x, y: center_y, label: center_event.toText()
        }]
        
        this.setState({
            trigger_label_data: trigger_label_data,
            people_label_data: people_label_data,
            addr_label_data: addr_label_data,
            year_label_data: year_label_data,
            label_data: [...trigger_label_data, ...people_label_data, ...addr_label_data, ...year_label_data],
            center_event_label_data: center_event_label_data
        })
    }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    handleDrowdownChange = (event, {value, my_type})=>{
        // console.log(value, my_type)
        const ids = value
        // console.log(ids)
        if (my_type==='people') {
            this.setState({selected_people: ids.map(id=> personManager.get(id))})
            stateManager.setShowPeople(ids)
        }else if (my_type==='addr') {
            this.setState({selected_addrs: ids})
            stateManager.setShowAddrs(ids.map(id=> addrManager.get(id)))
        }else if (my_type==='year') {
            this.setState({selected_years: ids.map(id=> timeManager.get(id))})
            stateManager.setShowYears(ids)
        }else if (my_type==='trigger') {
            this.setState({selected_triggers: ids.map(id=> triggerManager.get(id))})
            stateManager.setShowYears(ids)
        }else{
            console.error(my_type, values, '没有对应的类型')
        }
    }

    render(){
        console.log('render triggerSunBurst')
        const {width, height} = this.props
        // const {center_event} = this.center_event
        const graph_width = width<height?width: height
        let {center_event_label_data, label_data, hint_value} = this.state
        let {selected_people, selected_addrs, selected_years, selected_triggers} = this.state
        let {all_addrs,all_triggers,all_people, all_years} = this
        // console.log(all_years)
        label_data = label_data.map(elm=>{
            if (hint_value && elm===hint_value) {
                // elm = dictCopy(elm)
                elm.style.opacity = 1
            }else{
                elm.style.opacity = 0.5
            }
            return elm
        })

        return (
            <div className='trigger_sunburst_graph' style={{width: width, height: height, position: 'absolute'}}>
                <XYPlot width={graph_width} height={graph_width} animation>
                    <LabelSeries
                    labelAnchorX = 'middle'
                    labelAnchorY = 'middle'
                    data={center_event_label_data}
                    allowOffsetToBeReversed
                    onValueClick={value=>{
                        console.log(value)
                    }}/>

                    <LabelSeries
                    labelAnchorX = 'middle'
                    labelAnchorY = 'middle'
                    data={label_data}
                    color='literal'
                    allowOffsetToBeReversed
                    onValueClick={value=>{
                        const {object_type, object_id} = value
                        if (object_type==='people') {
                            let elm = personManager.get(object_id)
                            if (!selected_people.includes(elm)) {
                                selected_people.push(elm)
                                this.setState({selected_people: selected_people})
                                stateManager.setShowPeople(selected_people.map(elm=> elm.id))
                                stateManager.addSelectedPeople(elm.id)
                            }
                        }else if (object_type==='addr') {
                            let elm = addrManager.get(object_id)
                            if (!selected_addrs.includes(elm)) {
                                selected_addrs.push(elm)
                                this.setState({selected_addrs: selected_addrs})
                                stateManager.setShowAddrs(selected_addrs.map(elm=> elm.id))
                            }
                        }else if (object_type==='year') {
                            let elm = timeManager.get(object_id)
                            if (!selected_years.includes(elm)) {
                                selected_years.push(elm)
                                this.setState({selected_years: selected_years})
                                stateManager.setShowYears(selected_years.map(elm=> elm.id))
                            }
                        }else if (object_type==='trigger') {
                            let elm = triggerManager.get(object_id)
                            if (!selected_triggers.includes(elm)) {
                                selected_triggers.push(elm)
                                // console.log(elm)
                                this.setState({selected_triggers: selected_triggers})
                                stateManager.setShowTriggers(selected_triggers.map(elm=> elm.id))
                            }
                        }else{
                            console.error(value, '没有对应的类型')
                        }
                    }}
                    onNearestXY={value=>{
                        // console.log(value)
                        this.setState({hint_value: value})
                    }}
                    />
                    {
                        // hint_value&&
                        // <Hint value={hint_value}>
                        //     <div style={{ fontSize: 8,background: 'black', padding: '10px'}}>
                        //     {objectManager.get(hint_value.object_id).getName()}
                        //     </div>
                        // </Hint>
                    }
                    {/* <XAxis/>
                    <YAxis/> */}
                </XYPlot>
                <div style={{height: height, width: width-graph_width-10, top: 0, left: graph_width+10, position: 'absolute', overflowY: 'auto'}}>
                    <Container fluid text textAlign='justified'>
                    <div style={{left: 0, top:30, position:'relative'}}></div>
                            <Dropdown 
                                fluid multiple search selection 
                                placeholder='人物'
                                my_type='people'
                                options={all_people.map(person=>{ return {'key': person.id, 'text': person.name, 'value':person.id}})}
                                value = {selected_people.map(person=> person.id)}
                                onChange={this.handleDrowdownChange}/>
                            <Dropdown 
                                fluid multiple search selection 
                                placeholder='地点'
                                my_type='addr'
                                options={all_addrs.map(elm=>{ return {'key': elm.id, 'text': elm.name, 'value':elm.id}})}
                                value = {selected_addrs.map(elm=> elm.id)}
                                onChange={this.handleDrowdownChange}/>
                            <Dropdown 
                                fluid multiple search selection 
                                placeholder='年份'
                                my_type='year'
                                options={all_years.map(elm=>{ return {'key': elm.id, 'text': elm.name, 'value':elm.id}})}
                                value = {selected_years.map(elm=> elm.id)}
                                onChange={this.handleDrowdownChange}/>
                            <Dropdown 
                                fluid multiple search selection 
                                placeholder='事件类型'
                                my_type='trigger'
                                options={all_triggers.map(elm=>{ return {'key': elm.id, 'text': elm.name, 'value':elm.id}})}
                                value = {selected_triggers.map(elm=> elm.id)}
                                onChange={this.handleDrowdownChange}/>
                    </Container>
                    {/* 计算方式 */}
                </div>
            </div>
        )
    }
}

export default InferSunBurst