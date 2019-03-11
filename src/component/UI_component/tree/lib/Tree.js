import React, { Component } from 'react';
import PropTypes from 'prop-types';

import TreeNode from './TreeNode';
import * as filters from './filter';

class Tree extends Component {
  constructor (props) {
    super(props);
    let data = props.data;
    data.map(node => {
      node.isOpen = false;
    });
    console.log(data);
    this.state = {
      data: data,
      nodes: data
    };
    this.getChildNodes = this.getChildNodes.bind(this);
    this.onNodeSelect = this.onNodeSelect.bind(this);
    this.onToggle = this.onToggle.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  getChildNodes (node) {
    if (!node.children) return [];
    return node.children;
  }

  onToggle (node) {
    const { nodes } = this.state;
    if (node.isOpen === undefined) node.isOpen = true;
    else node.isOpen = !node.isOpen;
    this.setState({ nodes });
  }

  onNodeSelect (node, level, parent) {
    if (level === 0) {
      this.props.onCheckBox(level);
    }
    if (level === 1) {
      this.props.onCheckBox(level, node.name);
    }
    if (level === 2) {
      this.props.onCheckBox(level, parent[0], node.name);
    }
  }

  handleChange (e) {
    const filter = e.target.value.trim();
    if (!filter) {
      return this.setState({ nodes: this.state.data });
    }
    var filtered = filters.filterTree(this.state.data[0], filter);
    filtered = filters.expandFilteredNodes(filtered, filter);
    this.setState({ nodes: [filtered] });
  }

  render () {
    let query = this.state.query;
    return (
      <div>
        <div className="inputDiv">
          <input
            type="text"
            placeholder="Search..."
            onKeyUp={this.handleChange}
          />
        </div>
        {this.state.nodes.map((node, i) => (
          <TreeNode
            key={i}
            node={node}
            query={query}
            showFlag={true}
            getChildNodes={this.getChildNodes}
            onToggle={this.onToggle}
            onNodeSelect={this.onNodeSelect}
          />
        ))}
      </div>
    );
  }
}

Tree.propTypes = {
  // data: PropTypes.array.isRequired,
  onCheckBox: PropTypes.func.isRequired
};

export default Tree;
