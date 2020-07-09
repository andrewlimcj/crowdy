// core
import React from "react";
import _ from "lodash";
import Home from "./pages/home";
import About from "./pages/about";
import { Switch, Route, Redirect } from "react-router-dom";

// images
import GitHubIcon from "./images/icon-git-hub.svg";
import AinizeIcon from "./images/icon-ainize.svg";

import "./styles/main.css";
import analytics from "./analytics";

export default function App() {
  const onClickAinizeLink = () => {
    analytics.event({
      category: 'spotainize_common',
      action: 'poweredby_click',
    });
  }

  const onClickGithubLink = () => {
    analytics.event({
      category: 'spotainize_common',
      action: 'github_click',
    });
  }
  return (
    <React.Fragment>
      <header>
        <div className="container">
          <a href="/home">
            <h3 className="logo">Crowdy</h3>
          </a>
          <div className="menu">
            <a href="/">HOME</a>
            <a href="/about">ABOUT</a>
          </div>
        </div>
      </header>
      <Switch>
        <Route exact path="/about" component={About} />
        <Route exact path="/home" component={Home} />
        <Route path="/">
          <Redirect to="/home" />
        </Route>
      </Switch>
      <footer>
        <a className="ainizeLink"  onClick={onClickAinizeLink} target="_blank" href="https://www.ainize.ai/liayoo/crowdy">
          <img src={AinizeIcon} />
          Powered by Ainize
        </a>
        <a className="githubLink" onClick={onClickGithubLink} target="_blank" href="https://github.com/ainize-team2/crowdy">
          <img src={GitHubIcon} />
          Contribute on GitHub
        </a>
      </footer>
    </React.Fragment>
  );
}
