import React, { Component } from 'react';
import { Container } from 'semantic-ui-react'
import PoetRelationships from './component/test_component/poetRelationships'
import PersonalTimeLine from './component/test_component/personalTimeLine'
import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
import MainGraph from './component/test_component/mianGraph2'
import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
class App extends Component {
  constructor(){
    super()
  }

  componentDidMount() {

  }

  render() {
    //style={{position:"absolute", width:'100%', height:'100%', overflow:'hidden'}}
    return (
      <div className="App">  
        <MainGraph/>
        {/* <PoetryCiteSankey/> */}
        {/* <PoetRelationships/> */}
        {/* <PoetryCiteTreeMap selected_poet='苏轼'/>
        <PoetryCiteTreeMap show_sentence={true} selected_poet='苏轼'/>
        <PersonalTimeLine/> */}
      </div>
    );
  }
}

export default App;