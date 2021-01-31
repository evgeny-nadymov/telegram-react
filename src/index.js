/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import TelegramApp from './TelegramApp';
import registerServiceWorker from './registerServiceWorker';
import {
    OPTIMIZATIONS_FIRST_START,
    STORAGE_REGISTER_KEY,
    STORAGE_REGISTER_TEST_KEY
} from './Constants';
import TdLibController from './Controllers/TdLibController';
import './index.css';

ReactDOM.render(
    <Router>
        <Route path='' component={TelegramApp} />
    </Router>,
    document.getElementById('root')
);

if (OPTIMIZATIONS_FIRST_START) {
    const registerKey = TdLibController.parameters.useTestDC ? STORAGE_REGISTER_TEST_KEY : STORAGE_REGISTER_KEY;
    const register = localStorage.getItem(registerKey);
    if (register) {
        registerServiceWorker();
    }
} else {
    registerServiceWorker();
}