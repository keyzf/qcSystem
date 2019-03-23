import dataStore, { personManager, triggerManager, filtEvents, eventManager, eucDist, hasSimElmIn, addrManager, timeManager, arrayAdd, simplStr, objectManager, dictCopy, sortBySimilar, ruleFilterWith, normalizeVec, ruleFilter, meanVec, intersect, union, difference } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import { Button, Card, Image, Container, Divider, Checkbox, Dropdown, DimmerInner, Menu, CommentActions} from 'semantic-ui-react'
import tsnejs from '../../dataManager/tsne'

import inter_icon from '../../static/infer_icon/1.png'
import infer_icon from '../../static/infer_icon/2.png'
import footpath_icon from '../../static/infer_icon/3.png'
import union_icon from '../../static/infer_icon/4.png'
import back_icon from '../../static/infer_icon/5.png'
import lifeview_icon from '../../static/infer_icon/6.png'
import relation_icon from '../../static/infer_icon/7.png'
import missing_icon from '../../static/infer_icon/8.png'

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
    CustomSVGSeries,
    LabelSeries
  } from 'react-vis';

import stateManager from '../../dataManager/stateManager'
import { autorun} from 'mobx';
import cos_dist from 'compute-cosine-distance'
import { stat } from 'fs';
import { all } from 'q';

const PI = Math.PI
const inner_radius = 0.3 //圆的内轮廓

class InferSunBurst extends React.Component{
    id2ids = {} //记录了上一步

    stateStack = []  //回到上一步用的

    all_events = []
    all_people = []
    all_triggers = []
    all_addrs = []
    all_times = []

    now_part_index = 0
    center_event = undefined

