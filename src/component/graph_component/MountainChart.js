import React from 'react';
import * as d3 from 'd3';
import stateManager from '../../dataManager/stateManager'
import { autorun } from 'mobx';
import mo from '../../static/mo.png';

// 3/16 直接画短线段
export default class AreaLineChart extends React.Component {
  constructor(){
    super();
    this.area= d3.area()
                .curve(d3.curveMonotoneX)
    this.eventArray=[];
    this.calculateX2 = this.calculateX2.bind(this);
    this.imp_scale = d3.scaleLinear()
                      .domain([0,0.001,0.01,0.1,1])
                      .range([0.4,0.5,0.6,0.9,1]);
    this.angle_scale = d3.scaleLinear()
                      .domain([-10,0,10])
                      .range([90,0,-90]);
  }
  componentDidMount() {
    this.calculatePos(this.props.data);
    this.renderCircles();
    // this.renderCanvas();
  }


  // _onEventFilterChange = autorun(()=>{
  //   if (stateManager.is_ready) {
  //       let used_types = stateManager.used_types
  //       let need_refesh = stateManager.need_refresh
  //       this.calculatePos();
  //       this.renderCircles();
  //   }
  // })

  componentWillReceiveProps(nextProps){
    if(nextProps.data.toString()!==this.props.data.toString()){
      this.calculatePos(nextProps.data);
    }
    this.renderCircles();
  }

  calculatePos(data) {
    let {selected_person} = this.props;
    if(data.length!==0&&data[0].length!==0){
      let eventArray=[];
      data.forEach((data,index)=>{
        let eventCircles = [];
        data.forEach((d,i)=>{
          let y0 = d.y0;
          let y=d.y;
          let x=d.x;
          let len = d.events.length;
          d.events.forEach((event,j)=>{
            let score = event.getScore(selected_person);
            let imp = event.getImp(selected_person);
            let tmp={};
            tmp.y= y0+(y-y0)*this.imp_scale(imp);
            if(tmp.y<0.1) return tmp.y=0.1;
            tmp.x = x-0.5+j/len;
            tmp.k = this.angle_scale(score);
            tmp.len = this.imp_scale(imp);
            tmp.event=event;
            tmp.id=event.id;
            eventCircles.push(tmp);
          })
        })
        eventArray.push(eventCircles);
      })
      this.eventArray = eventArray;
    }
  }

  renderCircles(){
    let {yscale,xscale,onMouseOver,onMouseOut,onMouseClick,width,height,viewType} = this.props;
    const node = this.refs.area;
    // d3.select(this.refs.area)
    //   .selectAll('circle').remove();
    let dom;
    if(this.eventArray.length>0){
      let eventArray;
      // if(!viewType){
      //   eventArray = [this.eventArray[0]];
      //   d3.select(this.refs.area)
      //     .select('.certainEventPoint')
      //     .selectAll('image').attr('visibility','visible');
      //   d3.select(this.refs.area)
      //     .select('.certainEventPoint')
      //     .selectAll('image:not(.circle0)').attr('visibility','hidden');
      // }else{
        eventArray = this.eventArray.slice(1);
      //   d3.select(this.refs.area)
      //     .select('.certainEventPoint')
      //     .selectAll('image').attr('visibility','visible');
      //   d3.select(this.refs.area)
      //     .select('.certainEventPoint')
      //     .selectAll('.circle0').attr('visibility','hidden');
      // }
      eventArray.forEach((events,index)=>{
        // if(!viewType){
          dom = d3.select(this.refs.area)
          .select('.certainEventPoint')
          .selectAll(`.circle${index}`)
          .data(events,(d)=>d.id)
        // } else {
        //   dom = d3.select(this.refs.area)
        //   .select('.certainEventPoint')
        //   .selectAll(`.circle${index+1}`)
        //   .data(events)
        // }
        dom.attr('x',(d,i)=>{
                return xscale(d.x);
              })
            .attr('y',(d,i)=>{
              return yscale(d.y);
            })
            .attr('transform',(d)=>`rotate(${d.k},${xscale(d.x)},${yscale(d.y)})`)
        dom.exit().remove();
        dom.enter()
           .append("svg:image")
           .attr('class',(d)=>{
                if(d.event.is_change){
                  return `circle${index} circleimg change`
                }else{
                  return `circle${index} circleimg`
                }
              })
           .attr('x',(d,i)=>{
                return xscale(d.x);
              })
            .attr('y',(d,i)=>{
                  return yscale(d.y);
                })
            .attr('width',(d)=>d.len*20)
            .attr('height',(d)=>d.len*20)
            .attr("xlink:href",mo)
            .attr('opacity',0.1)
            .attr('transform',(d)=>`rotate(${d.k},${xscale(d.x)},${yscale(d.y)})`)
            .on('mouseover',function(d){
              let pos = d3.mouse(node);
              let x= pos[0]+10;
              if(pos[0]+10+160>width) x = pos[0]-180;
              let y = pos[1]-100;
              y= y-10<0? 10: y;
              y = y+160>height? y-20: y;
              onMouseOver(d.event,[x,y]);
              d3.select(this).attr('opacity',1.0);
            })
            .on('mouseout',function(d){
              onMouseOut();
              d3.select(this).attr('opacity',0.1)
            })
            .on('mousedown',function(d){
              let pos = d3.mouse(node);
              let x= pos[0]+10;
              if(pos[0]+10+160>width) x = pos[0]-180;
              let y = pos[1]-100;
              y= y-10<0? 10: y;
              y = y+160>height? y-20: y;
              onMouseClick(d.event,[x,y]);
            });
            // dom.enter()
        //   .append('circle')
        //   .attr('class',()=>{
        //     if(!viewType){
        //       return `circle${index}`
        //     }else{
        //       return `circle${index+1}`
        //     }
        //   })
        //   .attr('cx',(d,i)=>{
        //     return xscale(d.x);
        //   })
        //   .attr('cy',(d,i)=>{
        //     return yscale(d.y);
        //   })
        //   .attr('r',(d,i)=>{
        //     return d.len*8;
        //   })
        //   .attr('fill','rgb(200,200,200)')
        //   .attr('fill-opacity',(d)=>d.len)
          // .on('mouseover',(d)=>{
          //   let pos = d3.mouse(this.refs.area);
          //   let x= pos[0]+10;
          //   if(pos[0]+10+160>width) x = pos[0]-180;
          //   let y = pos[1]-100;
          //   y= y-10<0? 10: y;
          //   y = y+160>height? y-20: y;
          //   onMouseOver(d.event,[x,y]);
          // })
          // .on('mouseout',(d)=>{
          //   onMouseOut();
          // })
          // .on('mousedown',(d)=>{
          //   let pos = d3.mouse(this.refs.area);
          //   let x= pos[0]+10;
          //   if(pos[0]+10+160>width) x = pos[0]-180;
          //   let y = pos[1]-100;
          //   onMouseClick(d.event,[x,y]);
          // });
      })
    }
  }

