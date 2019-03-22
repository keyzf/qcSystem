import dataStore, { personManager, triggerManager, filtEvents, eventManager, eucDist, hasSimElmIn, addrManager, timeManager, arrayAdd, simplStr, objectManager, dictCopy, sortBySimilar, ruleFilterWith, normalizeVec, ruleFilter, meanVec, rangeGenrator } from '../../dataManager/dataStore2'
import React, { Component } from 'react'
import * as d3 from 'd3'
import net_work from '../../dataManager/netWork'
import { Button, Card, Image, Container, Divider, Checkbox, Dropdown, DimmerInner, Menu} from 'semantic-ui-react'
import tsnejs from '../../dataManager/tsne'
import InferSunBurst from '../test_component/inferSunBurst7'
import { autorun } from 'mobx';
import stateManager from '../../dataManager/stateManager'

 export default class MergeSunBurstGraph extends React.Component{

    constructor(){
        super()
        this.sub_graphs = []
        this.state = {
            all_events:[],
            center_event:undefined,
            graphs_num: 1
        }
    }

    loadNewEvent = autorun(()=>{
        // console.log(stateManager.selected_event)
        if (stateManager.is_ready) {
            let selected_event_id = stateManager.selected_event_id.get()
            net_work.require('getAllRelatedEvents', {event_id:selected_event_id, event_num:2000})
            .then(data=>{
                data = dataStore.processResults(data.data)
                let {events} = data
                let center_event = eventManager.get(selected_event_id)
                let all_events = dataStore.dict2array(events)
                if (!all_events.includes(center_event)) {
                    this.all_events.push(center_event)
                }
                this.setState({center_event: center_event, all_events:all_events})
            })
        }
    })

    static get defaultProps() {
        return {
          width: 800,
          height: 600,
        };
    }

    render(){
        let {width, height} = this.props
        let {all_events, center_event, graphs_num} = this.state
        
        return (
        <div className='merge_infer_sunburst_graph' style={{width: width, height: height, overFlowY: 'auto'}}>
            {
                rangeGenrator(0, graphs_num).map(elm=>
                    <InferSunBurst height={height} events={all_events} index={0} center_event={center_event}/>
                )
            }
        </div>
        )
    }
}