    sunbursts = []  //等于state中那个
    mouseover_value = undefined
    constructor(){
        super()
        this.state = {
            mouseover_value: undefined,

            isDrag: false,  //目前话没有用到，看要不要删除
            isMousePressed: false,

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
            net_work.require('getAllRelatedEvents', {event_id:selected_event_id, event_num:1000})
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

                let all_times = [], all_people = [], all_addrs = [], all_triggers = new Set()
                all_events.forEach(event=>{
                    all_times = [...all_times, ...event.time_range.map(year=> timeManager.get(year))]
                    all_addrs = [...all_addrs, ...event.addrs]
                    // console.log(all_people, event.getPeople())
                    all_people = [...all_people, ...event.getPeople()]
                    all_triggers.add(event.trigger)
                })
                this.all_people = [...new Set(all_people)]
                this.all_addrs = [...new Set(all_addrs)]
                this.all_times = [...new Set(all_times)]
                this.all_triggers = [...all_triggers]

                const object2options = elm=>{
                    return {
                        value: elm.id,
                        key: elm.id,
                        text: elm.getName(),
                        elm: elm
                    }
                }
                this.people_options = this.all_people.map(object2options)
                this.addr_options = this.all_addrs.map(object2options)
                this.time_options = this.all_times.map(object2options)
                this.trigger_options = this.all_triggers.map(object2options)

                this.center_event = center_event
                let sunbursts = []
                sunbursts.push(new OnePart(this.all_events, center_event, 0, 0, 0, 1.1, this) )
                this.sunbursts = sunbursts
                this.setState({sunbursts: sunbursts})
            })
        }
    })

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
        // 可以改为判断是否和this相等
        if (this.temp_sunbursts) {
            // console.log('change')
            // console.log(this.temp_sunbursts)
            this.setState({sunbursts: this.temp_sunbursts})
            this.temp_sunbursts = undefined
        }
        sunbursts.forEach(elm=> elm.need_forward=false)

        sunbursts.forEach(elm=> elm.completeSetStateLater())
    }
    render(){
        // console.log(this.state.sunbursts)
        // console.log(this.state)
        // console.log('render triggerSunBurst')
        const {width, height} = this.props
        let {isMousePressed, sunbursts} = this.state
        let {center_event} = this



        // 这几个都可以移出去
        const r = 1
        this.r = r  //圆的大小
        const graph_width = 5000 // width<height?width: height

        const title_height = 50
        const control_bar_height = 100
        const graph_height = height-title_height-control_bar_height //graph_width/(xDomain[1]-xDomain[0])*(yDomain[1]-yDomain[0])
        const xDomain = [-r,-r + 2*r/graph_height*graph_width], yDomain = [-r,r]
        const trueX2X =  d3.scaleLinear().domain([0, graph_width]).range(xDomain),
            trueY2Y =  d3.scaleLinear().domain([0, graph_height]).range([yDomain[1], yDomain[0]])


        let change_event_index = 0 
        // console.log(this.sunbursts)
        return (
            <div 
                className='trigger_sunburst_graph' 
                style={{width: width, height: height, position: 'absolute', 
                overflowY: 'auto'
                }}>
                <div style={{height: title_height, width: width}}>
                    {
                        center_event && 
                        <div className='change_event_bar' style={{position: 'relative'}}>
                            <style type="text/css">{'.change_event_div {position:absolute; top: 5px; width: 100px; height:30px; margin:2px; margin-right:10px}'}</style>
                            <div className='change_event_div' style={{right: 10}}>
                                <Dropdown 
                                fluid search selection 
                                placeholder='触发词'
                                options={this.trigger_options}
                                value = {center_event.trigger.id}
                                onChange={(event,{value})=>{
                                    let trigger = triggerManager.get(value)
                                    if (center_event.trigger!==value) {
                                        center_event.trigger = trigger
                                        this.setState({hi: !this.state.hi})
                                    }
                                }}/>
                            </div>
                            {
                                center_event.roles.map(({role, person}, index)=>{
                                    return (
                                    <div key= {index} className='change_event_div' style={{right: 120+165*change_event_index++, width: 160}}>
                                        <Dropdown
                                        fluid search selection 
                                        placeholder='人物/角色'
                                        options={this.people_options.map(elm=> {
                                            elm = dictCopy(elm)
                                            elm.text += '/' + role
                                            return elm
                                        })}
                                        value = {person.id}
                                        onChange={(event,{value})=>{
                                            let person = personManager.get(value)
                                            // console.log(role, person)
                                            center_event.roles.forEach(elm=>{
                                                if (elm.role===role && person!==elm.person) {
                                                    elm.person = person
                                                    this.setState({hi: !this.state.hi})
                                                }
                                            })
                                        }}/>
                                    </div>
                                    )
                                })
                            }

                            <div className='change_event_div' style={{right: 120+165*change_event_index}}>
                                <Dropdown 
                                fluid search selection  multiple
                                placeholder='地点'
                                options={this.addr_options}
                                value = {center_event.addrs.map(elm=> elm.id)}
                                onChange={(event,{value})=>{
                                    let addrs = value.map(elm=> addrManager.get(elm))
                                    if (difference(addrs, center_event.addrs).length>1) {
                                        center_event.addrs = addrs
                                        this.setState({hi: !this.state.hi})
                                    }
                                }}/>
                            </div>

                            <div className='change_event_div' style={{right: 230+165*change_event_index}}>
                                <Dropdown 
                                fluid search selection
                                placeholder='时间'
                                options={this.time_options}
                                value = {center_event.time_range[1].toString()}
                                onChange={(event,{value})=>{
                                    let time = parseFloat(value)
                                    if (time!==center_event.time_range[0]) {
                                        center_event.time_range[1] = time
                                        this.setState({hi: !this.state.hi})
                                    }
                                }}/>
                            </div>

                            <div className='change_event_div' style={{right: 340+165*change_event_index}}>
                                <Dropdown 
                                fluid search selection
                                placeholder='时间'
                                options={this.time_options}
                                value = {center_event.time_range[0].toString()}
                                onChange={(event,{value})=>{
                                    let time = parseFloat(value)
                                    if (time!==center_event.time_range[0]) {
                                        center_event.time_range[0] = time
                                        this.setState({hi: !this.state.hi})
                                    }
                                }}/>
                            </div>
                        </div>                        
                    }
                </div>
                <div style={{height: control_bar_height, width: 150, position: 'absolute', right: 0}}>
                    <style type="text/css">{'.toother_graph_button { height:20px; cursor: pointer; margin:2px; margin-right:10px}'}</style>
                    <img alt='' className='toother_graph_button' src={relation_icon} 
                    onClick={event=>{
                        let {now_part_index} = this
                        let now_graph = this.sunbursts[now_part_index]
                        if (now_graph) {
                            let events = now_graph.all_events
                            stateManager.setRelationEvents(events)
                        }
                    }}/>
                    <img alt='' className='toother_graph_button' src={lifeview_icon} 
                    onClick={event=>{
                        let {now_part_index} = this
                        let now_graph = this.sunbursts[now_part_index]
                        if (now_graph) {
                            let events = now_graph.all_events
                            stateManager.setMountainEvents(events)
                        }
                    }}/>
                    <img alt='' className='toother_graph_button' src={footpath_icon} 
                    onClick={event=>{
                        let {now_part_index} = this
                        let now_graph = this.sunbursts[now_part_index]
                        if (now_graph) {
                            let events = now_graph.all_events
                            stateManager.setMapEvents(events)
                        }
                    }}/>
                </div>
                <div style={{height: control_bar_height, width: width}}>
                </div>
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
                        this.mouse_postion = [graph_x, graph_y]
                        if (isMousePressed) {
                            this.setState({mouse_postion: [graph_x, graph_y]})
                        }
                    }}/>
                    {/* <XAxis/>
                    <YAxis/> */}
                </XYPlot>
            </div>
        )
    }
}

