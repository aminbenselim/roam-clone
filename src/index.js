import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./styles.css";

import { Home } from './Home'
import { Page } from './Page'

const App = () => {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Daily Notes</Link>
          </li>
        </ul>

        <hr />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="p/[:page]">
            <Page />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
