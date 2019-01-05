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

        var now = moment().minutes(0).seconds(0).milliseconds(0);

        const selected_people = ['苏轼']
        let time_lines = {}
        let groups = new vis.DataSet();
        let group_id_point = 0
        var items = new vis.DataSet();
        let item_id_point = 0
        selected_people.forEach(person => {
            let time_line = dataGetter.getPersonalTimeLineByName(person)
            // console.log(index, person)
            if(time_line){
                time_lines[person] = time_line
                console.log(time_line)  
                
                let sub_groups = []
                time_line.forEach(period => {
                    // console.log(period)
                    if (sub_groups.length>5) {
                        return
                    }
                    let location = period.Title
                    let Detail = period.Detail
                    if (Detail) {
                        // console.log(Detail)
                        groups.add({'id': group_id_point, 'content': location, 'showNested' : false})
                        sub_groups.push(group_id_point)

                        Detail.forEach(event => {
                            let time = event.time
                            let activity = event.activity.slice(0,5)
                            // if (item_id_point>50) {
                            //     return
                            // }
                            if (time.search('-') !== -1) {
                                // 需要改为范围的
                                let start_time = time.split('-')[0]
                                let end_time = time.split('-')[1]
                                items.add({
                                    id: item_id_point++,
                                    group: group_id_point,
                                    content: activity,
                                    start: moment(start_time, 'YYYY'),
                                    end:  moment(end_time, 'YYYY年'),
                                    type: 'range'
                                })
                            }else{
                                let start_time =  moment(time, 'YYYY年MM月DD日')  //now.clone().add(Math.random() * 200, 'hours');  
                                let end_time = start_time.clone().add({'years': 1})
                                items.add({
                                    id: item_id_point++,
                                    group: group_id_point,
                                    content: activity,
                                    start: start_time,
                                    end:  end_time,
                                    type: 'point'
                                })
                            }
                        })
                        group_id_point++
                    }

                })
                // console.log(sub_groups)
                groups.add({id: group_id_point, content: person, nestedGroups: sub_groups})
                group_id_point++
                // groups.add({id: index, content: names[g]});
            }else{
                console.log(person + '不存在年谱')
            }
        })
      
        console.log(items.length)
        // create a dataset with items
        // var now = moment().minutes(0).seconds(0).milliseconds(0);
        // var itemCount = 60;
      
        // // create a data set with groups
        // var groups = new vis.DataSet();
      
        // groups.add([
        //   {
        //     id: 1,
        //     content: "Lee",
        //     nestedGroups: [11,12,13]
        //   },
        //   {
        //     id: 2,
        //     content: "invisible group",
        //     visible: false
        //   },
        //   {
        //     id: 3,
        //     content: "John",
        //     nestedGroups: [14],
        //     showNested: false
        //   },
        //   {
        //     id: 4,
        //     content: "Alson"
        //   },
      
        // ]);
      
        // groups.add([
        //   {
        //     id: 11,
        //     content: "cook",
        //   },
        //   {
        //     id: 12,
        //     content: "shop",
        //   },
        //   {
        //     id: 13,
        //     content: "clean house",
        //   },
        //   {
        //     id: 14,
        //     content: "wash dishes",
        //   }
        // ]);
      
        // // create a dataset with items
        // var items = new vis.DataSet();
        // var groupIds = groups.getIds();
        // var types = [ 'box', 'point', 'range', 'background']
        // for (var i = 0; i < itemCount; i++) {
        //   var start = now.clone().add(Math.random() * 200, 'hours');
        //   var end = start.clone().add(2, 'hours');
        //   var randomGroupId = groupIds[Math.floor(Math.random() * groupIds.length)];
        //   var type = types[Math.floor(4 * Math.random())]
      
        //   items.add({
        //     id: i,
        //     group: randomGroupId,
        //     content: 'item ' + i,
        //     start: start,
        //     end: end,
        //     type: type
        //   });
        // }

        // create visualization
        var container = this.refs.personal_time_line
        var options = {
            groupOrder: 'content'  // groupOrder can be a property name or a sorting function
        };

        var timeline = new vis.Timeline(container, items, groups, options);

        // selected_people.fo
        // var now = moment().minutes(0).seconds(0).milliseconds(0);
        // var groupCount = selected_people.forEach.length;
        // var itemCount = 20;
      
        // create a data set with groups
        // var names = ['John', 'Alston', 'Lee', 'Grant'];
        // var groups = new vis.DataSet();
        // for (var g = 0; g < groupCount; g++) {
        //   groups.add({id: g, content: names[g]});
        // }


        // // create a dataset with items
        // var items = new vis.DataSet();
        // for (var i = 0; i < itemCount; i++) {
        //   var start = now.clone().add(Math.random() * 200, 'hours');
        //   var group = Math.floor(Math.random() * groupCount);
        //   items.add({
        //     id: i,
        //     group: group,
        //     content: 'item ' + i +
        //         ' <span style="color:#97B0F8;">(' + names[group] + ')</span>',
        //     start: start,
        //     type: 'box'
        //   });
        // }
        // console.log(items)
        // // create visualization
        // var container = this.refs.personal_time_line;
        // var options = {
        //   groupOrder: 'content'  // groupOrder can be a property name or a sorting function
        // };
      
        // var timeline = new vis.Timeline(container);
        // timeline.setOptions(options);
        // timeline.setGroups(groups);
        // timeline.setItems(items);
    }
    render() {
        return (
            <div className="personal_time_line" ref='personal_time_line'>
                
            </div>
        );
    }
}

export default PersonalTimeLine;