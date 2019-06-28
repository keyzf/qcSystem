import React from 'react';
import * as d3 from 'd3';

export default class EventChart extends React.Component {
  constructor(){
    super();
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
    let {data,xscale,yscale,translate} = this.props;
    // console.log('hh',data);
    return(
    <g className="events" ref="events" translate={translate}>
      {data && data.map((type)=>{if(type) return type.map((d,i)=>(<circle key={i} cx={xscale(d.data.x)} cy={yscale(d.data.y)} r={3} fill={'green'}></circle>))})}
    </g>
    );
  }
}