import React, { Component } from 'react';
// import { Container } from 'semantic-ui-react'
// import PoetRelationships from './component/test_component/poetRelationships'
// import PersonalTimeLine from './component/test_component/personalTimeLine'
// import PoetryCiteSankey from './component/test_component/poetryCiteSankey5'
// import MainGraph from './component/test_component/mianGraph7'
import LifeLikePaint from './component/test_component/lifeLikePaint3'
// import EventNumPerYear from './component/test_component/eventNumPerYear'
// import EventHappenOverview from './component/test_component/eventHappenOverview'
// import PoetryCiteTreeMap from './component/test_component/poetryCitePart'
// import EventMatrix from './component/test_component/eventMatrix2'
import { Header, Icon, Image, Menu, Segment, Sidebar } from 'semantic-ui-react'
import 'semantic-ui/dist/semantic.min';
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
        {/* <EventMatrix/> */}
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
        <PersonSelector/>
      </div>
    );
  }
}

export default App;

// 选择人物的筛选框
const PersonSelector = () => (
  <Sidebar.Pushable as={Segment}>
    <Sidebar as={Menu} animation='overlay' icon='labeled' inverted vertical visible width='thin'>
      <Menu.Item as='a'>
        <Icon name='home' />
        Home
      </Menu.Item>
      <Menu.Item as='a'>
        <Icon name='gamepad' />
        Games
      </Menu.Item>
      <Menu.Item as='a'>
        <Icon name='camera' />
        Channels
      </Menu.Item>
    </Sidebar>

    <Sidebar.Pusher>
      <Segment basic>
        <Header as='h3'>Application Content</Header>
      </Segment>
    </Sidebar.Pusher>
  </Sidebar.Pushable>
)