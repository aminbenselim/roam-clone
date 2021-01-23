import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import "./styles.css";
import { DailyNotes } from "./DailyNotes";
import { Page } from "./Page";
import ScrollToTop from "./utils/ScrollToTop";

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
          <Route path="/b/:nodeId" children={<Page showRefs={true} />} />
          <Route exact path="/">
            <DailyNotes />
          </Route>
        </Switch>
      </>
    </Router>
  );
};

export default App;