  hoverEventPoints(name){
    d3.select(this.refs.area)
            .select('.certainEventPoint')
            .selectAll('image')
            // .style('mix-blend-mode','soft-light')
            .attr('opacity',0.1)
    let dom = d3.select(this.refs.area)
            .select('.certainEventPoint')
   .selectAll('image')         
            .filter((d,i)=>{
              return d.event.trigger.getName() === name
            })
    dom
    // .style('mix-blend-mode','hard-light')
    .attr('opacity',1.0)
  }

  renderCanvas(){
    let {yscale,xscale,width,height,viewType,index} = this.props;
    let canvas = d3.select(this.refs.area).select(`#canvas${index}`).node();
    canvas.width = width;
    canvas.height = (height+30);
    canvas.style.width = width + 'px';
    canvas.style.height = (height+30) +'px';

    let context = canvas.getContext("2d");
    let cx,cy,x2,y2,tmp_len,tmp_k;
    context.clearRect(0, 0, width, (height+30));
    context.strokeStyle = 'rgba(100,100,100,1.0)';
    context.lineWidth = 1;
    // context.filter = 'blur(4px)';
    let eventArray;
    if(!viewType){
      eventArray = [this.eventArray[0]];
    }else{
      eventArray = this.eventArray.slice(1);
    }
    this.eventArray.forEach((events,index)=>{
      if(!viewType){
        context.fillStyle = "rgba(120,120,120,0.7)";
        context.strokeStyle = "rgba(120,120,120,0.7)";
      } else {
        context.fillStyle = this.fillStyle[index];
        context.strokeStyle = this.fillStyle[index];
      }
      events.forEach((d,i)=>{
        context.beginPath();
        cx = xscale(d.x);
        cy = (yscale(d.y)+30); //30是设定的上方宽度
        context.moveTo(cx, cy);
        context.arc(cx, cy, d.len*20, 0, 2*Math.PI);
        context.fill();
        context.closePath();
        context.beginPath();
        context.moveTo(cx, cy);
        x2=this.calculateX2(d.len*40,d.k,cx);
        y2 = -d.k*(x2-cx)+cy;
        context.lineTo(x2,y2);
        cx += 1;
        cy +=1;
        context.moveTo(cx, cy);
        tmp_len = d.len*0.6;
        tmp_k = d.k*0.8;
        x2=this.calculateX2(tmp_len*40,tmp_k,cx);
        y2 = -tmp_k*(x2-cx)+cy;
        context.lineTo(x2,y2)
        context.stroke();
        cx -= 2;
        cy -= 2;
        context.moveTo(cx, cy);
        tmp_len = d.len*0.6;
        tmp_k = d.k*1.5;
        x2=this.calculateX2(tmp_len*40,tmp_k,cx);
        y2 = -tmp_k*(x2-cx)+cy;
        context.lineTo(x2,y2)
        context.stroke();
        context.closePath();
      })
    })
    context.fill();
  }

  calculateX2(len,k,x1){
    let diff = len/Math.sqrt(k*k+1);
      return x1+diff;
  }

  render() {
    let {data,xscale,yscale,translate,viewType,selectTrigger} = this.props;
    if(viewType){
      data=data.slice(1);
    }
    else{
      data=data[0];
    }
    this.hoverEventPoints(selectTrigger);
    // console.log(data);
    this.area.x((d)=>xscale(d.x))
              .y1((d)=>yscale(d.y))
              .y0((d)=>yscale(d.y0));
    return(
    <g className="area" ref="area" translate={translate}>
      {viewType?data&&data.map((d,i)=>{
        return (<path key={i} d={this.area(d)} fill={`url(#linear${i})`}></path>)}):data&&<path d={this.area(data)} fill={'url(#linear)'}></path>}
      <g className="certainEventPoint"></g>
    </g>
    );
  }
}