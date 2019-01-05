import React from 'react';
import {Sankey,Hint, Treemap} from 'react-vis'
import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import { set } from 'mobx';
import { SSL_OP_NO_COMPRESSION } from 'constants';
import ForceDirectedGraph from './forceDirectedGraph'

// 单个词人的应用比例
export default class PoetryCiteSankey extends React.Component {
  state = {
    activeLink: null
  };

  componentWillMount(){
    let selected_poet= this.props.selected_poet || '李清照'
    let show_sentence =  this.props.show_sentence || false
    console.log('render cite5')
    let sentences_belong = dataStore.sim_sentences_belong
    let sentences_links = dataStore.sim_sentences
    let sentences = Object.keys(sentences_belong)
    let tree_map_data = {

    }
    
    // {
    //   "title": "总",
    //   "color":  Math.random(),
    //   "children": []
    // }
    
    let getSentenceWriter = (sentence) => {
      // console.log(sentence)
      let poet = sentences_belong[sentence]
      if(poet){
        poet = poet['poet']
        return poet
      }else{
        // console.log(sentence) //重要
        return null
      }
    }
    let getSentencePoem = sentence => {
      let poet = sentences_belong[sentence]
      if(poet){
        poet = poet['ci_name']
        return poet
      }else{
        // console.log(sentence) //重要
        return null
      }
    }
    // console.log(sentences, sentences_belong)
    // let poets = new Set( sentences.map(sentence => {
    //   return getSentenceWriter(sentence)
    // }) )
    // poets = [...poets].filter(poet => poet)

    sentences_links.forEach(link => {
      if (link['sentence1']===link['sentence2']) {
        return
      }

      let s1 = link['sentence1']
      let s2 = link['sentence2']

      let poet1 = getSentenceWriter(s1)
      let poet2 = getSentenceWriter(s2)

      if(selected_poet && poet1!==selected_poet &&selected_poet!==poet2 )
        return

      let ci_name1 =getSentencePoem(s1)
      let ci_name2 =getSentencePoem(s2)

      tree_map_data[poet1] = tree_map_data[poet1] || {}
      tree_map_data[poet2] = tree_map_data[poet2] || {}

      tree_map_data[poet1][ci_name1] = tree_map_data[poet1][ci_name1] || {}
      tree_map_data[poet2][ci_name2] = tree_map_data[poet2][ci_name2] || {}

      tree_map_data[poet1][ci_name1][s1] =  tree_map_data[poet1][ci_name1][s1] || { "title": s1, "color":  Math.random(), 'size': 0, 'children':[]}
      tree_map_data[poet2][ci_name2][s2] =  tree_map_data[poet2][ci_name2][s2] || { "title": s2, "color":  Math.random(), 'size': 0, 'children':[]}
      
      tree_map_data[poet1][ci_name1][s1].size += parseFloat(link.sim)
      tree_map_data[poet2][ci_name2][s2].size += parseFloat(link.sim)

    })

    let temp_tree_map_data =  {
      "title": 'total',
      "color":  Math.random(), 
      "children":[]
    }
    if (selected_poet) {
      let poet =selected_poet
      let poet_node = {"title": poet,"color":  Math.random(), "children":[]}
      Object.keys(tree_map_data[poet]).forEach( ci_name => {
        let ci_node = {"title": ci_name,"color":  Math.random(), "children":[]}
        // 显示词
        if (show_sentence) {
          Object.keys(tree_map_data[poet][ci_name]).forEach(sentence => {
            ci_node.children.push(tree_map_data[poet][ci_name][sentence])
          })  
        }else{
          ci_node['size'] = Object.keys(tree_map_data[poet][ci_name]).reduce((total, sentence)=>{
            return total + tree_map_data[poet][ci_name][sentence].size
          }, 0)    
        }
        // 显示句子

        poet_node.children.push(ci_node)
      })
      temp_tree_map_data.children.push(poet_node)
    }
 
    tree_map_data = temp_tree_map_data
    this.setState({tree_map_data:tree_map_data})
    // console.log(tree_map_data)
  }
  render() {
    return (
      <div>
        <Treemap
          animation= {{
            damping: 9,
            stiffness: 300
          }}
          title={'My New Treemap'}
          width={1300}
          height={1300}
          data={this.state.tree_map_data}
          mode= {true ? 'circlePack' : 'squarify'}
        />
      </div>
    );
  }
}