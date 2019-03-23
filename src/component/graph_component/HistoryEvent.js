import React from 'react';
import * as d3 from 'd3';
import historyevents from '../../data/data_v2_20/历史大事件.json';
import empire from '../../data/data_v2_20/宋代皇帝年表.json';
import './historyEvent.scss';
import clear from '../../static/clear.png';

export default class HistoryEvent extends React.Component {
  constructor(){
    super();
    let data=[];
    let years = [];
    Object.keys(historyevents).map(function(time){
      data.push({'x':parseInt(time),'text':historyevents[time]})
    });
    Object.keys(empire).map(function(time){
      years.push(parseInt(time));
    });
    console.log(empire);
    this.data=data;
    this.years=years;
    this.line=d3.line();
    this.selected = 0;
    this.closePopup = this.closePopup.bind(this);
  }
  componentDidMount() {
    this.renderEvent();
  }

  componentDidUpdate(){
    this.renderEvent();
  }

  renderEvent() {
    let {xscale,height,uncertainHeight} = this.props;
    let node = this.refs.history;
    this.line.x((d)=>xscale(d.x))
             .y((d)=>d);
    console.log(this.data);

    let datadom = d3.select(node)
      .selectAll('.historybubble')
      .data(this.data);
    datadom.exit().remove();
    datadom.attr('cx',d=>xscale(d.x))
    datadom
      .enter()
      .append('circle')
      .attr('class','historybubble')
      .attr('cx',d=>xscale(d.x))
      .attr('cy',8)
      .attr('r',4)
      .attr('fill','rgba(200,200,200,0.5)')
      .attr('stroke','rgba(150,150,150,0.9)')
      .on('mouseover',(d)=>{
          d3.select(node).selectAll('line')
            .attr('visibility','visible')
            .attr('x1',xscale(d.x))
            .attr('x2',xscale(d.x))
            .attr('y1',15)
            .attr('y2',height-uncertainHeight+15)
            .attr('style',"stroke:rgba(99,99,99,0.6);stroke-width:2;stroke-dasharray:6")
          d3.select(node).select('foreignObject').attr('x',()=>{
            if(xscale(d.x)>780) return xscale(d.x)-480;
            else return xscale(d.x)+10;
          }).attr('visibility','visible');
          d3.select('#historytip')
            .select('div:first-child')
            .select('span')
            .text((dd)=>{
              let index = this.years[d3.bisectLeft(this.years,parseInt(d.x))];
              return d.x+' '+empire[index].姓名+' '+empire[index].称号
            })
          d3.select('#historytip')
            .select('div:last-child')
            .selectAll('span')
            .data(d.text)
            .enter()
            .append('li')
            .text((dd,i)=>{
              return dd;
            })
      })
      .on('mouseout',(d)=>{
        if(!this.selected){
          d3.select(node).selectAll('line')
            .attr('visibility','hidden');
          d3.select(node).select('foreignObject').attr('visibility','hidden');
        }
      })
      .on('mousedown',(d)=>{
        d3.select(node).selectAll('line')
        .attr('visibility','visible');
        d3.select(node).select('foreignObject').attr('visibility','visible');
        this.selected = 1;
      })
  }

  closePopup(){
    let node = this.refs.history;
    d3.select(node).selectAll('line')
      .attr('visibility','hidden');
    d3.select(node).select('foreignObject').attr('visibility','hidden');
    this.selected = 0;
  }

  render() {
    let {width,translate} = this.props;
    return(
    <g className="historyevents" ref="history" transform={translate}>
      <rect width={width} height={16} x={0} y={0} fill={'#ebebeb'}></rect>
      <line></line>
      <foreignObject x="20" y="22" width="480" height="130" visibility="hidden">
        <div id="historytip" style={{width:470,height:125,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div><span></span><img src={clear} onClick={this.closePopup}></img></div>
          <div></div>
        </div>
      </foreignObject >
    </g>
    );
  }
}