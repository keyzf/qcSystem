import React from 'react';
import * as d3 from 'd3';

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
    console.log('hh',data);
    return(
    <g className="area" ref="area" translate={translate}>
      <defs>
        <linearGradient id="linear" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#dfdfdf" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#222222" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear0" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#e6eadd" stopOpacity="0.5" />
          <stop offset="100%"   stopColor="#acaf77" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#e6e8d8" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#c4c7a1" stopOpacity="0.8" />
          <stop offset="100%"   stopColor="#a7ad77" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#c8dbe1" stopOpacity="0.5" />
          <stop offset="100%"   stopColor="#4e7884" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#b4bdd3" stopOpacity="0.5" />
          <stop offset="100%"   stopColor="#36539a" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear4" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8ea698" stopOpacity="0.5" />
          <stop offset="100%"   stopColor="#415232" stopOpacity="1.0" />
        </linearGradient>
        <linearGradient id="linear5" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f0ebdf" stopOpacity="0.5" />
          <stop offset="100%"   stopColor="#a19a8a" stopOpacity="1.0" />
        </linearGradient>
      </defs>
      {viewType?data&&data.map((d,i)=>(<path key={i} d={this.area(d)} fill={`url(#linear${i})`}></path>)):data&&<path d={this.area(data)} fill={'url(#linear)'}></path>}
    </g>
    );
  }
}