import React from 'react';
import * as d3 from 'd3';
import historyevents from '../../data/data_v2_20/历史大事件.json';

export default class HistoryEvent extends React.Component {
  constructor(){
    super();
    let data=[];
    Object.keys(historyevents).map(function(time){
      data.push({'x':parseInt(time),'text':historyevents[time]})
    });
    this.data=data;
    this.line=d3.line();
  }
  componentDidMount() {
    this.renderEvent();
  }

  componentDidUpdate(){
    this.renderEvent();
  }

  renderEvent() {
    let {xscale} = this.props;
    let node = this.refs.history;
    this.line.x((d)=>xscale(d.x))
             .y((d)=>d);
    console.log(this.data);
    d3.select(node)
    .selectAll('.historybubble').remove();
    d3.select(node)
      .selectAll('.historybubble')
      .data(this.data)
      .enter()
      .append('circle')
      .attr('class','historybubble')
      .attr('cx',d=>xscale(d.x))
      .attr('cy',10)
      .attr('r',5)
      .attr('fill','rgba(200,200,200,0.5)')
      .attr('stroke','#454545')
      .on('mouseover',()=>{
        d3.select(node).select('path')
          .attr('d',)
      })
  }

  render() {
    let {width,translate} = this.props;
    return(
    <g className="historyevents" ref="history" transform={translate}>
      <rect width={width} height={20} x={0} y={0} fill={'#ebebeb'}></rect>
      <path></path>
    </g>
    );
  }
}