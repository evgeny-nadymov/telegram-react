import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
import TelegramApp from './TelegramApp';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<TelegramApp />, document.getElementById('root'));
registerServiceWorker();
