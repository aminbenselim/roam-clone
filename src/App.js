import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import "./styles.css";
import { DailyNotes } from "./DailyNotes";
import { Page } from "./Page";
import ScrollToTop from "./utils/ScrollToTop";

const App = () => {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

  console.log({user});
  return (
    <Router>
      <ScrollToTop />
      <>
        <div className="header">
          <ul>
            <li>
              <Link to="/">Daily Notes</Link>
            </li>
            {isAuthenticated ? (
              <li>
                <button
                  onClick={() => logout({ returnTo: window.location.origin })}
                >
                  Log Out
                </button>
              </li>
            ) : (
              <li>
                <button onClick={() => loginWithRedirect()}>Log In</button>;
              </li>
            )}
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
