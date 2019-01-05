import React from 'react';
import {Sankey,Hint} from 'react-vis'
import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import { set } from 'mobx';
import { SSL_OP_NO_COMPRESSION } from 'constants';
import ForceDirectedGraph from './forceDirectedGraph'

const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 0.6;
// 力图
export default class LinkHintSankeyExample extends React.Component {
  state = {
    activeLink: null
  };

  render() {
    console.log('render cite4')
    let poet_year = dataStore.poet_year
    let sentences_belong = dataStore.sim_sentences_belong
    let sentences_links = dataStore.sim_sentences
    let sentences = Object.keys(sentences_belong)


    // 没有生就用卒
    let getSentenceYear = (sentence) => {
      // return sentences.indexOf(sentence) && 0  //parseFloat(Math.random())+1
      let poet = sentences_belong[sentence]
      if(poet){
        poet = poet['poet']
      }else{
        return 0
      }
      // console.log(poet, poet_year)
      if (poet_year[poet]) {
        // console.log(poet_year[poet])
        return poet_year[poet].year
      }else{
        return 0
      }
    }

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

    // console.log(sentences_belong)
    // sentences = sentences.filter(element => {
    //   return getSentenceYear(element)!==0
    // })
    sentences_links = sentences_links.filter(element => {
        let s1 = element['sentence1']
        let s2 = element['sentence2']
        return sentences.includes(s1) && sentences.includes(s2) &&  sentences_belong[s1] && sentences_belong[s2] 
    })
    sentences = [...sentences_links.map(link => link['sentence1']), ...sentences_links.map(link => link['sentence2']) ]
    sentences = [...new Set(sentences)]
    let nodes = sentences.map((sentence, index) => {
      // console.log(sentence, index)
      return {
        "id": index, 
        "group": 0, 
        "color": 0, 
        "sentence": sentence,
      }
    })
    let links = sentences_links.map(link => {
      let s1 = link.sentence1
      let s2 = link.sentence2
      if(sentences.includes(s1) && sentences.includes(s2))
        return {"source": sentences.indexOf(s1), "target": sentences.indexOf(s2), "value": link.sim}
      else
        return null
    }).filter(element => element)
    // console.log(sentences, sentences_links)
    let data =  {
      nodes : nodes,
      links : links
    }
    // .slice(0, 100000)
    return (
      <div>
        <ForceDirectedGraph data={data} height={1000} width={1000} strength={5000}/>
      </div>
    );
  }
}