class OnePart{
    static id_count = 0
    constructor(all_events, center_event, center_x, center_y, index, r, parent_component){
        // const graph_width = 2
        this.ruleManager = new RuleManager(this)
        this.center_x = center_x
        this.center_y = center_y
        this.all_events=  [...all_events]
        this.part_index = index  //第几个
        this.center_event = center_event
        this.r = r
        this.this_part = this
        this.parent_component = parent_component

        // console.log(index, center_x, center_y)
        this.all_values = []


        this.self_id = OnePart.id_count
        OnePart.id_count++
        // console.log(OnePart.id_count, this.self_id)     
        this.loadSunBurstData()

    }
    
    setEvents(events){
        let {all_events} = this

        // 不需要更新
        if (difference(all_events, events).length===0) {
            return
        }
        this.all_events = [...events]
        this.loadSunBurstData()
    }

    setState(update_state){
        // console.log('set State')
        let prefix = this.self_id
        // console.log(this, this.self_id)
        let temp_state = {}
        for(let key in update_state)
            temp_state[prefix+'-'+key] = update_state[key]
        // console.log(temp_state)
        this.parent_component.setState(temp_state)
    }

    setStateLater(state){
        this.later_state = state
    }
    completeSetStateLater(){
        if (this.later_state) {
            this.parent_component.setState(this.later_state)
            this.later_state = undefined
        }
    }
    getState(){
        let self_state = {}
        const prefix = this.self_id
        // console.log(this, this.self_id)
        const {parent_component} = this
        const parent_state = parent_component.state
        // console.log(parent_component.state, prefix)
        // console.log(parent_component.state)
        for(let key in parent_state){
            if (key.indexOf('-')===-1 ) {
                self_state[key] = parent_state[key]
            }else if (key.indexOf(prefix+'-') !== -1 ) {
                let temp_key = key.replace(prefix+'-', '')
                self_state[temp_key] = parent_state[key]
            }
        }
        // console.log(self_state)
        return self_state
    }

    former_isMousePressed = false
    drag_value = undefined
    filter_values = []

    need_forward = true

    mouse_press_value = undefined
    
    former_click_values = []

