import React from "react";
import ReactDOM from "react-dom";
import { QueryCache, ReactQueryCacheProvider } from "react-query";

import App from "./App";

const DQL_ENDPOINT = "http://localhost:8080";
const queryCache = new QueryCache();

const dgraph = require("dgraph-js-http");
const clientStub = new dgraph.DgraphClientStub(
  DQL_ENDPOINT
);

export const dgraphClient = new dgraph.DgraphClient(clientStub);
dgraphClient.setDebugMode(true);

ReactDOM.render(
    <ReactQueryCacheProvider queryCache={queryCache}>
      <App />
    </ReactQueryCacheProvider>,
  document.getElementById("root")
);
