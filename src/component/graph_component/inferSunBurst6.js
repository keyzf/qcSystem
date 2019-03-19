import dataStore, { personManager, triggerManager, filtEvents, eventManager, eucDist, hasSimElmIn, addrManager, timeManager, arrayAdd, simplStr, objectManager, dictCopy, sortBySimilar, ruleFilterWith, normalizeVec, ruleFilter, meanVec, intersect, union } from '../../dataManager/dataStore2'
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
import { autorun } from 'mobx';
import cos_dist from 'compute-cosine-distance'
import { red } from 'ansi-colors';

const PI = Math.PI
const inner_radius = 0.4 //圆的内轮廓

class InferSunBurst extends React.Component{
    id2ids = {} //记录了上一步

    now_click_value = undefined
    former_click_value = undefined

    stateStack = []  //回到上一步用的

    all_events = []
    center_event = undefined

    sunbursts = []
    constructor(){
        super()
        this.state = {
            event_mark_data: [],
            center_event_mark_data: [],


            mouseover_value: undefined,

            isDrag: false,
            isMousePressed: false,

            drag_value: undefined,
            filter_values: [],   //一个object对应一个rules
            rules: [],
            
            show_event_hint_value: undefined,
            mouse_postion: [0,0],
            sunbursts: [],

        }
    }


    onFilterChange = autorun(()=>{
        if (stateManager.is_ready) {
            const need_refresh = stateManager.need_refresh
            // this.loadData()
        }
    })

    loadNewEvent = autorun(()=>{
        // console.log(stateManager.selected_event)
        if (stateManager.is_ready) {
            let selected_event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:selected_event_id, event_num:500})
            .then(data=>{
                // console.log(data)
                data = dataStore.processResults(data.data)
                let {events} = data
                let center_event = eventManager.get(selected_event_id)
                let all_events = dataStore.dict2array(events)
                if (!this.all_events.includes(center_event)) {
                    this.all_events.push(center_event)
                }
                this.all_events = all_events
                this.center_event = center_event
                // this.test = new OnePart(this.all_events, center_event, 0, 0, 0, 1.1, this)
                let sunbursts = []
                sunbursts.push(new OnePart(this.all_events, center_event, 0, 0, 0, 1.1, this) )
                this.sunbursts = sunbursts
                this.setState({sunbursts: sunbursts})
                // this.test = new OnePart(this.all_events, center_event, 6, 0, 0, 1.1, this)
                // all_events, center_event, center_x, center_y, index, r, parent_component
                // this.loadData()
            })
        }
    })
    // loadData(){
    //     this.setState({hi:!this.state.hi})
    // }

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    all_objects = []  //存放显示出来的所有object
    
    componentDidUpdate(){
        let {sunbursts} = this.state
        let last_sunburst = sunbursts[sunbursts.length-1]
        let {center_event} = this
        if(last_sunburst && last_sunburst.ruleManager.rules.length>0){
            let index = sunbursts.length
            let events = last_sunburst.all_events
            events = last_sunburst.ruleManager.filter(events)
            let new_sunburst = new OnePart(events, center_event, index*2.5, 0, index, 1.1, this)
            sunbursts.push(new_sunburst)
            this.sunbursts = sunbursts
        }
    }
    render(){
        // console.log(this.state)
        console.log('render triggerSunBurst')
        const {width, height} = this.props
        let {isMousePressed, sunbursts} = this.state
        let {center_event} = this

        // 这几个都可以移出去
        const r = 1.1
        this.r = r  //圆的大小
        const xDomain = [-r,10], yDomain = [-r,r]
        const graph_width = width<height?width: height
        const graph_height = graph_width/(xDomain[1]-xDomain[0])*(yDomain[1]-yDomain[0])
        const trueX2X =  d3.scaleLinear().domain([0, graph_width]).range(xDomain),
            trueY2Y =  d3.scaleLinear().domain([0, graph_height]).range([yDomain[1], yDomain[0]])


        // console.log(this.sunbursts)
        return (
            <div 
                className='trigger_sunburst_graph' 
                style={{width: width, height: height, position: 'absolute', 
                // background:'#fffaaa'
                }}>
                <XYPlot 
                width={graph_width} 
                height={graph_height}
                xDomain={xDomain}
                yDomain={yDomain}
                onMouseDown = {event=>{
                    console.log('MouseDown', event)
                    let {isMousePressed} = this.state
                    if (!isMousePressed) {
                        this.setState({isMousePressed: true})
                    }
                }}
                onMouseUp = {event=>{
                    console.log('MouseUp', event)
                    let {isMousePressed} = this.state
                    if (isMousePressed) {
                        this.setState({isMousePressed: false})
                    }
                }}>
                    {
                        sunbursts.map(elm=> {
                            // console.log(elm.render())
                            return elm.render()
                        })
                    }
                    <MarkSeries
                    size={0}
                    data={[{x:0,y:0, size:0}]}
                    onNearestXY={(value, {event})=>{
                        let {layerX, layerY} = event
                        let {isDrag} = this.state
                        let graph_x = trueX2X(layerX), graph_y = trueY2Y(layerY)
                        if (isMousePressed) {
                            this.setState({mouse_postion: [graph_x, graph_y]})
                        }
                    }}/>
                    <XAxis/>
                    <YAxis/>
                </XYPlot>
            </div>
        )
    }
}

