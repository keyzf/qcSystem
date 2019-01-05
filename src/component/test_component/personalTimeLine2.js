// 绘制时间轴
import React, { Component } from 'react'
import dataGetter from '../../dataManager/dataGetter'
import vis from 'vis'
import moment from 'moment'
import 'vis/dist/vis.min.css'
class PersonalTimeLine extends Component {
    constructor(props, context){
        super(props, context)

    }

    componentDidMount(){
        // 之后需要换成id的
        const selected_people = ['苏轼', '杨万里']   //'苏轼', 
        let time_lines = {}
        let groups = new vis.DataSet();
        let group_id_point = 0
        var items = new vis.DataSet();
        let item_id_point = 0
        selected_people.forEach(person => {
            let time_line = dataGetter.getPersonalTimeLineByName(person)
            let this_person_id = group_id_point++

            // console.log(index, person)
            if(time_line){
                time_lines[person] = time_line
                // console.log(time_line)  
                let location = ''
                time_line.forEach(period => {
                    // console.log(period)
                    location = period.Title
                    let Detail = period.Detail
                    if (Detail && Detail.length>1) {
                        Detail.forEach(event => {
                            let time = event.time
                            let activity = event.activity
                            if (item_id_point>100000 || activity.search('诗')!==-1 || activity.search('作')!==-1 || activity.search('提')!==-1) {
                                return
                            }
                            if (time.search('-') !== -1) {
                                // 需要改为范围的
                                let start_time = time.split('-')[0]
                                let end_time = time.split('-')[1]
                                items.add({
                                    id: item_id_point++,
                                    group: this_person_id,
                                    content: '',
                                    start: moment(start_time, 'YYYY'),
                                    end:  moment(end_time, 'YYYY年'),
                                    type: 'range',
                                    title: time + ': ' +activity
                                })
                            }else{
                                let start_time =  moment(time, 'YYYY年MM月DD日')  //now.clone().add(Math.random() * 200, 'hours');  
                                let end_time = start_time.clone().add({'years': 1})
                                items.add({
                                    id: item_id_point++,
                                    group: this_person_id,
                                    content: '',
                                    start: start_time,
                                    end:  end_time,
                                    type: 'point',
                                    title: time + ': ' +activity
                                })
                            }
                        })
                        // // console.log(Detail)
                        // let start_time = Detail[0].time
                        // let end_time = Detail[Detail.length-1].time
                        // if (start_time.search('-') !== -1) {
                        //     start_time = start_time.split('-')[0] + '年'
                        // }
                        // if (end_time.search('-') !== -1) {
                        //     end_time = end_time.split('-')[0] + '年'
                        // }
                        // console.log(start_time, end_time)
                        // items.add({
                        //     id: item_id_point++,
                        //     group: this_person_id,
                        //     content: location,
                        //     start: moment(start_time, 'YYYY年MM月DD日'),
                        //     end:  moment(end_time, 'YYYY年MM月DD日'),
                        //     type: 'background'
                        // })
                    }
                })

                // console.log(sub_groups)
                groups.add({id: this_person_id, content: person})
                // groups.add({id: index, content: names[g]});
            }else{
                console.log(person + '不存在年谱')
            }
        })
      
        console.log(items.length)
        // create visualization
        var container = this.refs.personal_time_line
        var options = {
            groupOrder: 'content',  // groupOrder can be a property name or a sorting function
            editable: true,
            clickToUse: true
        };
        // Follow options
        var follow_options = {
            tooltip: {
            followMouse: true
            }
        };
        var timeline = new vis.Timeline(container, items, groups, options,  follow_options);
    }
    render() {
        return (
            <div className="personal_time_line" >
                <div ref='personal_time_line'/>
                <div ref="tooltips_follow"></div>
            </div>
        );
    }
}

export default PersonalTimeLine;