// 用于绘制力图

import React from 'react';
import PropTypes from 'prop-types';
import {forceSimulation, forceLink, forceManyBody, forceCenter} from 'd3-force';

import {XYPlot, MarkSeriesCanvas, LineSeriesCanvas, MarkSeries, LineSeries, Hint} from 'react-vis';
import { values } from 'mobx';

const colors = [
  '#19CDD7',
  '#DDB27C',
  '#88572C',
  '#FF991F',
  '#F15C17',
  '#223F9A',
  '#DA70BF',
  '#4DC19C',
  '#12939A',
  '#B7885E',
  '#FFCB99',
  '#F89570',
  '#E79FD5',
  '#89DAC1'
];

/**
 * Create the list of nodes to render.
 * @returns {Array} Array of nodes.
 * @private
 */
function generateSimulation(props) {
  const {data, height, width, maxSteps, strength} = props;
  if (!data) {
    return {nodes: [], links: []};
  }

  const nodes = data.nodes.map(d => ({...d}));
  const links = data.links.map(d => ({...d}));

  const simulation = forceSimulation(nodes)
    .force('link', forceLink().id(d => d.id))
    .force('charge', forceManyBody().strength(strength))
    .force('center', forceCenter(width / 2, height / 2))
    .stop();

  simulation.force('link').links(links);

  const upperBound = Math.ceil(
    Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())
  );
  for (let i = 0; i < Math.min(maxSteps, upperBound); ++i) {
    simulation.tick();
  }

  return {nodes, links};
}

class ForceDirectedGraph extends React.Component {
  static get defaultProps() {
    return {
      className: '',
      data: {nodes: [], links: []},
      maxSteps: 50,
      hintValue: null
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      data: generateSimulation(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: generateSimulation(nextProps)
    });
  }

  render() {
    const {className, height, width, animation} = this.props;
    const {data} = this.state;
    const {nodes, links} = data;

    const drawAsCanvas = false;
    const LineSeriesDrawer = drawAsCanvas? LineSeriesCanvas : LineSeries;
    const MarkSeriesDrawer = drawAsCanvas? MarkSeriesCanvas : MarkSeries;
    // console.log(this.state.hintValue)
    return (
      <XYPlot 
        width={width} 
        height={height} 
        className={className} 
        onMouseLeave={() => this.setState({hintValue: null})}>

        {/* {links.map(({source, target}, index) => {
          console.log(source,target)
          return (
            <LineSeriesDrawer
              animation={animation}
              color={'#B3AD9E'}
              key={`link-${index}`}
              opacity={0.3}
              data={[{...source, color: null}, {...target, color: null}]}
            />
          );
        })} */}
        {this.state.hintValue?links.map(({source, target}, index) => {
          {/* console.log(source,target) */}
          if(source.id===this.state.hintValue.id || target.id===this.state.hintValue.id)
            return (
              <LineSeriesDrawer
                animation={animation}
                color={'#B3AD9E'}
                key={`link-${index}`}
                opacity={0.3}
                data={[{...source, color: null}, {...target, color: null}]}
              />
            );
        }) : null}
        <MarkSeriesDrawer
          data={nodes}
          animation={animation}
          colorType={'category'}
          stroke={'#ddd'}
          // size={5}
          sizeRange={[2, 10]}
          strokeWidth={1}
          colorRange={colors}
          onValueMouseOver={(datapoint, event)=>{
            // console.log(datapoint)
            this.setState({hintValue: datapoint})
            // event.pri
          }}
        />
        {this.state.hintValue ? <Hint value={this.state.hintValue} /> : null}
      </XYPlot>
    );
  }
}

ForceDirectedGraph.displayName = 'ForceDirectedGraph';

export default ForceDirectedGraph;