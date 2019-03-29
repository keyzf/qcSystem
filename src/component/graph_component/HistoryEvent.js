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

    let datadom = d3.select(node)
      .selectAll('.historybubble')
      .data(this.data);
    datadom.exit().remove();
    datadom.attr('x1',d=>xscale(d.x))
    .attr('x2',d=>xscale(d.x))
    datadom
      .enter()
      .append('line')
      .attr('class','historybubble')
      .attr('x1',d=>xscale(d.x))
      .attr('x2',d=>xscale(d.x))
      .attr('y1',-1)
      .attr('y2',13)
      .attr('stroke','rgba(100,100,100,0.6)')
      .attr('stroke-dasharray',"2 1")
      .attr('stroke-width',1)
      .on('mouseover',(d)=>{
          d3.select(node).select('.historyLine')
            .attr('visibility','visible')
            .attr('x1',xscale(d.x))
            .attr('x2',xscale(d.x))
            .attr('y1',-height)
            .attr('y2',0)
          d3.select(node).select('foreignObject').attr('x',()=>{
            if(xscale(d.x)>780) return xscale(d.x)-480;
            else return xscale(d.x)+10;
          }).attr('visibility','visible');
          d3.select('#historytip')
            .select('div:first-child')
            .select('span')
            .text((dd)=>{
              let index = d3.bisectRight(this.years,parseInt(d.x));
              if(index===0){
                return ''
              } else {
                index = this.years[d3.bisectRight(this.years,parseInt(d.x))-1];
                return d.x+' '+empire[index].姓名+' '+empire[index].称号;
              }
            })
          d3.select('#historytip')
            .select('div:last-child')
            .selectAll('li').remove();
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
          d3.select(node).select('.historyLine')
            .attr('visibility','hidden');
          d3.select(node).select('foreignObject').attr('visibility','hidden');
        }
      })
      .on('mousedown',(d)=>{
        d3.select(node).select('.historyLine')
        .attr('visibility','visible');
        d3.select(node).select('foreignObject').attr('visibility','visible');
        this.selected = 1;
      })
  }

  closePopup(){
    let node = this.refs.history;
    d3.select(node).select('.historyLine')
      .attr('visibility','hidden');
    d3.select(node).select('foreignObject').attr('visibility','hidden');
    this.selected = 0;
  }

  render() {
    let {height,translate} = this.props;
    return(
    <g className="historyevents" ref="history" transform={translate}>
      {/* <rect width={width} height={16} x={0} y={0} fill={'#ebebeb'}></rect> */}
      <line className="historyLine"></line>
      <foreignObject x={"20"} y={-height+55} width="480" height="130" visibility="hidden">
        <div id="historytip" style={{width:470,height:125,position:'absolute',backgroundColor:'rgba(0,0,0,0.4)'}}>
          <div><span></span><img src={clear} onClick={this.closePopup}></img></div>
          <div className="historyContent"></div>
        </div>
      </foreignObject >
    </g>
    );
  }
}