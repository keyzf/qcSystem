import React, { Component } from 'react';
// import { Container } from 'semantic-ui-react'
// import PoetRelationships from './component/test_component/poetRelationships'
// import PersonalTimeLine from './component/test_component/personalTimeLine'
// import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
// import MainGraph from './component/test_component/mianGraph7'
// import LifeLikePaint from './component/test_component/lifeLikePaint3'
// import EventNumPerYear from './component/test_component/eventNumPerYear'
// import EventHappenOverview from './component/test_component/eventHappenOverview'
// import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
import EventMatrix from './component/test_component/eventMatrix'
class App extends Component {
  // constructor(){
  //   super()
  // }

  componentDidMount() {

  }

  render() {
    //style={{position:"absolute", width:'100%', height:'100%', overflow:'hidden'}}
    return (
      <div className="App">  
        <EventMatrix/>
        {/* <MainGraph/> */}
        {/* <MainGraph/> */}
        {/* <PoetryCiteSankey/> */}
        {/* <PoetRelationships/> */}
        {/* <PoetryCiteTreeMap selected_poet='苏轼'/>
        <PoetryCiteTreeMap show_sentence={true} selected_poet='苏轼'/>
        <PersonalTimeLine/> */}
        {/* <LifeLikePaint/> */}
        {/* <EventNumPerYear/> */}
        {/* <EventHappenOverview/> */}
      </div>
    );
  }
}

export default App;