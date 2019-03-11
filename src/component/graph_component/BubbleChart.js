import React from 'react';
import * as d3 from 'd3';

export default class BubbleChart extends React.Component {
  constructor(){
    super();
    this.rscale=d3.scaleLinear()
                  .domain([0,1])
                  .range([0,8]);
    this.bubbleColor=d3.scaleLinear();
    this.openEvent = new Set();
    this.openEventCircle = -1;
  }
  componentDidMount() {
    this.renderBubble();
  }

  componentDidUpdate() {
    this.renderBubble();
  }

  renderBubble() {
    let node=this.refs.bubble;
    let tooltip=this.refs.tooltip;
    let {data,xscale,areaHeight,onEventClick} =this.props;
    let rscale=this.rscale;
    let bubblesMap= new Map();
    let bubbles=[];
    data.forEach(d => {
      d.events.forEach(dd=>{
        if(bubblesMap.has(dd.x)){
          if(bubblesMap.get(dd.x).prob<dd.prob){
            let tmp=bubblesMap.get(dd.x);
            bubblesMap.set(dd.x,{'prob':dd.prob,'count':tmp.count+1});
          }
        }
        else{
          bubblesMap.set(dd.x,{'prob':dd.prob,'count':1});
        }
      })
    });
    for (let [key, value] of bubblesMap) {
      bubbles.push({'x':key,'prob':value.prob,'count':value.count});
    }
    let countDomain = d3.extent(bubbles.map(d=>d.count));
    console.log(bubbles);
    this.bubbleColor.domain(countDomain).range([0.2,0.8]);
    d3.select(node).selectAll('.bubbleWhole')
      .data(bubbles)
      .enter()
      .append('circle')
      .attr('class','bubbleWhole')
      .attr('r',(d)=>{
        return this.rscale(d.prob);
      })
      .attr('cx',d=>xscale(d.x))
      .attr('cy',10)
      .attr('fill',d=>d3.interpolateReds(this.bubbleColor(d.count)))
      .on('click',(d,i)=>{
        let data_year=[];
        if(this.openEvent.has(i)){
          this.openEvent.delete(i);
          d3.select(node).selectAll(`.eventProYear`).remove();
          d3.select(node).selectAll(`.circleEvent${i}`).remove();
        } else{
          this.openEvent.add(i);
          data.forEach((dd,index)=>{
            dd.events.map((ddd=>{
              if(ddd.x===d.x){
                let tmp=dd.eventdata;
                tmp.pro=ddd;
                tmp.index=index;
                data_year.push(tmp);
              }
            }))
          })
          let init_y=10;
          console.log(data_year);
          data_year.sort((a,b)=>b.pro.prob-a.pro.prob);
          d3.select(node).selectAll(`.circleEvent${i}`)
            .data(data_year)
            .enter()
            .append('circle')
            .attr('class',`circleEvent${i}`)
            .attr('r',d=>{
              return this.rscale(d.pro.prob);
            })
            .attr('cx',d=>xscale(d.pro.x))
            .attr('fill','red')
            .attr('fill-opacity',0.5)
            .on('click',function(d,i){
              d3.select(node).selectAll(`.eventProYear`).remove();
              d3.select(node).selectAll(`.eventProYear`)
              .data(data[d.index].events)
              .enter()
              .append('circle')
              .attr('class',`eventProYear`)
              .attr('r',d=>{
                return rscale(d.prob);
              })
              .attr('cx',d=>xscale(d.x))
              .attr('cy',d=>{
                return d3.select(this).attr('cy');
              })
              .attr('fill','red')
              .attr('fill-opacity',0.5);
              onEventClick(data[d.index]);
            })
            .attr('stroke','#')
            .attr('cy',10)
            .transition()
            .delay(100)
            .attr('cy',(d,i)=>{
              init_y = init_y - this.rscale(d.pro.prob)*2;
              return init_y;
            })
          }
      });
    d3.select(node)
      .on('mouseover',()=>{
        let target = d3.select(d3.event.srcElement);
        if(target.attr('class').substr(0,11)==='circleEvent'){
          let mousePos = d3.mouse(node);
          let content='';
          console.log(target.data()[0]);
          if(target.data()[0]){
            content=target.data()[0].trigger.type;
          }
          d3.select(tooltip)
            .attr('visibility','visible')
            .attr('x',mousePos[0]+10)
            .attr('y',mousePos[1])
            .select('text')
            .text(content)
            .attr('x',mousePos[0]+20)
            .attr('y',mousePos[1])
            .attr("dy", ".35em")
            .attr('stroke','#ffffff')
        } else {
          d3.select(tooltip).attr('visibility','hidden');
        }
      })
      .on('mouseout',()=>{
        d3.select(tooltip).attr('visibility','hidden');
      })
  }

  render() {
    console.log('bubble',this.props.data);
    let {data,xscale,translate} = this.props;
    return (
    <g className="bubble" transform={translate}>
      <rect ref="tooltip" width="120" height="180" fill="#303030" rx={10} ry={10}  opacity={0.6} visibility="hidden">
        <text>hha</text>
      </rect>
      <g ref="bubble"></g>
      {/* {
        data && data.map((eve)=>{
          return eve.events.map((d,i)=>{
            return (<circle key={i} r={this.rscale(d.prob)} cx={xscale(d.x)} cy={10} fill="red" fillOpacity={0.4} onMouseOver={this.mouseOver(this)}/>)
          })
        })
      } */}
    </g>
    );
  }
}