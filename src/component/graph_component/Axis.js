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
      let {width} = this.props;
      return (<g className="axis" ref="axis" transform={this.props.translate}>
        <rect width={width} height={25} x={0} y={0} fill={'#ebebeb'}></rect>
      </g>);
    }
  }