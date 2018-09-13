import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TelegramApp from './TelegramApp';
import { BrowserRouter as Router, Route } from 'react-router-dom'
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
    <Router>
        <Route path='' component={TelegramApp} />
    </Router>,
    document.getElementById('root'));
registerServiceWorker();