    render( ){
        // console.log('render', this.part_index)
        const {center_event, part_index, parent_component, center_x, center_y, r, filter_values, ruleManager} = this
        let former_click_values = this.former_click_values 
        let {
            label_data, 
            event_mark_data, 
            isDrag, 
            mouseover_value,
            mouse_postion,
            isMousePressed,
        } = this.getState()
        let ruleManager_mark = ruleManager.getNodeInGraph()
        // console.log(this.all_events)
        // console.log(part_index, label_data)
        let rules = ruleManager.rules
        
        // console.log(label_data, part_index)
        // console.log(mouseover_value, filter_values, rules)
        // console.log(label_data, event_mark_data, filter_values, rules)
        this.all_values = [...label_data, ...event_mark_data, ...filter_values, ...rules, ruleManager_mark]
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
        // console.log(mouseover_value)
        let {former_isMousePressed} = this

        // 可以放到监听函数中
        if (isMousePressed && !mouseover_value) {
            console.log(parent_component.mouse_postion)
            // 判断实在哪个当中
            let mouse_x = parent_component.mouse_postion[0]
            let index = (mouse_x+r)/3.25
            parent_component.now_part_index = Math.floor(index)
        }
        if (isMousePressed && this.all_values.includes(mouseover_value)) {
            this.mouse_press_value = mouseover_value
            // 点击一次,有一个两次点击的bug
            if (!former_isMousePressed) {
                // 点到东西上了
                if (mouseover_value) {
                    if (mouseover_value.node_type==='related_value') {
                        this.drag_value = mouseover_value
                        mouseover_value.origin_x = mouseover_value.x
                        mouseover_value.origin_y = mouseover_value.y 
                    }
                }
            }
            const {drag_value}  = this
            if(drag_value && former_isMousePressed && parent_component.mouse_postion){
                drag_value.x = parent_component.mouse_postion[0]
                drag_value.y = parent_component.mouse_postion[1]              
            }
            this.former_isMousePressed = true   
        }else{
            let {drag_value} = this
            if (drag_value && drag_value.node_type!=='filter_value') {
                if (drag_value.x>(center_x+r) && drag_value.node_type==='related_value') {
                    let {filter_values} = this

                    let findIndex = filter_values.findIndex(elm=> elm.object_id===drag_value.object_id)
                    if (findIndex===-1) {
                        // console.log(part_index, filter_values)
                        let filter_value = dictCopy(drag_value)
                        
                        filter_value.node_type = 'filter_value'
                        filter_values.push(filter_value)
                        filter_value.rotation = 0
                        filter_value.x = center_x + r  + 0.1*filter_values.length  //一列也什么了几个地方
                        filter_value.y = center_y + r - 0.2*filter_values.length-0.3

                        this.filter_values = filter_values
                        // console.log(drag_value)

                        this.former_isMousePressed = undefined
                        ruleManager.create([filter_value])
                        this.need_forward = true
                    }
                }
                drag_value.x = drag_value.origin_x
                drag_value.y = drag_value.origin_y
            }
            if (former_isMousePressed) {
                parent_component.setState({mouseover_value: undefined})
                if (mouseover_value===this.mouse_press_value ) {
                    // console.log('click', mouseover_value)
                    let this_value = mouseover_value
                    // console.log(this_value)
                    if (former_click_values[former_click_values.length-1]!==mouseover_value) {
                        this.former_click_values.push(mouseover_value)
                    }else{
                        // 双击
                        let last_index = former_click_values.length-1
                        former_click_values[last_index] = former_click_values[last_index-1]
                        former_click_values[last_index-1] = undefined
                    }
                    // this.former_click_values.push(mouseover_value)
                }
            }
            this.drag_value = undefined  
            this.former_isMousePressed  = false
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
                parent_component.setState({mouseover_value:value})
            }
        }
        const handleLabelDataOut = value=>{
            parent_component.setState({mouseover_value:undefined})
        }

        // 开始加载图像
        let former_click_value = this.former_click_values[former_click_values.length-2]
        let now_click_value = this.former_click_values[former_click_values.length-1]
        let component_array = []

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


        // 规则
        // console.log(rules)
        component_array.push(
            <MarkSeries
            key={part_index+'-rule_mark'}
            data={rules.filter(elm=>elm.related_objects.length>1).map(elm=> elm.getNodeInGraph())}
            // color='#79c7e3'
            colorType="literal"
            sizeRange={[2,5]}
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            />
        )


        let wrap_line_data = [
            {x: center_x-r, y: center_y-r},
            {x: center_x-r, y: center_y+r},
            {x: center_x + 3.25 - r, y: center_y+r},
            {x: center_x + 3.25 - r, y: center_y-r},
        ]
        component_array.push(
            <LineSeries 
            stroke='#c3c3c3'
            strokeWidth={2}
            data={wrap_line_data}/>
        )


