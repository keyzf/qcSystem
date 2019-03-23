import React from 'react';
import * as d3 from 'd3';

// 3/16 直接画短线段
export default class AreaLineChart extends React.Component {
  constructor(){
    super();
    this.area= d3.area()
                .curve(d3.curveCatmullRom)
    this.data = 0;
    this.eventArray=[];
    this.calculateX2 = this.calculateX2.bind(this);
    this.fillStyle=['#667db6','#2C5364','#FDC830','#ffc3a0','#c0c0aa','#FFEFBA','#ACB6E5'];
  }
  componentDidMount() {
    this.calculatePos();
    // this.renderCircles();
    this.renderCanvas();
  }

  // componentWillReceiveProps(nextProps) {
  //   if(nextProps.data.toString()!==this.data.toString()){
  //     this.data = nextProps.data;
  //     this.calculatePos();
  //   }
  // }

  componentDidUpdate() {
        this.calculatePos();
    // this.renderCircles();
    this.renderCanvas();
  }

  calculatePos() {
    let {data,translate,viewType,selected_person} = this.props;
    console.log(data);
    if(this.data===0&&data.length!==0&&data[0].length!==0){
      let eventArray=[];
      let pox_scale = d3.scaleLinear()
                        .domain([0,10])
                        .range([0.1,3]);
      let neg_scale = d3.scaleLinear()
                        .domain([-10,0])
                        .range([-3,-0.2]);
      let len_scale = d3.scaleLinear()
                        .domain([0,0.0000001,0.001,1])
                        .range([0,0.16,0.25,0.36]);
      data.forEach((data,index)=>{
        let eventCircles = [];
        data.forEach((d,i)=>{
          let y=d.y;
          let x=d.x;
          let len = d.events.length;
          d.events.forEach((event,j)=>{
            let score = event.getScore(selected_person);
            let imp = event.getImp(selected_person);
            let tmp={};
            tmp.y = y*Math.random();
            tmp.x = x+Math.random()-0.5;
            if(score>=0) tmp.k=pox_scale(score)
            else tmp.k=neg_scale(score);
            tmp.len = len_scale(imp);
            eventCircles.push(tmp);
          })
        })
        eventArray.push(eventCircles);
      })
      this.eventArray = eventArray;
      console.log(eventArray);
      this.data=1;
    }
  }

  renderCircles(){
    let {yscale,xscale} = this.props;
    // d3.select(this.refs.area)
    //   .selectAll('circle').remove();
    this.eventArray.forEach((events,index)=>{
      d3.select(this.refs.area)
        .selectAll(`.circle${index}`)
        .data(events)
        .enter()
        .append('circle')
        .attr('class',`circle${index}`)
        .attr('cx',(d,i)=>{
          return xscale(d.x);
        })
        .attr('cy',(d,i)=>{
          return yscale(d.y);
        })
        .attr('r',(d,i)=>{
          return 3;
        })
        .attr('fill','rgba(200,200,200,0.5)')
    })
  }

  renderCanvas(){
    let {yscale,xscale,width,height,viewType} = this.props;
    let canvas = d3.select(this.refs.area).select('canvas').node();
    canvas.width = width*2;
    canvas.height = (height+30)*2;
    canvas.style.width = width + 'px';
    canvas.style.height = (height+30) +'px';

    let context = canvas.getContext("2d");
    let cx,cy,x2,y2,tmp_len,tmp_k;
    context.clearRect(0, 0, width*3, (height+30)*3);
    context.strokeStyle = 'rgba(100,100,100,1.0)';
    context.lineWidth = 2;
    // context.filter = 'blur(4px)';
    let eventArray;
    if(!viewType){
      eventArray = [this.eventArray[0]];
    }else{
      eventArray = this.eventArray.slice(1);
    }
    this.eventArray.forEach((events,index)=>{
      console.log(events,index);
      if(!viewType){
        context.fillStyle = "rgba(120,120,120,0.7)";
        context.strokeStyle = "rgba(120,120,120,0.7)";
      } else {
        context.fillStyle = this.fillStyle[index];
        context.strokeStyle = this.fillStyle[index];
      }
      events.forEach((d,i)=>{
        context.beginPath();
        cx = xscale(d.x)*2;
        cy = (yscale(d.y)+30)*2; //30是设定的上方宽度
        context.moveTo(cx, cy);
        context.arc(cx, cy, d.len*32, 0, 2*Math.PI);
        context.fill();
        context.closePath();
        context.beginPath();
        context.moveTo(cx, cy);
        x2=this.calculateX2(d.len*80,d.k,cx);
        y2 = -d.k*(x2-cx)+cy;
        context.lineTo(x2,y2);
        cx += 3;
        cy +=2;
        context.moveTo(cx, cy);
        tmp_len = d.len*0.6;
        tmp_k = d.k*0.8;
        x2=this.calculateX2(tmp_len*80,tmp_k,cx);
        y2 = -tmp_k*(x2-cx)+cy;
        context.lineTo(x2,y2)
        context.stroke();
        cx -= 4;
        cy -= 5;
        context.moveTo(cx, cy);
        tmp_len = d.len*0.6;
        tmp_k = d.k*1.5;
        x2=this.calculateX2(tmp_len*80,tmp_k,cx);
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
    // else return x1-diff;
  }

  render() {
    let {data,xscale,yscale,translate,viewType,width,height} = this.props;
    // console.log(data);
    if(viewType){
      data=data.slice(1);
    }
    else{
      data=data[0];
    }
    this.area.x((d)=>xscale(d.x))
              .y1((d)=>yscale(d.y))
              .y0((d)=>yscale(d.y0));
    return(
    <g className="area" ref="area" translate={translate}>
      {viewType?data&&data.map((d,i)=>(<path key={i} d={this.area(d)} fill={`url(#linear${i})`}></path>)):data&&<path d={this.area(data)} fill={'url(#linear)'}></path>}
        <foreignObject height={height+30} width={width} y="0" x="0">
          <canvas height={(height+30)*2} width={width*2}></canvas>
        </foreignObject>
    </g>
    );
  }
}