import React from 'react';
import * as d3 from 'd3';

export default class BubbleChart extends React.Component {
  constructor(){
    super();
    this.rscale=d3.scaleLinear()
                  .domain([0,1])
                  .range([1,11]);
    this.bubbleColor=d3.scaleLinear();
    this.openEvent = new Set();
    this.openEventCircle = -1;
    this.metaballs={
      blurDeviation: 10,
      colorMatrix: '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -10',
    };
    this.init=this.init.bind(this);
  }
  componentDidMount() {
    this.addMetaballs();
    this.renderBubble();
    this.init();
  }

  componentDidUpdate() {
    this.renderBubble();
    this.init();
  }

  addMetaballs(){
    let node = this.refs.bubbleGraph;
    let bubble = this.refs.bubble;
    const defs = d3.select(node).append('defs');
    const filter = defs.append('filter').attr('id', 'metaballs');

    filter
        .append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', this.metaballs.blurDeviation)
        .attr('result', 'blur');

    filter
        .append('feColorMatrix')
        .attr('in', 'blur')
        .attr('mode', 'matrix')
        .attr('values', this.metaballs.colorMatrix)
        .attr('result', 'contrast');

    filter
        .append('feBlend')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'contrast');
    
    d3.select(bubble).style('filter', `url(#metaballs)`);
  }

  renderBubble() {
    console.log('rerender bubble')
    let node=this.refs.bubble;
    let {data,xscale,onEventClick,onMouseClick,width,areaHeight} =this.props;
    let rscale=this.rscale;
    let bubbles=[];
    for(let key in data){
      let datum = data[key];
      let count = datum.length;
      let interval = 1.0/(count-1);
      key = parseInt(key);
      let tmp = 0;
      let len=0;
      datum.forEach((d,i) => {
        d.max_prob_year = key;
        len+=rscale(d.prob_year[key]);
      });
      if(len<xscale(0.5)-xscale(0)){
        let x_start = xscale(key)-len+6;
        for(let i=0;i<datum.length;i++){
          datum[i].x=x_start;
          if(i<datum.length-1){
            x_start+=rscale(datum[i].prob_year[key])+rscale(datum[i+1].prob_year[key]);
          }
          bubbles.push(datum[i]);
        }
      }
      else{
        datum.forEach((d,i) => {
          d.max_prob_year = key;
          if(i%2!==0){
            tmp= interval * (i/2);
          }
          else {
            tmp = -tmp;
          }
          d.x = xscale(key+ tmp);
          bubbles.push(d);
        });
      }
    }

    let newBubble = d3.select(node).selectAll('.bubbleWhole').data(bubbles,d=>d.id);
    newBubble.attr('cx',d=>{
      return d.x;
    })
    newBubble.exit().remove();
    newBubble
      .enter()
      .append('circle')
      .attr('class','bubbleWhole')
      .attr('r',(d)=>{
        if(d.prob_year[d.max_prob_year]){
          return rscale(d.prob_year[d.max_prob_year]);
        }else{
          return 6;
        }
      })
      .attr('cx',d=>{
        return d.x;
      })
      .attr('cy',10)
      .attr('fill','#454545')
      .attr('fill-opacity',0.5)
      .on('click',(d)=>{
        onEventClick(d);
        let pos = d3.mouse(node);
        let x= pos[0]+10;
        if(pos[0]+10+160>width) x = pos[0]-180;
        let y = pos[1]+areaHeight-100
        onMouseClick(d,[x,y])
      })
  }

  init(){
    let node=this.refs.bubble;
    let {onMouseOver,onMouseOut,width,areaHeight} =this.props;
    d3.select(node)
    .on('mouseover',()=>{
      let target = d3.select(d3.event.srcElement);
      d3.select(node).selectAll('.bubbleWhole')
        .attr('stroke',null)
      if(target.attr('class').substr(0,11)==='bubbleWhole'){
        let pos = d3.mouse(node);
        let x= pos[0]+10;
        if(pos[0]+10+160>width) x = pos[0]-180;
        let y = pos[1]+areaHeight-100
        onMouseOver(target.data()[0],[x,y])
        target.attr('fill','#F37335').raise();
      }
    })
    .on('mouseout',function(){
      onMouseOut();
      d3.select(node).selectAll('.bubbleWhole')
       .attr('fill','#454545')
    })
  }

  render() {
    let {data,xscale,translate} = this.props;
    return (
    <g className="bubble" ref="bubbleGraph" transform={translate}>
      <g ref="bubble" transform={`translate(0,5)`}></g>
    </g>
    );
  }
}