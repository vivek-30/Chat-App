import React from 'react'
import Chat from './Chat'
import Protected from './components/hoc/Protected'
import SignIn from './components/authentication/SignIn'
import SignUp from './components/authentication/SignUp'
import VideoCall from './components/majorComponents/videoCall/VideoCall'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

const App = () => {
  return (
    <div className="container" id="chat-app">
      <Router>
        <Switch>
          <Route exact path="/" component={SignUp} />
          <Route path="/SignUp" component={SignUp} />
          <Route path="/SignIn" component={SignIn} />
          <Route path="/chat" component={Protected(Chat)} />
          <Route path="/VideoCall/:id" component={Protected(VideoCall)} />
        </Switch>
      </Router>
    </div>
  )
}

export default App
