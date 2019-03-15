import React from 'react';
import * as d3 from 'd3';

export default class HistoryEvent extends React.Component {
  constructor(){
    super();
  }
  componentDidMount() {
    this.renderEvent();
  }

  componentDidUpdate() {
    this.renderEvent();
  }

  renderEvent() {

  }

  render() {
    let {data,xscale,yscale,translate} = this.props;
    console.log('hh',data);
    return(
    <g className="historyevents" ref="historyevents" translate={translate}>
      {data && data.map((type)=>{if(type) return type.map((d,i)=>(<circle key={i} cx={xscale(d.data.x)} cy={10} r={3} stroke={'#757575'}></circle>))})}
    </g>
    );
  }
}