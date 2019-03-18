import dataStore, { personManager, triggerManager, filtEvents, eventManager, eucDist, hasSimElmIn, addrManager, timeManager, arrayAdd, simplStr, objectManager, dictCopy, sortBySimilar, ruleFilterWith, normalizeVec } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import { Button, Card, Image, Container, Divider, Checkbox, Dropdown, DimmerInner, Menu} from 'semantic-ui-react'
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
import { link } from 'fs';

const PI = Math.PI
const inner_radius = 0.4 //圆的内轮廓

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
            event_label_data: [],
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
        const center_people = center_event.getPeople()

        // all_events = ruleFilterWith(all_events, ['y','t','a', 'p'])

        let all_triggers = [...new Set(ruleFilterWith(all_events, ['y','p','a']).map(event=> event.trigger))]
        // console.log(all_triggers)
        let trigger2sim = {}
        all_triggers.forEach(trigger=>{
            if (trigger.vec.length !== center_event.trigger.vec.length)
                return
            trigger2sim[trigger.id] = cos_dist(trigger.vec, center_event.trigger.vec)
        })
        all_triggers = all_triggers.sort((a,b)=> trigger2sim[a.id]-trigger2sim[b.id]).slice(0, 15)
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

        all_people = all_people.sort((a,b)=> people2sim[a.id]-people2sim[b.id]).slice(0, 15)

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
        all_addrs = all_addrs.sort((a,b)=> addr2sim[a.id]-addr2sim[b.id]).slice(0,15)

        let all_years = new Set()
        all_events.forEach(event=>{
            all_years.add(event.time_range[0])
            all_years.add(event.time_range[1])
        })
        all_years = [...all_years].map(year=> timeManager.get(year))
        // Object.keys(prob_year)
        // console.log(all_years, timeManager.id_set)
        all_years = all_years.sort((a,b)=> parseFloat(prob_year[b])-parseFloat(prob_year[a])).slice(0,15)

        const center_x = 0, center_y = 0

        const myTsne = (vecs, dim=1)=>{
            const opt = {
                epsilon: 10,  // epsilon is learning rate (10 = default)
                perplexity: 10, // roughly how many neighbors each point influences (30 = default)
                dim: dim // dimensionality of the embedding (2 = default)
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

        const objects2Vec = (all_objects, start_angle, end_angle, center_index = undefined, center_vec = undefined, object_type, color) =>{
            start_angle += PI/20
            end_angle -= PI/20

            let vecs = all_objects.map(elm=> elm.toVec())
            if (center_vec) {
                vecs.push(center_vec)
                center_index = vecs.length-1
            }

    
            let angles = myTsne(vecs).map(elm=> elm[0])
            let min_angle = Math.min(...angles),
                max_angle = Math.max(...angles)

            // console.log(max_angle, min_angle, angles)
            angles = angles.map(elm=> (elm-min_angle)/(max_angle-min_angle))

            // console.log(new_vecs, vecs)
            // let center_index = all_objects.findIndex(elm=> elm===center_event.trigger)

            // let center_angle = angles[center_index]

            let dists = vecs.map(elm=> cos_dist(elm, vecs[center_index]) )
            // let max_dist = Math.max(...dists.filter((elm,index)=> index!==center_index)),
            //     min_dist = Math.min(...dists.filter((elm,index)=> index!==center_index))
            // dists = dists.map(elm => (elm-min_dist)/(max_dist-min_dist))
            let sort_dists = [...dists].sort((a,b)=> a-b)
            dists = dists.map(dist=> sort_dists.findIndex(elm=> elm===dist)/dists.length)

            angles[center_index] = Math.random()*(max_angle-min_angle)+min_angle
            let sort_angles = [...angles].sort((a,b)=> a-b)
            // console.log(angles, sort_angles)
            angles = angles.map(angle=> sort_angles.findIndex(elm=> elm===angle)/angles.length)
            // console.log(angles)
            let label_data = all_objects.map((elm, index)=>{
                // 直径应该更加均匀
                let radius = dists[index] * (1-inner_radius) + inner_radius
                let angle = angles[index]*(end_angle-start_angle) + start_angle
                let x = center_x + radius*Math.cos(angle), y = radius*Math.sin(angle) + center_y
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
                    links: [],
                    style: {
                        stroke: color,
                        cursor: "pointer",
                        fontSize: 12,
                        opacity: 0.5,
                    },
                }
            })
            return label_data
        }

        const total_angle = 2*PI
        let stack_angle = 0
        let trigger_num = all_triggers.length, addr_num = all_addrs.length,  people_num = all_people.length, year_num = all_years.length
        let angle_per_object = total_angle/(trigger_num+addr_num+people_num+year_num)
        
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
        
        let label_data = [...trigger_label_data, ...people_label_data, ...addr_label_data, ...year_label_data]
        let id2label = {}
        label_data.forEach(elm=>{
            id2label[elm.object_id] = elm
        })

        this.all_triggers = all_triggers
        this.all_people = all_people
        this.all_triggers = all_triggers
        this.all_years = all_years
        this.all_events = all_events

        let center_event_label_data = [{
            x: center_x, y: center_y, label: center_event.toText()
        }]
        
        let left_events = []   //跟剩下的有关的事件
        let event2links = {}
        all_events.forEach(event=>{
            let links = []   //记录了事件连接的点
            if (all_triggers.includes(event.trigger)) {
                links.push(id2label[event.trigger.id])
            }
            event.getPeople().forEach(person=>{
                if (all_people.includes(person)) {
                    links.push(id2label[person.id])
                }
            })
            event.addrs.forEach(addr=>{
                if (all_addrs.includes(addr)) {
                    links.push(id2label[addr.id])
                }
            })
            if(event.isTimeCertain()){
                let year = event.time_range[0]
                year = timeManager.get(year)
                if (all_years.includes(year)) {
                    links.push(id2label[year.id])
                }
            }
            if (links.length>1) {
                left_events.push(event)
                event2links[event.id] = links.filter(link=> link)
            }
        })

        let event_label_data = []
        // let vecs = left_events.map(elm => elm.vec)
        // let new_vecs = myTsne(vecs, 2)
        // new_vecs = normalizeVec(new_vecs)
        // console.log(new_vecs)

        event_label_data = left_events.map((event, index)=>{
            const links = event2links[event.id]
            let x = links.reduce((total,elm)=> total+elm.x, 0)/links.length
            let y = links.reduce((total,elm)=> total+elm.y, 0)/links.length
            let dist = eucDist([x,y], [center_x, center_y])
            if (dist> inner_radius*inner_radius) {
                x = x*inner_radius/dist * (1-Math.random()/3)
                y = y*inner_radius/dist * (1-Math.random()/3)
            }
            if (event===center_event) {
                x = 0
                y = 0
            }
            return {
                x: x,
                y: y,
                label: event.toText(),
                object_id: event.id,
                opacity: 0.5,
                links: links,
                style: {
                    // stroke: color,
                    cursor: "pointer",
                    fontSize: 20,
                    opacity: 0.5,
                },
            }
        })


        event_label_data.forEach((elm,index)=>{
            const {links} = elm
            links.forEach(object=>{
                object.links.push(index)
            })
        })

        // console.log(left_events)

        this.setState({
            trigger_label_data: trigger_label_data,
            people_label_data: people_label_data,
            addr_label_data: addr_label_data,
            year_label_data: year_label_data,
            label_data: label_data,
            center_event_label_data: center_event_label_data,
            event_label_data: event_label_data,
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
        const {center_event} = this
        const graph_width = width<height?width: height
        let {center_event_label_data, label_data, hint_value, event_label_data} = this.state
        let {selected_people, selected_addrs, selected_years, selected_triggers} = this.state
        let {all_addrs,all_triggers,all_people, all_years} = this
        // console.log(all_years)
        label_data = label_data.map(elm=>{
            if (hint_value && elm===hint_value) {
                elm.style.opacity = 1
            }else{
                elm.style.opacity = 0.5
            }
            return elm
        })

        let links_datas = []
        let show_event_label_data = []
        if (hint_value) {
            let links = hint_value.links.map(index => event_label_data[index]).filter(elm=>elm)
            links.forEach(event_label=>{
                show_event_label_data.push(event_label)
                event_label.links.forEach(elm=>{
                    let {x,y} = elm
                    if (elm!==hint_value) {
                        elm.style.opacity = 1
                        let x_string = x.toString()
                        let random1 = parseFloat(x_string.slice(x_string.length-2,x_string.length-1)),
                            random2 = parseFloat(x_string.slice(x_string.length-2,x_string.length-1))

                        random1 = isNaN(random1)?0.2:random1/20
                        random2 = isNaN(random2)?0.001:random1/100*eucDist([x,y], [event_label.x,event_label.y])
                        let center_x = (event_label.x*random1 + x*(1-random1))/2
                        let center_y = (event_label.y*random1 + y*(1-random1))/2
                        links_datas.push([
                            {x:x, y:y},
                            {x: center_x , y: center_y+random2},
                            {x:event_label.x, y:event_label.y}
                        ])                         
                    }
                })
            })
        }
        console.log(links_datas)
        let year_options = all_years.map(elm => {return {'key': elm.id, 'text': elm.name, 'value':elm.id}})
        let person_options = all_people.map(elm => {return {'key': elm.id, 'text': elm.name, 'value':elm.id}})
        let addr_options = all_addrs.map(elm => {return {'key': elm.id, 'text': elm.name, 'value':elm.id}})
        let trigger_options = all_triggers.map(elm => {return {'key': elm.id, 'text': elm.name, 'value':elm.id}})

        const left_panel_width = width-graph_width-10
        return (
            <div className='trigger_sunburst_graph' style={{width: width, height: height, position: 'absolute'}}>
                <XYPlot width={graph_width} height={graph_width}D>
                    <LabelSeries
                    labelAnchorX = 'middle'
                    labelAnchorY = 'middle'
                    data={center_event_label_data}
                    allowOffsetToBeReversed
                    animation/>

                    <MarkSeries
                    data={show_event_label_data}
                    onValueClick={value=>{
                        console.log(value)
                    }}/>

                    {
                        links_datas.map((elm,index)=>
                        <LineSeries
                        key={index}
                        color='#1234'
                        data={elm}
                        curve={d3.curveCatmullRom.alpha(0.1)}/>
                        )
                    }
                    <LabelSeries
                    labelAnchorX = 'end'
                    labelAnchorY = 'end'
                    animation
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
                        if (value!==hint_value) {
                            this.setState({hint_value: value})
                        }
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
                <div style={{height: height, width: left_panel_width, top: 0, right: 0, position: 'absolute', overflowY: 'auto'}}>
                    <Container fluid text textAlign='justified'>
                    <div style={{left: 0, top:30, position:'relative'}}></div>
                            {
                                center_event && 
                                // 修改事件
                                <Container>
                                <div style={{width: left_panel_width, top: 0, right: 0}}>
                                    <div style={{width: left_panel_width, top: 0, right: 0, position:'relative', height: 50}}>
                                        <div style={{width: left_panel_width/4, top: 0, left: 0, position: 'absolute'}}>
                                            <Dropdown 
                                            fluid search selection 
                                            placeholder='起始时间'
                                            options={year_options}
                                            value = {center_event.time_range[0].toString()}
                                            onChange={(event,{value})=>{
                                                let time = parseFloat(value)
                                                if (time!==center_event.time_range[0]) {
                                                    center_event.time_range[0] = time
                                                    stateManager.refresh()
                                                }
                                            }}/>
                                        </div>
                                        <div style={{width: left_panel_width/4, top: 0, left: left_panel_width/4, position: 'absolute'}}>
                                            <Dropdown 
                                            fluid search selection 
                                            placeholder='结束时间'
                                            options={year_options}
                                            value = {center_event.time_range[1].toString()}
                                            onChange={(event,{value})=>{
                                                let time = parseFloat(value)
                                                if (time!==center_event.time_range[1]) {
                                                    center_event.time_range[1] = time
                                                    stateManager.refresh()
                                                }
                                            }}/>
                                        </div>
                                    </div>
                                    {
                                        center_event.roles.map((elm,index)=>
                                        <div key={index} style={{width: left_panel_width, top: 0, right: 0, position:'relative', height: 50}}>
                                            <div style={{width: left_panel_width/4, top: 0, left: 0, position: 'absolute'}}>
                                                <Dropdown 
                                                fluid search selection 
                                                placeholder='人物'
                                                options={person_options}
                                                value = {elm.person.id}
                                                onChange={(event,{value})=>{
                                                    let old_person = elm.person
                                                    let new_person = personManager.get(value)
                                                    if (old_person!==new_person) {
                                                        elm.person = new_person
                                                        old_person.deleteEvent(center_event)
                                                        new_person.bindEvent(center_event)
                                                        stateManager.refresh()                                                        
                                                    }
                                                }}/>
                                            </div>
                                            <div style={{width: left_panel_width/4, top: 0, left: left_panel_width/4, position: 'absolute'}}>
                                                <Dropdown 
                                                fluid search selection 
                                                placeholder='角色'
                                                options={[{value: elm.role, key:elm.role, text:elm.role}]}
                                                value = {elm.role}
                                                onChange={(event,{value})=>{
                                                }}/>
                                            </div>
                                        </div>
                                        )
                                    }
                                    <div style={{width: left_panel_width/2, top: 0, right: 0, position:'relative', height: 50}}>
                                        <Dropdown 
                                        fluid search selection 
                                        placeholder='地点'
                                        options={addr_options}
                                        value = {center_event.addrs[0]&&center_event.addrs[0].id}
                                        onChange={(event,{value})=>{
                                            // 这里有问题的
                                            let addr = addrManager.get(value)
                                            let addrs = center_event.addrs
                                            if (addrs.length>0) {
                                                addrs[0] = addr
                                            }
                                            stateManager.refresh()
                                        }}/>
                                    </div>
                                    <div style={{width: left_panel_width/2, top: 0, right: 0, position:'relative', height: 50}}>
                                        <Dropdown 
                                        fluid search selection 
                                        placeholder='触发词'
                                        options={trigger_options}
                                        value = {center_event.trigger.id}
                                        onChange={(event,{value})=>{
                                            let trigger = triggerManager.get(value)
                                            if (trigger!==center_event.trigger) {
                                                center_event.trigger = trigger
                                                stateManager.refresh()
                                            }
                                        }}/>
                                    </div>
                                </div>
                            </Container>
                            }
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