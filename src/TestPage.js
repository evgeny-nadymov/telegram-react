/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';

class TestPage extends React.Component {
    constructor(props) {
        super(props);
    }

    openDB = () => {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open('/tdlib/dbfs');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    getStore = async () => {
        console.log('open db');
        this.db = await this.openDB();

        console.log('open transaction');
        const store = this.db.transaction(['FILE_DATA'], 'readonly').objectStore('FILE_DATA');

        console.log('request key');
        const request = store.get('/tdlib/dbfs/db.sqlite');
        request.onsuccess = event => {
            console.log('result key', event.target.result);
        };
        request.onerror = event => {
            console.log('error key', event);
        };
    };

    render() {
        return (
            <>
                <div>Hello World!</div>
                <a onClick={this.getStore}>Open DB</a>
            </>
        );
    }
}

TestPage.propTypes = {};

export default TestPage;
