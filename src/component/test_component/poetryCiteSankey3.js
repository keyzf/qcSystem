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


    // 没有生就用卒
    let getSentenceYear = (sentence) => {
      // return sentences.indexOf(sentence) && 0  //parseFloat(Math.random())+1
      let poet = sim_sentences_belong[sentence]
      if(poet){
        poet = poet['poet']
      }else{
        return 0
      }

      if (gender_brith_death[poet]) {
        let birth_year = gender_brith_death[poet]['brith']
        let death_year = gender_brith_death[poet]['death']
        if (birth_year && birth_year!==0) {
          return birth_year
        }else if (death_year) {
          return death_year
        }else{
          return 0
        }
      }else{
        return 0
      }
    }

    let getSentenceWriter = (sentence) => {
      // console.log(sentence)
      let poet = sim_sentences_belong[sentence]
      if(poet){
        poet = poet['poet']
        return poet
      }else{
        // console.log(sentence) //重要
        return null
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
        return {source: start, target: end, value: item.sim, opacity: 1}        
      }
      return null
    }).filter(item => {
      return item !== null
    })

    // console.log(getSentenceWriter('困人天氣近清明'))
    var deepCopy = function(obj) {
      // 只拷贝对象
      if (typeof obj !== 'object') return;
      // 根据obj的类型判断是新建一个数组还是一个对象
      var newObj = obj instanceof Array ? [] : {};
      for (var key in obj) {
        // 遍历obj,并且判断是obj的属性才拷贝
        if (obj.hasOwnProperty(key)) {
          // 判断属性值的类型，如果是对象递归调用深拷贝
          newObj[key] = typeof obj[key] === 'object' ? deepCopy(obj[key]) : obj[key];
        }
      }
      return newObj;
    }
    // 分成几块
    // var temp_links =deepCopy(links)
    // console.log(temp_links)
    // let nodes_array = []
    // let links_array = []
    let new_links = new Set([])
    let new_nodes = []
    let selected_poet = '蘇軾'
    const backward = (source) => {
      let children = deepCopy(links.filter(item => item.target===source))
      children.forEach(element => {
        // delete links[links.indexOf(element)]
        new_links.add(element)
        backward(element.source)
      });
    }
    const forward = (target) => {
      let father = deepCopy(links.filter(item => item.source===target))
      father.forEach(element => {
        // delete links[links.indexOf(element)]
        new_links.add(element)
        forward(element.target)
      });
    }

    let links_with_poet = links.filter(element => {
      let target = sentences[element.target]
      let source = sentences[element.target]
      // console.log(target, source,getSentenceWriter(target), getSentenceWriter(source) )
      return getSentenceWriter(target)===selected_poet || getSentenceWriter(source)===selected_poet
    })
    // console.log(links_with_poet)
    links_with_poet.forEach((element, index) => {
      new_links.add(element)
      backward(element.source)
      forward(element.target)
    })
    // console.log(new_links)
    new_links = [...new_links]
    new_nodes = [...new_links.map(item=>sentences[item.source]), ...new_links.map(item=>sentences[item.target])]

    new_nodes = [...new Set(new_nodes)].sort((item1, item2) => getSentenceYear(item1)-getSentenceYear(item2))
    new_links = new_links.map(item=> ({
      source: new_nodes.indexOf(sentences[item.target]), 
      target: new_nodes.indexOf(sentences[item.source]), 
      value: item.value, 
      opacity: item.opacity,
    }))
    // console.log(new_nodes)
    new_nodes = new_nodes.map(item => ({name: item, key: item, color: getSentenceWriter(item)===selected_poet?'gray':'rgb(121, 199, 227)'}))
    // console.log(new_links, new_nodes)
    nodes = new_nodes
    links = new_links
    
    // while(temp_links.length != 0){
    //   let link = temp_links.pop()
    //   // console.log(temp_links)
    //   // console.log(link)
    //   if (link) {
    //     new_links.push(link)
    //     backward(link.source)
    //     forward(link.target)
        
    //     // console.log(sentences)
    //     new_nodes = [...new_links.map(item=>sentences[item.source]), ...new_links.map(item=>sentences[item.target])]
       
    //     new_nodes = [...new Set(new_nodes)].sort((item1, item2) => getSentenceYear(item1)-getSentenceYear(item2))
    //     new_links= new_links.map(new_links_map_func)  //sentences[item.source])
    //     // new_nodes = new_nodes.map(new_nodes_map_func)
    //     // console.log(new_nodes)
    //     links_array.push(new_links)
    //     nodes_array.push(new_nodes)
    //     new_links = []
    //   }
    // }

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
          width={1200}
          height={1400}
          layout={50}
          nodeWidth = {3}
          style={{labels: {fontSize:5}}}
          // do not use voronoi in combination with link mouse over
          hasVoronoi={false}
          onLinkMouseOver={node => this.setState({activeLink: node})}
          onLinkMouseOut={() => this.setState({activeLink: null})}
          align='justify'
        >
          {activeLink && this._renderHint()}
        </Sankey>
      </div>
    );
  }
}