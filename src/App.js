import React, { Component } from 'react';
import { HashRouter, Route } from 'react-router-dom'

import Login from './comps/Login/Login'
import Private from './comps/Private/Private'

class App extends Component {
  render() {
    return (
      <HashRouter>
        <div className="App">
          <Route exact path="/" component={Login} />
          <Route path="/private" component={Private} />
        </div>
      </HashRouter>
    );
  }
}

export default App;
