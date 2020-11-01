import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import { Main } from "./main.js";

export default function BasicExample() {
  return (
    <Router>
      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>

        <hr />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>
      <Main />
    </div>
  );
}
