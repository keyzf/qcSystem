import React from 'react';
import {Sankey,Hint} from 'react-vis'
import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import { set } from 'mobx';
import { SSL_OP_NO_COMPRESSION } from 'constants';
import ForceDirectedGraph from './forceDirectedGraph'

const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 0.6;

// 词人的力图
export default class LinkHintSankeyExample extends React.Component {
  state = {
    activeLink: null
  };

  componentDidMount(){
    let poet_year = dataStore.poet_year
    let sentences_belong = dataStore.sim_sentences_belong
    let sentences_links = dataStore.sim_sentences
    let sentences = Object.keys(sentences_belong)

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

    // console.log(sentences, sentences_belong)
    let poets = new Set( sentences.map(sentence => {
      return getSentenceWriter(sentence)
    }) )
    poets = [...poets].filter(poet => poet)


    let links = sentences_links.map(link => {
        let s1 = link['sentence1']
        let s2 = link['sentence2']
        let poet1 = getSentenceWriter(s1)
        let poet2 = getSentenceWriter(s2)
        return {
          "source": poets.indexOf(poet1), 
          "target": poets.indexOf(poet2), 
          "value":  parseFloat(link.sim)
        }
    })

    // 减去双向的
    let tempLinks = []
    let poet_ref = {}
    links.forEach(link => {
      if (link.target===link.source) {
        return
      }
      let pair = {
        "source": link.target, 
        "target": link.source, 
        "value": link.value
      }
      let same_index = null
      tempLinks.forEach( (tempLink, index) =>{
        if (!same_index && tempLink.source===link.source && tempLink.target===link.target) {
          same_index = index
        }
      })
      if (same_index) {
        tempLinks[same_index].value += link.value
        if (poet_ref[link.source]) {
          poet_ref[link.source] += link.value
        }else{
          poet_ref[link.source] = link.value
        }
        if (poet_ref[link.target]) {
          poet_ref[link.target] += link.value
        }else{
          poet_ref[link.target] = link.value
        }
      }else if (!(tempLinks.includes(pair))) {
        tempLinks.push(link)
      }
    });
    // console.log(links)
    links = tempLinks
    // console.log(links)

    let nodes = poets.map((poet, index) => {
      // console.log(sentence, index)
      return {
        "id": index, 
        "group": 0, 
        "color": 0, 
        "poet": poet,
        'size': poet_ref[index] || 1
      }
    })

    let data =  {
      nodes : nodes,
      links : links
    }
    this.setState({data:data})
  }
  render() {
    console.log('render cite4')
    // .slice(0, 100000)
    return (
      <div>
        <ForceDirectedGraph data={this.state.data} height={1300} width={1300} strength={20}/>
      </div>
    );
  }
}