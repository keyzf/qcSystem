import React from 'react';
import * as d3 from 'd3';

export default class Axis extends React.Component {
    componentDidMount() {
      this.renderAxis();
    }
  
    componentDidUpdate() {
      this.renderAxis();
    }
  
    renderAxis() {
      var node  = this.refs.axis;
      var axis = d3.axisBottom(this.props.xscale)
                   .tickFormat(function(e){
                    if(Math.floor(e) != e)
                    {
                        return;
                    }
                    return e;
                });
      d3.select(node).call(axis);
    }

    render() {
      let {width,birth,death,xscale} = this.props;
      let left = xscale(birth),right=xscale(death);
      if(birth === -9999){
        left = 0;
      }
      if(right === 9999){
        right = width;
      }
      return (<g className="axis" ref="axis" transform={this.props.translate}>
        <rect width={width} height={22} x={0} y={0} fill={'#efefef'}></rect>
        <rect width={right-left} height={22} x={left} y={0} fill={'#d1d1d1'}></rect>
      </g>);
    }
  }