        // console.log(now_click_value, former_click_value)
        filter_values.forEach(elm=> {
            if (elm===now_click_value || (elm===former_click_value)) {
                elm.style.textDecoration = 'underline'
            }else{
                elm.style.textDecoration = 'none'
            }
        })
        // 拖出来用来选择的实体
        component_array.push(
            <LabelSeries
            key={part_index+'-filter_objects'}
            labelAnchorX = 'start'
            labelAnchorY = 'start'
            animation
            data={filter_values}
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            color='literal'
            allowOffsetToBeReversed/>
        )

        // 实体之间的连线
        let links_datas = []
        let show_event_mark_data = []
        if (mouseover_value && (mouseover_value.node_type==='filter_value' ||  mouseover_value.node_type==='related_value')) {
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
                            let random = Math.abs(y*10000)%10/10 * 0.2 + 0.4

                            let random_x = x*random+node.x*(1-random),
                                random_y = y*random+node.y*(1-random)

                            random = Math.abs(y*1000)%10/10
                            random_y += random*Math.abs(y-node.y) * (x*100000%2===0?-1:1)/Math.sqrt(Math.abs((node.y-y)/(node.x-x)))  //Math.log())
                            links_datas.push([
                                {x:x, y:y},
                                {x: random_x, y:random_y},
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
                key={part_index+ 'related_value_links'+index}
                color='#1234'
                data={elm}
                style={{
                    pointerEvents: isDrag ? 'none' : '',
                    lineerEvents: isDrag ? 'none' : ''
                }}
                curve={d3.curveCatmullRom.alpha(0.001)}/>
            )
        )

        rules.forEach(elm=>{
            if (former_click_value===elm || now_click_value===elm) {
                elm.opacity = 1
            }else{
                elm.opacity = 0.5
            }
        })
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

        // 中心事件周围的实体(要跟rotation改end 和 start)
        label_data = label_data.filter(elm=> !filter_values.find(elm2=> elm2.object_id===elm.object_id))
        component_array.push(
            <LabelSeries
            labelAnchorX = 'start'
            labelAnchorY = 'start'
            key={part_index+'-label_data1'}
            animation
            data={label_data.filter(elm=> elm.text_anchor)}
            color='literal'
            allowOffsetToBeReversed
            onValueMouseOver={handleLabelDataOver}
            onValueMouseOut={handleLabelDataOut}
            style={label_style}/>
        )

        component_array.push(
            <LabelSeries
            labelAnchorX = 'end'
            labelAnchorY = 'end'
            key={part_index+'-label_data2'}
            animation
            data={label_data.filter(elm=> !elm.text_anchor)}
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
        // 上面那个控制面板
        const panel_data = [
            {
                x: center_x+r, y:center_y+r-0.1, customComponent: (row, positionInPixels) => {
                    const bar_width = 162
                    return (
                    <g className="inner-inner-component">
                        <foreignObject className="control_logical_pane;" x={0} y={0} width={bar_width} height={38}>
                        <style type="text/css">{'.control_logical_button { height:20px; cursor: pointer; margin:2px; margin-right:10px}'}</style>
                        <div style={{width:bar_width, background:'#ebebeb', padding: 5, height:38 }}>
                            <img className='control_logical_button' alt='intersection' src={inter_icon}
                                onClick={event=>{
                                    let {former_click_values} = this
                                    let former_click_value = former_click_values[former_click_values.length-2]
                                    let now_click_value = former_click_values[former_click_values.length-1]
                                    const can_types = ['filter_value', 'rule']
                                    // console.log(now_click_value, former_click_value)
                                    if (former_click_value && now_click_value && former_click_value!==now_click_value && can_types.includes(former_click_value.node_type) && can_types.includes(now_click_value.node_type)) {
                                        let new_rule = ruleManager.create([now_click_value, former_click_value])
                                        new_rule.setType('and')
                                        // console.log('建立连接')
                                }
                                parent_component.setState({mouseover_value: undefined})
                            }}/>
                            <img className='control_logical_button' alt='union' src={union_icon}
                                onClick={event=>{
                                    let {former_click_values} = this
                                    let former_click_value = former_click_values[former_click_values.length-2]
                                    let now_click_value = former_click_values[former_click_values.length-1]
                                    const can_types = ['filter_value', 'rule']
                                    // console.log(now_click_value, former_click_value)
                                    if (former_click_value && now_click_value && former_click_value!==now_click_value && can_types.includes(former_click_value.node_type) && can_types.includes(now_click_value.node_type)) {
                                        let new_rule = ruleManager.create([now_click_value, former_click_value])
                                        new_rule.setType('or')
                                        // console.log(this.ruleManager.rules)
                                        // console.log('建立连接')
                                }
                                parent_component.setState({mouseover_value: undefined})
                            }}/>
                            <img className='control_logical_button' alt='infer' src={infer_icon} 
                                onClick= {event=>{
                                    let now_click_value = this.former_click_values[former_click_values.length-1]
                                    if(now_click_value.node_type==='rule'){
                                        // let events = now_click_value.filter(this.all_events)
                                        let sunburst = now_click_value.getSunBurst()
                                        // let now_index = part_index
                                        let temp_sunbursts = this.parent_component.state.sunbursts.slice(0, part_index+1)
                                        temp_sunbursts.push(sunburst)
                                        this.setStateLater({sunbursts: temp_sunbursts})
                                    }else if(now_click_value.node_type==='filter_value'){
                                        // let events = now_click_value.filter(this.all_events)
                                        // console.log(this.ruleManager.rules, now_click_value)
                                        let rule = this.ruleManager.rules.find(elm=> elm.related_objects.length===1 &&  elm.related_objects[0]===now_click_value)
                                        let sunburst = rule.getSunBurst()
                                        // let now_index = part_index
                                        let temp_sunbursts = this.parent_component.state.sunbursts.slice(0, part_index+1)
                                        temp_sunbursts.push(sunburst)
                                        this.setStateLater({sunbursts: temp_sunbursts})
                                    }
                            }}/>
                            <img className='control_logical_button' alt='union' src={back_icon} onClick={event=>{}}/>
                        </div>
                        </foreignObject >
                    </g>
                    )
                }
            }
        ]
        component_array.push(
            <CustomSVGSeries
            key={part_index+'-panel'}
            data={panel_data}/>
        )

        // console.log('hi')
        return component_array
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
        // console.log(all_people)
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
        // console.warn('这里还要改呀 不要用prob_year了')
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
            for(var k = 0; k < 1; k++) {
                tsne.step();
            }

            return  tsne.getSolution();
        }

        const objects2Vec = (all_objects, start_angle, end_angle, center_vec = undefined, compare_vecs = [], object_type, color) =>{
            color = '#151515' //字体颜色先失效吧

            start_angle += PI/20
            end_angle -= PI/20
            let center_index
            let vecs = all_objects.map(elm=> elm.toVec())
            if (center_vec) {
                vecs.push(center_vec)
                center_index = vecs.length-1
            }

    
            let angles = myTsne(vecs).map(elm=> elm[0])
            let min_angle = Math.min(...angles),
                max_angle = Math.max(...angles)

            angles = angles.map(elm=> (elm-min_angle)/(max_angle-min_angle))

            let dists = vecs.map(elm=> {
                return compare_vecs.reduce((total, vec)=>{
                    return total+cos_dist(vec, elm)
                }, 0)
            })

            let sort_dists = [...dists].sort((a,b)=> a-b)
            dists = dists.map(dist=> {
                let index  =  sort_dists.findIndex(elm=> elm===dist)
                let dist_length = dists.length
                return index/dist_length
            })
            dists = dists.map(dist=> {
                if (dist<0.5) {
                    return dist * 1.5
                }else{
                    return (dist-0.5)*0.5+0.5
                }
            })
            dists = dists.map(dist=> dist*1.1)

            angles[center_index] = Math.random()*(max_angle-min_angle)+min_angle
            let sort_angles = [...angles].sort((a,b)=> a-b)
            // console.log(angles, sort_angles)
            angles = angles.map(angle=> sort_angles.findIndex(elm=> elm===angle)/angles.length)
            // console.log(angles)

            // 整理点和字
            let label_data = all_objects.map((elm, index)=>{
                // 直径应该更加均匀
                let radius = dists[index] * (1-inner_radius) + inner_radius
                let angle = angles[index]*(end_angle-start_angle) + start_angle
                let x = center_x + radius*Math.cos(angle), y = radius*Math.sin(angle) + center_y
                let text_rotate = -angle/PI*180, text_anchor = true
                if (text_rotate<-90&& text_rotate>-270) {
                    text_rotate = 180+text_rotate
                    text_anchor = false
                }
                // console.log(this.part_index, center_x, center_y, x, y)
                return {
                    x: x,
                    y: y,
                    origin_x: x,
                    origin_y: y,
                    rotation: text_rotate,
                    label: simplStr(elm.getName(), 4),
                    total_label: elm.getName(),
                    object_id: elm.id,
                    vec: vecs[index],
                    new_vec: angles[index],
                    text_anchor: text_anchor,
                    size: 5,
                    color: color,
                    object_type: object_type,
                    node_type: 'related_value',
                    belong_to: this.part_index,
                    links: [],
                    style: {
                        // textDecoration: 'underline',
                        stroke: color,
                        cursor: "pointer",
                        fontSize: 12,
                        opacity: 0.5,
                    },
                }
            })

            label_data = label_data.sort((a,b)=>{
                return eucDist([a.x,a.y],[center_x, center_y]) - eucDist([b.x,b.y],[center_x, center_y])
            })
            return label_data
        }

        const total_angle = 2*PI
        let stack_angle = 0
        let trigger_num = all_triggers.length, addr_num = all_addrs.length,  people_num = all_people.length, year_num = all_years.length
        let angle_per_object = total_angle/(trigger_num+addr_num+people_num+year_num)
    
        let center_people_vec = meanVec(center_people)
        // console.log(center_people.map(elm=> elm.vec), center_people_vec)

        let center_addr_vec = center_event.vec
        if (center_event.addrs.length>0) {
            center_addr_vec = meanVec(center_event.addrs)
        }

        let trigger_label_data = objects2Vec(all_triggers, stack_angle, stack_angle += trigger_num*angle_per_object, center_event.trigger.vec, [center_event.trigger.vec],'trigger', '#f4cea3')
        let people_label_data = objects2Vec(all_people, stack_angle, stack_angle += people_num*angle_per_object, center_people_vec, center_people.map(elm=> elm.vec),'people', '#9a8bb9')
        let addr_label_data = objects2Vec(all_addrs, stack_angle, stack_angle += addr_num*angle_per_object, center_addr_vec, [center_event.vec],'addr', '#bfdda8')
        let year_label_data = objects2Vec(all_years, stack_angle, stack_angle += year_num*angle_per_object, center_event.vec, [center_event.vec],'year', '#e29cae')
        
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
}


// 生成一个树状结构
class RuleManager{
    x = 0
    y = 0
    size = 5
    parents = []
    object_type = 'rule'
    node_type = 'rule'
    
