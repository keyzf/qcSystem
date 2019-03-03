import React, { Component } from 'react'
import dataStore, { eventManager, addrManager, personManager, isValidYear, triggerManager, range_genrator } from '../../dataManager/dataStore2'
import {XYPlot, LineSeriesCanvas, MarkSeries, XAxis, YAxis, Highlight, AreaSeries} from 'react-vis';

class MyBrush extends React.Component{
    static get defaultProps() {
        return {
          width: 200,
          height: 100,
          range: [0,10],
          input_list: undefined,
          onChange: range => {}
        };
    }


    render(){
        let {width, height, range, input_list, onChange} = this.props
        if (input_list) {
            range = [ Math.min(...input_list), Math.max(...input_list)]
        }

        let line_data = [
            {x: range[0], y: 1, y0: 0.1},
            {x: range[1], y: 1, y0: 0.1}
        ]
        const selfOnChange = area => {
            if (area) {
                let {right, left} = area  //, bottom, top
                left = left<range[0]? range[0] : left
                right = right>range[1]? range[1] : right
                onChange([left, right])
            }else{
                onChange(undefined)
            }
        }
        let freque_line_datas = []
        const key_set = [...new Set(input_list)]
        // console.log(input_list)
        let max_num = 0
        key_set.forEach(key => {
            const num = input_list.filter(elm=>elm===key).length
            max_num = max_num>num? max_num: num
            freque_line_datas.push([
                {
                    x: parseInt(key),
                    y: 0
                },
                {
                    x: parseInt(key),
                    y: num
                }
            ])
        })
        freque_line_datas = freque_line_datas.map(elm =>{
            elm[1].y = elm[1].y/max_num
            return elm
        })
        // console.log(freque_line_datas)
        return (
        <XYPlot
        width={width}
        height={height}
        yDomain={[0,1]}
        >
            <AreaSeries
            data={line_data}
            strokeWidth = {20}
            />
            {/* <YAxis/> */}
            <XAxis/>
            <Highlight
            drag
            enableY={false}
            onDragEnd={selfOnChange}
            onBrushEnd={selfOnChange}
            />
            {
                freque_line_datas.map(data=>
                    <LineSeriesCanvas
                        key= { 'freq_line' + data[0].x }
                        data = {data}
                        color = 'black'
                    />
                )
            }
        </XYPlot>
        )
    }
}

export {MyBrush}