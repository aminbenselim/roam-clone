import React from "react";
import ReactDOM from "react-dom";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import { Auth0Provider } from "@auth0/auth0-react";

import App from "./App";

const DQL_ENDPOINT = "https://graph.eu-central-1.aws.cloud.dgraph.io";
const queryCache = new QueryCache();

const dgraph = require("dgraph-js-http");
const clientStub = new dgraph.DgraphClientStub(
  // addr: optional, default: "localhost:9080"
  DQL_ENDPOINT
);

export const dgraphClient = new dgraph.DgraphClient(clientStub);
dgraphClient.setDebugMode(true);
dgraphClient.setSlashApiKey("leCS/j5JreVcBb380ias15VRwq1y/04ItGXo6rBhlIE=");

ReactDOM.render(
  <Auth0Provider
    domain="roam-clone.eu.auth0.com"
    clientId="HPwjzL5F0F14DOH9zDbbtqYvk3PExLr7"
    redirectUri={window.location.origin}
  >
    <ReactQueryCacheProvider queryCache={queryCache}>
      <App />
    </ReactQueryCacheProvider>
  </Auth0Provider>,
  document.getElementById("root")
);