    last_get_rule = undefined //最后一个被渲染的子规则,先不做吧

    constructor(parent_graph){
        this.rules = []
        this.graph = undefined //存储对应的OnePart
        this.parent_graph = parent_graph //所处的graph
    }

    // 获得下一步的子图
    getSunBurst(){
        let {parent_graph, graph} = this 
        let all_events = this.filter(parent_graph.all_events)
        if (!graph) {
            let index = parent_graph.part_index + 1
            this.graph = new OnePart(all_events, parent_graph.center_event, index*3.25, 0, index, 1.1, parent_graph.parent_component)
        }else{
            this.graph.setEvents(all_events)
        }
        this.graph.need_forward = true
        return this.graph
        // 还要完成更新机制
    }

    getFilterRule(filter_value){
        if (filter_value.node_type==='filter_value'){
            return this.rules.find(rule=> (rule.related_objects.length===1 && rule.related_objects[0]===filter_value))
        }
        console.error(filter_value, '不是filter_value')
    }

    create(related_objects){
        related_objects = related_objects.map(elm=>{
            if (elm.node_type==='filter_value') {
                let rule = this.rules.find(rule=> (rule.related_objects.length===1 && rule.related_objects[0]===elm))
                if (!rule) {
                    rule = new Rule([elm], this)
                    this.rules.push(rule)
                    // elm.self_rule = rule  //这里动画会报错
                } 
                return rule
            }else{
                return elm
            }
        }).filter(elm=>elm!==this)

        // console.log(related_objects)
        // related_objects.forEach(elm=>{
        //     if (elm.node_type==='filter_value') {
        //         this.rules = this.rules.filter(rule=>  !(rule.related_objects.length===1 && rule.related_objects[0]===elm))
        //     }
        // })
        let new_rule = new Rule(related_objects, this)
        let find = this.rules.find(elm=> elm.equal(new_rule))
        if (find) {
            console.log(related_objects, 'equal')
            return find
        }
        related_objects.forEach(elm=> elm.parents.push(elm))
        this.rules.push(new_rule)
        return new_rule
    }

