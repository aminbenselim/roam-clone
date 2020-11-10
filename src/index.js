import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import {
  QueryCache,
  ReactQueryCacheProvider,
} from "react-query";

import "./styles.css";
import { DailyNotes } from "./DailyNotes";
import { Page } from "./Page";
import ScrollToTop from "./utils/ScrollToTop";

const DQL_ENDPOINT = "https://graph.eu-central-1.aws.cloud.dgraph.io";
const queryCache = new QueryCache();

const dgraph = require("dgraph-js-http");
const clientStub = new dgraph.DgraphClientStub(
  // addr: optional, default: "localhost:9080"
  DQL_ENDPOINT,
);

export const dgraphClient = new dgraph.DgraphClient(clientStub);
dgraphClient.setDebugMode(true);
dgraphClient.setSlashApiKey("leCS/j5JreVcBb380ias15VRwq1y/04ItGXo6rBhlIE=");

const App = () => {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
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
            <Route path="/b/:nodeId" children={<Page />} />
            <Route exact path="/">
              <DailyNotes />
            </Route>
          </Switch>
        </>
      </Router>
    </ReactQueryCacheProvider>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
