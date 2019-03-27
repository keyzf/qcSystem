import React from 'react';
import * as d3 from 'd3';
import rough from 'roughjs/dist/rough.umd.js';

// 3/16 直接画短线段
export default class MountainView extends React.Component {
  constructor(){
    super();
    // this.area= d3.area()
                // .curve(d3.curveBasis)
    this.line = d3.line();
    this.processLineData = this.processLineData.bind(this);
    this.calculateX2 = this.calculateX2.bind(this);
  }
  componentDidMount() {
    this.renderArea();
  }

  componentDidUpdate() {
    this.renderArea();
  }

  renderArea() {
    let {data,xscale,yscale,translate,viewType,selected_person} = this.props;
    let colors = ['#454545','#0F3F53','#1B5D59','#AB8E52','#92AA84','#DBB397']
    if(data[0]){
    console.log(data);
      if(viewType){
        data=data.slice(1);
      }
      else{
        data=[data[0]];
      }
      let DataArray = this.processLineData(data,selected_person);
      console.log(DataArray);
      let node = this.refs.area;
      const rc = rough.svg(d3.select(node));
      d3.select(node).selectAll('g').remove();
      DataArray.line.forEach((lineData,i)=>{
        let rec = rc.path(this.line(lineData),{hachureGap:1.5,roughness:0.8,bowing: 3, strokeWidth: 1.6, stroke: colors[i]}); // x, y, width, height
        d3.select(rec).attr('filter',"url(#dropshadow)")
        node.appendChild(rec);
      });
      DataArray.events.forEach((eventArray,i)=>{
        eventArray.forEach((event,j)=>{
          let rec = rc.line(xscale(event.x1),yscale(event.y1),xscale(event.x2),yscale(event.y2),{hachureGap:1.5,roughness:0.8,bowing: 3, strokeWidth: 1.2, stroke: 'rgba(80,80,80,1)'}); // x, y, width, height
          // d3.select(rec).attr('filter',"url(#dropshadow)")
          node.appendChild(rec);
        })
      })
    }
  }

  processLineData(dataArray,selected_person){
    let finalResult={};
    let result=[];
    let eventResult=[];
    dataArray.forEach((data,i)=>{
      let lineData=[];
      let eventLineArray=[];
      for(let i=0;i<data.length;i++){
        let k1=0;
        let b1=0;
        let k0=0;
        let b0=0;
        if(i<data.length-1){
          let year0=data[i].x, year1=data[i+1].x;
          let interval=1;
          k1=(data[i+1].y-data[i].y)/(year1-year0);
          b1=data[i].y-k1*year0;
          for(let j=year0;j<year1;j+=interval){
            let tmp={};
            tmp.x=j;
            tmp.y = k1*j+b1;
            if(tmp.y!==0){lineData.push(tmp);}
            interval=Math.random()*3;
          }
        }
        if(i>0){
          k0 = (data[i].y-data[i-1].y)/(data[i].x-data[i-1].x);
          b0=data[i].y-k0*data[i].x;
        }
        // 计算事件点
        let x = data[i].x;
        let y = data[i].y;
        let pox_scale = d3.scaleLinear()
                          .domain([0,10])
                          .range([0.1,3]);
        let neg_scale = d3.scaleLinear()
                          .domain([-10,0])
                          .range([-3,-0.2]);
        let len_scale = d3.scaleLinear()
                          .domain([0,0.0000001,0.001,1])
                          .range([0,0.16,0.25,0.36]);
        let eventData=[];
        data[i].events.forEach((event,i)=>{
          let tmp={};
          let score = event.getScore(selected_person);
          let imp = event.getImp(selected_person);
          if(score>=0) tmp.k=pox_scale(score)
          else tmp.k=neg_scale(score);
          tmp.len = len_scale(imp);
          tmp.year=x;
          tmp.event=event;
          eventData.push(tmp);
        })
        eventData.sort((a,b)=>{
          if(a.k>=0&&b.k>=0) return a.k-b.k;
          else if(a.k<0&&b.k<0) return b.k-a.k;
          else if(a.k>=0&&b.k<0) return -1;
          else return 1;
        })
        let len= eventData.length;
        eventData.forEach((d,i)=>{
          let stopy2;
          let level = i/15;
          let num = i%15;
          if(num<8){
            d.x1 = d.year-0.5+num/15.0;
            d.y1 = (k0*d.x1+b0)-level*y*0.05;
            d.x2 = this.calculateX2(d.len,d.k,d.x1);
            d.y2 = d.k*(d.x2-d.x1)+d.y1;
            stopy2 = k0*d.x2+b0-0.12;
            if(d.y2>stopy2){
              d.y1 = d.y1-(d.y2-stopy2);
              d.y2 = d.y2-(d.y2-stopy2);
            }
          }else{
            d.x1 = d.year-0.5+num/15.0;
            d.y1 = (k1*d.x1+b1)-level*y*0.05;
            d.x2 = this.calculateX2(d.len,d.k,d.x1);
            d.y2 = d.k*(d.x2-d.x1)+d.y1;
            stopy2 = k1*d.x2+b1-0.12;
            if(d.y2>stopy2){
              d.y1 = d.y1-(d.y2-stopy2);
              d.y2 = d.y2-(d.y2-stopy2);
            }
          }
          eventLineArray.push(d);
        })
      }
      eventResult.push(eventLineArray);
      result.push(lineData);
    })
    finalResult.line = result;
    finalResult.events = eventResult;
    return finalResult;
  }

  calculateX2(len,k,x1){
    let diff = len/Math.sqrt(k*k+1);
    if(k>0) return x1+diff;
    else return x1-diff;
  }

  render() {
    let {data,xscale,yscale,translate,viewType} = this.props;
    // console.log(data);
    if(viewType){
      data=data.slice(1);
    }
    else{
      data=data[0];
    }
    // this.area.x((d)=>xscale(d.x))
    //           .y1((d)=>yscale(d.y))
    //           .y0((d)=>yscale(d.y0));
    this.line=d3.line()
                .x((d)=>xscale(d.x))
                .y((d)=>yscale(d.y))
                .curve(d3.curveCatmullRom);
    return(
    <g className="area" ref="area" translate={translate}>
      <defs>
      <filter id="dropshadow" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/> 
        <feOffset dx="1" dy="2" result="offsetblur"/> 
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      </defs>
      {/* {viewType?data&&data.map((d,i)=>(<path key={i} d={this.line(d)} fill={`url(#linear${i})`}></path>)):data&&<path d={this.area(data)} fill={'url(#linear)'}></path>} */}
    </g>
    );
  }
}