    getNodeInGraph(){
        const {rules} = this
        let objects = rules.map(elm=> elm.getNodeInGraph())
        // console.log(objects)
        // console.log(related_objects, sub_rules)
        this.x = Math.max(...objects.map(elm=>elm.x)) + 0.2 //sub_nodes.reduce((total, elm)=>  total+elm.x, 0)/sub_nodes.length + 0.1
        this.y = objects.reduce((total, elm)=>  total+elm.y, 0)/objects.length
        // this.color = this.
        return this
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
        // console.log(results)
        let final_result = results[0]
        for (let index = 1; index < results.length; index++) {
            const element = results[index];
            final_result = union(final_result, element)
        }
        // console.log(final_result)
        return final_result
    }
}

class Rule{
    x = 0
    y = 0
    size = 5
    static type2color = {'or':'2f7a29', 'and':'#c97878' }
    static types = ['or', 'and']

    // is_checked = false

    parents = []
    object_type = 'rule'
    node_type = 'rule'
    constructor(related_objects, ruleManager){
        this.type = 'or'
        this.related_objects= related_objects.filter(elm=> elm)
        this.results = []
        this.ruleManager = ruleManager
        this.need_refresh = true   //这个rule对应的graph要更新

        this.graph = undefined
    }
    
    equal(rule){
        let related_objects1 = rule.related_objects, related_objects2 = this.related_objects
        // console.log(rule)
        return difference(related_objects1, related_objects2).length===0
    }

