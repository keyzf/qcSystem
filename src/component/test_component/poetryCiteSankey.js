import React from 'react';
import {Sankey,Hint} from 'react-vis'
import dataGetter from '../../dataManager/dataGetter'
import dataStore from '../../dataManager/dataStore'
import { set } from 'mobx';

const BLURRED_LINK_OPACITY = 0.3;
const FOCUSED_LINK_OPACITY = 0.6;

export default class LinkHintSankeyExample extends React.Component {
  state = {
    activeLink: null
  };

  _renderHint() {
    const {activeLink} = this.state;

    // calculate center x,y position of link for positioning of hint
    const x =
      activeLink.source.x1 + (activeLink.target.x0 - activeLink.source.x1) / 2;
    const y = activeLink.y0 - (activeLink.y0 - activeLink.y1) / 2;


    const hintValue = {
      [`${activeLink.source.name} ➞ ${
        activeLink.target.name
      }`]: activeLink.value
    };
    console.log(hintValue)
    return <Hint x={x} y={y} value={hintValue} />;
  }

  render() {
    let gender_brith_death = dataStore.gender_brith_death
    let sim_sentences_belong = dataStore.sim_sentences_belong
    let sim_sentences_links = dataStore.sim_sentences
    let sentences = Object.keys(sim_sentences_belong)

    let getSentenceYear = (sentence) => {
      // console.log(sentence)
      let poet = sim_sentences_belong[sentence]
      if(poet){
        poet = poet['poet']
      }else{
        // console.log(sentence) //重要
        return 0
      }

      // console.log(poet,'+',sentence)
      // console.log(gender_brith_death)
      if (gender_brith_death[poet]) {
        // console.log(gender_brith_death[poet])
        let birth_year = gender_brith_death[poet]['brith']
        return parseInt(birth_year ? birth_year : 0)
      }else{
        return 0
      }
    }
  
    sentences = sentences.filter(element => {
      return getSentenceYear(element)!==0
    })

    sim_sentences_links = sim_sentences_links.filter(element => {
        let s1 = element['sentence1']
        let s2 = element['sentence2']
        return sentences.indexOf(s1)!==-1 && sentences.indexOf(s2)!==-1 &&  sim_sentences_belong[s1] && sim_sentences_belong[s2] 
    })
    // .slice(0, 100000)

    sentences = new Set([])
    for (let index = 0; index < sim_sentences_links.length; index++) {
      let links = sim_sentences_links[index]
      // console.log()
      sentences.add(links['sentence1'])
      sentences.add(links['sentence2'])
    }
    sentences = [...sentences].sort((item1, item2) => getSentenceYear(item1)-getSentenceYear(item2))
    // console.log(sentences.map(element => getSentenceYear(element)))

    // console.log(sentences, sim_sentences_links)
    // console.log(sentences)

    for (let index = 0; index < sentences.length; index++) {
      let sentence = sentences[index]
      sim_sentences_belong[sentence]['id'] = index
    }

    let nodes = []
    let links = []

    nodes = sentences.map(item => {
      return {name:item, hide_name:item}
    })

    links = sim_sentences_links.map(item => {
      let s1 = item['sentence1']
      let s2 = item['sentence2']
      let start = 0
      let end = 0

      // 暂时这样
      if ( sim_sentences_belong[s1] && sim_sentences_belong[s2] && sim_sentences_belong[s1].id && sim_sentences_belong[s2].id) {
        // console.log(s1, s2, sim_sentences_belong[s1], sim_sentences_belong[s2])
        if(sim_sentences_belong[s1].id>sim_sentences_belong[s2].id){
          start = sim_sentences_belong[s2].id
          end = sim_sentences_belong[s1].id
        }else{
          start = sim_sentences_belong[s1].id
          end = sim_sentences_belong[s2].id
        }
        start = parseInt(start)
        end = parseInt(end)
        return {source: start, target: end, value: item.sim*item.sim*10, opacity: 1}        
      }
      return null
    }).filter(item => {
      return item !== null
    })

    const {activeLink} = this.state;

    return (
      <div>
        <Sankey
          nodes={nodes.map(d => ({...d}))}
          links={links.map((d, i) => ({
            ...d,
            opacity:
              activeLink && i === activeLink.index
                ? FOCUSED_LINK_OPACITY
                : BLURRED_LINK_OPACITY
          }))}
          width={3000}
          height={20000}
          layout={24}
          // do not use voronoi in combination with link mouse over
          hasVoronoi={false}
          // onLinkMouseOver={node => this.setState({activeLink: node})}
          // onLinkMouseOut={() => this.setState({activeLink: null})}
          align='center'
        >
          {activeLink && this._renderHint()}
        </Sankey>
      </div>
    );
  }
}