class OnePart{
    constructor(all_events, center_event, center_x, center_y, index, r, parent_component){
        this.ruleManager = new RuleManager()
        this.center_x = center_x
        this.center_y = center_y
        this.all_events=  [...all_events]
        this.part_index = index  //第几个
        this.center_event = center_event
        this.r = r
        this.this_part = this
        this.parent_component = parent_component

        console.log(index, center_x, center_y)
        this.all_values = []
        this.loadSunBurstData()
    }
    
    setEvents(events){
        this.events = events
        this.loadSunBurstData()
    }

    loadSunBurstData(){
        const show_object_num = 20
        const {center_x , center_y, all_events, center_event} = this

        if (!center_event) {
            console.warn('center_event 不存在')
            return
        }
        let {prob_year} = center_event
        const center_people = center_event.getPeople()

        let all_triggers = [...new Set(all_events.map(event=> event.trigger))]
        let trigger2sim = {}
        all_triggers.forEach(trigger=>{
            if (trigger.vec.length !== center_event.trigger.vec.length)
                return
            trigger2sim[trigger.id] = cos_dist(trigger.vec, center_event.trigger.vec)
        })
        all_triggers = all_triggers.sort((a,b)=> trigger2sim[a.id]-trigger2sim[b.id]).slice(0, show_object_num)
        all_triggers = all_triggers.sort((a,b)=> a.name-b.name)

        let all_people = []
        all_events.forEach(event=>{
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
        all_people = all_people.sort((a,b)=> people2sim[a.id]-people2sim[b.id]).slice(0, show_object_num)

        let all_addrs = []
        all_events.forEach(event=>{
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
        all_addrs = all_addrs.sort((a,b)=> addr2sim[a.id]-addr2sim[b.id]).slice(0,show_object_num)

        let all_years = new Set()
        all_events.forEach(event=>{
            all_years.add(event.time_range[0])
            all_years.add(event.time_range[1])
        })
        all_years = [...all_years].map(year=> timeManager.get(year))
        console.warn('这里还要改呀 不要用prob_year了')
        all_years = all_years.sort((a,b)=> parseFloat(prob_year[b])-parseFloat(prob_year[a])).slice(0,show_object_num)


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
            start_angle += PI/360
            end_angle -= PI/360

            let vecs = all_objects.map(elm=> elm.toVec())
            if (center_vec) {
                vecs.push(center_vec)
                center_index = vecs.length-1
            }

    
            let angles = myTsne(vecs).map(elm=> elm[0])
            let min_angle = Math.min(...angles),
                max_angle = Math.max(...angles)

            angles = angles.map(elm=> (elm-min_angle)/(max_angle-min_angle))

            let dists = vecs.map(elm=> cos_dist(elm, vecs[center_index]))

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
                // console.log(this.part_index, center_x, center_y, x, y)
                return {
                    x: x,
                    y: y,
                    origin_x: x,
                    origin_y: y,
                    rotation: text_rotate,
                    label: elm.getName(),
                    object_id: elm.id,
                    vec: vecs[index],
                    new_vec: angles[index],

                    object_type: object_type,
                    node_type: 'related_object',
                    belong_to: this.part_index,
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
    
        let center_people_vec = meanVec(center_people)

        let center_addr_vec = center_event.vec
        if (center_event.addrs.length>0) {
            center_addr_vec = meanVec(center_event.addrs)
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

        let event_mark_data = []
        this.left_events = left_events

        event_mark_data = left_events.map((event, index)=>{
            const links = event2links[event.id]
            let x = links.reduce((total,elm)=> total+elm.x, 0)/links.length
            let y = links.reduce((total,elm)=> total+elm.y, 0)/links.length
            let dist = eucDist([x,y], [center_x, center_y])
            if (dist> inner_radius) {
                x = (x-center_x) *inner_radius/dist * (1-Math.random()/3) + center_x
                y = (y-center_y) *inner_radius/dist * (1-Math.random()/3) + center_y
            }
            if (event===center_event) {
                x = center_x
                y = center_y
            }
            return {
                x: x,
                y: y,
                label: event.toText(),
                object_id: event.id,
                opacity: 0.5,
                links: links,
                size: 5,
                style: {
                    // stroke: color,
                    cursor: "pointer",
                    fontSize: 20,
                    opacity: 0.5,
                },
            }
        })

        event_mark_data.forEach((elm,index)=>{
            const {links} = elm
            links.forEach(object=>{
                object.links.push(index)
            })
        })

        this.setState({
            label_data: label_data,
            event_mark_data: event_mark_data,
        })
    }

    setState(update_state){
        console.log('set State')
        let prefix = this.part_index
        let temp_state = {}
        for(let key in update_state)
            temp_state[prefix+'-'+key] = update_state[key]
        console.log(temp_state)
        this.parent_component.setState(temp_state)
    }

    getState(){
        let self_state = {}
        const prefix = this.part_index
        const {parent_component} = this
        const parent_state = parent_component.state
        console.log(parent_component.state, prefix)
        // console.log(parent_component.state)
        for(let key in parent_state){
            if (key.indexOf('-')===-1 ) {
                self_state[key] = parent_state[key]
            }else if (key.indexOf(prefix+'-') !== -1 ) {
                let temp_key = key.replace(prefix+'-', '')
                self_state[temp_key] = parent_state[key]
            }
        }
        console.log(self_state)
        return self_state
    }

    former_isMousePressed = false
    drag_value = undefined
    filter_values = []

    render(all_objects){
        const {center_event, part_index, parent_component, center_x, center_y, r, filter_values, ruleManager} = this

        let {
            label_data, 
            event_mark_data, 
            isDrag, 
            mouseover_value,
            mouse_postion,
            isMousePressed,
        } = this.getState()
        console.log(part_index, label_data)
        let component_array = []
        let rules = ruleManager.rules
        
        // console.log(mouseover_value, filter_values, rules)
        // console.log(label_data, event_mark_data, filter_values, rules)
        this.all_values = [...label_data, ...event_mark_data, ...filter_values, ...rules]
        this.all_values.forEach((elm,index)=>{
            elm._index = index
        })
        // 高亮
        this.all_values.forEach(elm=> {
            // console.log(elm)
            if (mouseover_value && (elm===mouseover_value || (elm.object_id===mouseover_value.object_id && elm.node_type!=='rule'))) {
                elm.opacity = 1
                elm.style = elm.style || {}
                elm.style.opacity = 1
            }else{
                elm.opacity = 0.5
                elm.style = elm.style || {}
                elm.style.opacity = 0.5
            }
        })

        let {former_isMousePressed} = this
        if (isMousePressed) {
            // 点击一次,有一个两次点击的bug
            if (!former_isMousePressed) {
                // 点到东西上了
                if (mouseover_value) {
                    if (mouseover_value.node_type==='related_object') {
                        this.drag_value = mouseover_value
                        mouseover_value.origin_x = mouseover_value.x
                        mouseover_value.origin_y = mouseover_value.y 
                    }
                    if (this.former_click_value!==mouseover_value) {
                        let {former_click_value} = this
                        if (former_click_value && mouseover_value) {
                            // console.log(mouseover_value, former_click_value)
                            // 这里的代码可以简化
                            if (mouseover_value.node_type==='filter_object' && former_click_value.node_type==='filter_object') {
                                ruleManager.create([mouseover_value, former_click_value])
                                this.former_click_value = undefined
                                mouseover_value = undefined
                            }else if (mouseover_value.node_type==='filter_object' && former_click_value.node_type==='rule') {
                                ruleManager.create([mouseover_value, former_click_value])
                                this.former_click_value = undefined
                                mouseover_value = undefined
                                // console.log(rules)
                            }else if (mouseover_value.node_type==='rule' && former_click_value.node_type==='filter_object') {
                                ruleManager.create([mouseover_value, former_click_value])
                                this.former_click_value = undefined
                                mouseover_value = undefined
                                // console.log(rules)
                            }
                        }
                        this.former_click_value = mouseover_value
                    }    
                }
            }
            const {drag_value}  = this
            if(drag_value && former_isMousePressed){
                drag_value.x = mouse_postion[0]
                drag_value.y = mouse_postion[1]                
            }
            this.former_isMousePressed = true   
        }else{
            let {drag_value} = this
            if (drag_value && drag_value.node_type!=='filter_object') {
                // console.log(drag_value.x, center_x, r, center_x+r, drag_value.node_type)
                if (drag_value.x>(center_x+r) && drag_value.node_type==='related_object') {
                    let {filter_values} = this
                    let filter_value = dictCopy(drag_value)
                    
                    filter_value.node_type = 'filter_object'
                    filter_values.push(filter_value)
                    filter_value.rotation = 0
                    filter_value.x = center_x + r  + 0.1*filter_values.length
                    filter_value.y = center_y + r - 0.1*(filter_values.length+1)

                    this.filter_values = filter_values
                    // console.log(drag_value)
                    ruleManager.create([filter_value])
                }
                drag_value.x = drag_value.origin_x
                drag_value.y = drag_value.origin_y
            }
            this.drag_value = undefined
            this.former_isMousePressed = false
            this.mouseover_value = undefined
        }

        let label_style =  {
            pointerEvents: isDrag ? 'none' : '',
            lineerEvents: isDrag ? 'none' : ''
        }
        
        const handleLabelDataOver = value=>{
            // console.log(value)
            value = this.all_values[value._index]
            // console.log(value)
            if (mouseover_value!==value) {
                this.setState({mouseover_value:value})
            }
        }
        const handleLabelDataOut = value=>{
            this.setState({mouseover_value:undefined})
        }

        // 开始加载图像



        // 连接实体和event的线


        // 规则
        component_array.push(
            <MarkSeries
            key={part_index+'-rule_mark'}
            data={rules.filter(elm=>elm.related_objects.length>1).map(elm=> elm.getNodeInGraph())}
            color='#79c7e3'
            sizeRange={[2,5]}
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            />
        )

        // 规则和筛选实体之间连线
        component_array.push(
            rules.map(elm=> elm.getNodeInGraph()).map((elm, elm_index)=>{
                // console.log(elm)
                let {related_objects} = elm
                if (related_objects.length<2) {
                    return undefined
                }
                let generateSoftPath = path=>{
                    let elm1 = path[0], elm2 = path[1]
                    let r = Math.abs(elm1.y-elm2.y),
                        y = elm1.x<elm2.x?elm1.y:elm2.y,
                        x = elm1.x<elm2.x?elm2.x:elm1.x
                    return [
                        path[0],
                        {
                            x:x,
                            y:y,
                        },
                        path[1]
                    ]
                }
                return related_objects.map((value,index)=>{
                    return (
                    <LineSeries
                    key={part_index+ '-'+ elm_index+'_'+index}   //key可以更加的优化
                    data={generateSoftPath([value, elm])}
                    curve={d3.curveBundle.beta(0.5)}
                    color='#1234'/>
                    )
                })
            })
        )

        // 拖出来用来选择的实体
        component_array.push(
            <LabelSeries
            key={part_index+'-filter_objects'}
            labelAnchorX = 'middle'
            labelAnchorY = 'middle'
            animation
            data={filter_values}
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            color='literal'
            allowOffsetToBeReversed/>
        )
        
        let links_datas = []
        let show_event_mark_data = []
        if (mouseover_value && (mouseover_value.node_type==='filter_object' ||  mouseover_value.node_type==='related_object')) {
            let mouseover_object = objectManager.get(mouseover_value.object_id)
            event_mark_data.forEach(elm=>{
                let links = elm.links
                let link_ids = links.map(elm=> elm.object_id)
                if (link_ids.includes(mouseover_object.id)) {
                    show_event_mark_data.push(elm)
                    let {x,y} = elm
                    links.forEach(node=>{
                        node.style.opacity = 1
                        if (node.object_id !== mouseover_value.object_id) {
                            links_datas.push([
                                {x:x, y:y},
                                {x:node.x, y:node.y}
                            ])                         
                        }
                    })
                }
            })
        }
        // console.log(links_datas)
        component_array.push(
            links_datas.map((elm,index)=>
                <LineSeries
                key={part_index+ 'related_object_links'+index}
                color='#1234'
                data={elm}
                style={{
                    pointerEvents: isDrag ? 'none' : '',
                    lineerEvents: isDrag ? 'none' : ''
                }}
                curve={d3.curveCatmullRom.alpha(0.1)}/>
            )
        )
        // 中心事件周围的事件
        component_array.push(
            <MarkSeries
            data={show_event_mark_data}
            key={part_index+'-event_mark_data'}
            // onValueMouseOver={value=> this.setState({show_event_hint_value:value})}
            sizeRange={[2,5]}
            style={{
                pointerEvents: isDrag ? 'none' : '',
                lineerEvents: isDrag ? 'none' : ''
            }}/>
        )
        
        // 中心事件周围的实体
        component_array.push(
            <LabelSeries
            labelAnchorX = 'end'
            labelAnchorY = 'end'
            key={part_index+'-label_data'}
            animation
            data={label_data}
            color='literal'
            allowOffsetToBeReversed
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            style={label_style}/>
        )

        // 中间显示事件
        component_array.push(
            <LabelSeries
            labelAnchorX = 'middle'
            labelAnchorY = 'middle'
            key={part_index+'-center_event_mark_data'}
            style={label_style}
            data={[{x: center_x, y: center_y, label: center_event.toText()}]}
            allowOffsetToBeReversed
            animation/>
        )
        return component_array
    }
}


// 生成一个树状结构
class RuleManager{
    constructor(){
        this.rules = []
    }
    create(related_objects){
        related_objects.forEach(elm=>{
            if (elm.node_type==='filter_object') {
                this.rules = this.rules.filter(rule=>  !(rule.related_objects.length===1 && rule.related_objects[0]===elm))
            }
        })
        let new_rule = new Rule(related_objects)
        this.rules.push(new_rule)
        return new_rule
    }
    filter(events){
        // 找到所有顶节点
        this.rules.forEach(elm=>elm.parents=new Set())
        this.rules.forEach(elm=>{
            let sub_rules = elm.getSubRules()
            sub_rules.forEach(elm2=>{
                elm2.parents.add(elm)
            })
        })
        this.rules.forEach(elm=>elm.parents=[...elm.parents])
        let top_nodes = this.rules.filter(elm=> elm.parents.length===0)
        // console.log(top_nodes)
        let results = top_nodes.map(elm=> elm.filter(events))
        if (results.length===0) {
            console.warn('ruleManager', this.rules, '查都没有')
            return []
        }
        let final_result = results[0]
        for (let index = 1; index < results.length; index++) {
            const element = results[index];
            final_result = union(final_result, element)
        }
        return final_result
    }
}

class Rule{
    x = 0
    y = 0
    size = 5
    static tyel2color = {'or':'#123', 'and':'567' }

    parents = new Set()
    object_type = 'rule'
    node_type = 'rule'
    constructor(related_objects){
        this.type = 'or'
        this.related_objects= related_objects.filter(elm=> elm)
        this.results = []

        this.need_refresh = true
    }
    changeType(){
        this.type= this.type==='and'? 'or':'and'
    }
    getSubRules(){
        return this.related_objects.filter(elm=> elm.node_type==='rule')
    }
    setType(type){
        this.type = type
        this.need_refresh = true
    }
    getResultEvents(events){
        if (this.need_refresh) {
            this.results = this.calculateResults()
            this.need_refresh = false
        }
        return this.results
    }
    filter(events){
        const {type, related_objects} = this
        let sub_rules = related_objects.filter(elm=> elm.node_type==='rule')
        let sub_nodes = related_objects.filter(elm=> elm.node_type==='filter_object')
        let results = []
        sub_rules.forEach(elm=> results.push(elm.calculateResults(events)))
        sub_nodes.forEach(elm=> {
            elm = objectManager.get(elm.object_id)
            let result = events.filter(event=>{
                let objects = event.getAllObjects()
                if (objects.includes(elm)) {
                    return true
                }
                return false
            })
            results.push(result)
        })

        if(results.length===0){
            console.warn(events, this, '规则么有子节点')
        }
        // console.log(results)
        let final_reuslt = results[0]
        for (let index = 1; index < results.length; index++) {
            const element = results[index];
            final_reuslt = intersect(final_reuslt, element)
        }
        return final_reuslt
    }
    getNodeInGraph(){
        const {related_objects} = this
        // console.log(related_objects, sub_rules)
        this.x = Math.max(...related_objects.map(elm=> elm.x)) + 0.1 //sub_nodes.reduce((total, elm)=>  total+elm.x, 0)/sub_nodes.length + 0.1
        this.y = related_objects.reduce((total, elm)=>  total+elm.y, 0)/related_objects.length
        // this.color = this.
        return this
    }
}

export default InferSunBurst