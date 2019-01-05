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
      return {name:undefined, hide_name:item}
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
    var temp_links =deepCopy(links)
    // console.log(temp_links)
    let nodes_array = []
    let links_array = []
    let new_links = []
    let new_nodes = []


    const backward = (source) => {
      let children = deepCopy(temp_links.filter(item => item.target===source))
      children.forEach(element => {
        delete temp_links[temp_links.indexOf(element)]
        new_links.push(element)
        backward(element.source)
      });
    }
    const forward = (target) => {
      let father = deepCopy(temp_links.filter(item => item.source===target))
      father.forEach(element => {
        delete temp_links[temp_links.indexOf(element)]
        new_links.push(element)
        forward(element.target)
      });
    }

    let new_links_map_func = item=> ({
      source: new_nodes.indexOf(sentences[item.target]), 
      target: new_nodes.indexOf(sentences[item.source]), 
      value: item.value, 
      opacity: item.opacity,
    })
    let new_nodes_map_func = item=> ({
      name: item
    })
    while(temp_links.length != 0){
      let link = temp_links.pop()
      // console.log(temp_links)
      // console.log(link)
      if (link) {
        new_links.push(link)
        backward(link.source)
        forward(link.target)
        
        // console.log(sentences)
        new_nodes = [...new_links.map(item=>sentences[item.source]), ...new_links.map(item=>sentences[item.target])]
       
        new_nodes = [...new Set(new_nodes)].sort((item1, item2) => getSentenceYear(item1)-getSentenceYear(item2))
        new_links= new_links.map(new_links_map_func)  //sentences[item.source])
        // new_nodes = new_nodes.map(new_nodes_map_func)
        // console.log(new_nodes)
        links_array.push(new_links)
        nodes_array.push(new_nodes)
        new_links = []
      }
    }
    // console.log(links_array, nodes_array)

    // for (let index = 0; index < links.length; index++) {
    //   const link = links[index];
    //   const backWard = (target, value) => {
    //     // let target_be_source_array = [] //links.filter(item=> item.source === target)
    //     for (let index = 0; index < links.length; index++) {
    //       if (links[index].source === target) {
    //         links[index].value += value
    //         backWard(links[index].target, value)
    //       }
    //     }
    //   }
    // }

    // let sort_links = []
    // let bucket1 = [], year_point = 0, bucket2 = []
    // let is_first = true
    // sentences.map((sentence, index) => {
    //   // console.log(index, sentence)
    //   let this_year = getSentenceYear(sentence)
    //   // console.log(sentence, this_year)
    //   if (this_year===year_point) {
    //     bucket2.push(sentence)
    //   }else{
    //     if (is_first) {
    //       is_first = false
    //     }else{
    //       bucket1.forEach(element1 =>{
    //         bucket2.forEach(element2 =>{
    //           let start = sim_sentences_belong[element1].id
    //           let end = sim_sentences_belong[element2].id
    //           sort_links.push({source: start, target: end, value: 0.00001, opacity: 0})
    //         })
    //       })    
    //       // console.log(bucket1.map(item => sim_sentences_belong[item].id), bucket2.map(item => sim_sentences_belong[item].id))
    //       bucket1 = bucket2
    //       bucket2 = []
    //       year_point = this_year  
    //     }
    //   }
    // })
    // ...links, 
    // links = [...sort_links]

    // console.log(sort_links,sentences.length, links.length)


    // nodes = [{name: 'a'}, {name: 'b'}, {name: 'c'}];
    // links = [
    //   {source: 0, target: 1, value: 10},
    //   {source: 0, target: 2, value: 20},
    //   {source: 1, target: 2, value: 20}
    // ];

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
        {
          links_array.map((links, index) =>{
            const MAX_YEAR = 2000
            const MIN_YEAR = 900
            const WIDTH = 5000
            const get_x = year => (year-MIN_YEAR)/(MAX_YEAR-MIN_YEAR)*WIDTH
            nodes = nodes_array[index]
            {/* console.log(nodes) */}
            {/* console.log(getSentenceYear(nodes[0]), getSentenceYear(nodes[nodes.length-1])) */}
            {/* console.log(links, nodes_array[index], index) */}
            return true? null : (
            <div style={
              {
                position:"absolute", 
                left:get_x(getSentenceYear(nodes[0])),
                top: Math.random() * 3000
              }
              // {
              //   position:"relative", 
              //   left:get_x(getSentenceYear(nodes[0])),
              //   top: Math.random()*5000
              // }
            }
            key={'poetry_sankey_'+index}>
                <Sankey
                nodes={nodes.map(d => ({...d}))}
                links={links.map((d, i) => ({
                  ...d,
                  opacity:
                    activeLink && i === activeLink.index
                      ? FOCUSED_LINK_OPACITY
                      : BLURRED_LINK_OPACITY
                }))}
                width={get_x(getSentenceYear(nodes[nodes.length-1]))-get_x(getSentenceYear(nodes[0]))}
                height={20*nodes.length}
                layout={50}
                // do not use voronoi in combination with link mouse over
                hasVoronoi={false}
                hideLabels={true}
                nodeWidth = {5}
                // onLinkMouseOver={node => this.setState({activeLink: node})}
                // onLinkMouseOut={() => this.setState({activeLink: null})}
                align='justify'
              >
                {activeLink && this._renderHint()}
              </Sankey>
            </div>              
            )

          })
        }
      </div>
    );
  }
}