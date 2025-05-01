/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
// import TelegramApp from './Components/Auth/TestPage';
import TelegramAppWrapper from "./TelegramAppWrapper";
import ThemeWrapper from "./ThemeWrapper";
import {
  OPTIMIZATIONS_FIRST_START,
  STORAGE_REGISTER_TEST_KEY,
  STORAGE_REGISTER_KEY,
} from "./Constants";
import TdLibController from "./Controllers/TdLibController";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeWrapper>
      <BrowserRouter basename="/">
        <TelegramAppWrapper />
      </BrowserRouter>
    </ThemeWrapper>
  </React.StrictMode>
);

if (OPTIMIZATIONS_FIRST_START) {
  const registerKey = TdLibController.parameters.useTestDC
    ? STORAGE_REGISTER_TEST_KEY
    : STORAGE_REGISTER_KEY;
  const register = localStorage.getItem(registerKey);
  if (register) {
    import("./registerServiceWorker").then((module) => {
      module.default();
    });
  }
} else {
  import("./registerServiceWorker").then((module) => {
    module.default();
  });
}
