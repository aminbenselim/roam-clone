import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "./styles.css";

import { Home } from "./Home";
import { Page } from "./Page";
import ScrollToTop from './utils/ScrollToTop';

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <>
        <div className="header">
          <ul>
            <li>
              <Link to="/">Daily Notes</Link>
            </li>
          </ul>
          <hr />
        </div>

        <Switch>
        <Route path="/b/:id" children={<Page />} />
          <Route exact path="/">
            <Home />
          </Route>
        </Switch>
      </>
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
