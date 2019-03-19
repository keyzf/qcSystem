import React from 'react';
import * as d3 from 'd3';

// 3/16 直接画短线段
export default class AreaLineChart extends React.Component {
  constructor(){
    super();
    this.area= d3.area()
                .curve(d3.curveBasis)
  }
  componentDidMount() {
    this.renderArea();
  }

  componentDidUpdate() {
    this.renderArea();
  }

  renderArea() {

  }

  render() {
    let {data,xscale,yscale,translate,viewType} = this.props;
    console.log(data);
    if(viewType){
      data=data.slice(1);
    }
    else{
      data=data[0];
    }
    this.area.x((d)=>xscale(d.x))
              .y1((d)=>yscale(d.y))
              .y0((d)=>yscale(d.y0));
    // console.log('hh',data);
    return(
    <g className="area" ref="area" translate={translate}>
      {viewType?data&&data.map((d,i)=>(<path key={i} d={this.area(d)} fill={`url(#linear${i})`}></path>)):data&&<path d={this.area(data)} fill={'url(#linear)'}></path>}
    </g>
    );
  }
}