    getSunBurst(){
        let {graph} = this 
        let {parent_graph} = this.ruleManager
        let all_events = this.filter(parent_graph.all_events)
        if (!graph) {
            let index = parent_graph.part_index + 1
            this.graph = new OnePart(all_events, parent_graph.center_event, index*3.25, 0, index, 1.1, parent_graph.parent_component)
        }else{
            // 现在有了数组比较，所以不用refresh了
            this.graph.setEvents(all_events)
        }
        this.ruleManager.last_get_rule = this
        this.graph.need_forward = true
        return this.graph
    }

    changeType(){
        this.type= this.type==='and'? 'or':'and'
    }
    getSubRules(){
        return this.related_objects.filter(elm=> elm.node_type==='rule')
    }
    setType(type){
        if (Rule.types.includes(type)) {
            this.type = type
            this.need_refresh = true
        }
    }

    filter(events){
        const {type, related_objects} = this
        let sub_rules = related_objects.filter(elm=> elm.node_type==='rule')
        let sub_nodes = related_objects.filter(elm=> elm.node_type==='filter_value')
        // console.log(sub_rules, sub_nodes)
        let results = []
        sub_rules.forEach(elm=> results.push(elm.filter(events)))
        sub_nodes.forEach(elm=> {
            elm = objectManager.get(elm.object_id)
            let result = events.filter(event=>{
                let objects = event.getAllObjects()
                // console.log(objects, elm, objects.includes(elm))
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
        let final_result = results[0]
        for (let index = 1; index < results.length; index++) {
            const element = results[index];
            if (this.type==='or') {
                final_result = union(final_result, element)
            }else{
                final_result = intersect(final_result, element)
            }
            
        }
        return final_result
    }
    getNodeInGraph(){
        const {related_objects} = this
        if (related_objects.length===0 && related_objects[0].node_type==='filter_value') {
            return related_objects[0]
        }
        this.x = Math.max(...related_objects.map(elm=> elm.x)) + 0.2 //sub_nodes.reduce((total, elm)=>  total+elm.x, 0)/sub_nodes.length + 0.1
        this.y = related_objects.reduce((total, elm)=>  total+elm.y, 0)/related_objects.length
        this.color = Rule.type2color[this.type]
        // this.color = this.
        return this
    }
}

export default InferSunBurst