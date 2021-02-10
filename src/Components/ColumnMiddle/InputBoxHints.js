/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ListItem } from '@material-ui/core';
import User from '../Tile/User';
import ChatStore from '../../Stores/ChatStore';
import './InputBoxHints.css'

class InputBoxHints extends React.Component {
    state = {
        local: [],
        global: [],
        id: null
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { local, global, id } = this.state;

        if (nextState.local !== local) {
            return true;
        }

        if (nextState.global !== global) {
            return true;
        }

        if (nextState.id !== id) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateHintsLocal', this.onClientUpdateHintsLocal);
        ChatStore.on('clientUpdateHintsGlobal', this.onClientUpdateHintsGlobal);
        ChatStore.on('clientUpdateHintsClose', this.onClientUpdateHintsClose);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateHintsLocal', this.onClientUpdateHintsLocal);
        ChatStore.off('clientUpdateHintsGlobal', this.onClientUpdateHintsGlobal);
        ChatStore.off('clientUpdateHintsClose', this.onClientUpdateHintsClose);
    }

    onClientUpdateHintsClose = update => {
        this.setState({
            id: null,
            local: [],
            global: []
        });
    };

    onClientUpdateHintsGlobal = update => {
        const { id, global } = update;
        if (this.state.id !== id) return;

        this.setState({
            id,
            global
        });
    };

    onClientUpdateHintsLocal = update => {
        const { id, local } = update;

        this.setState({
            id,
            local,
            global: []
        });
    };

    render() {
        const { local, global } = this.state;

        const results = (local || []).concat(global || []);

        // console.log('[hints] render', local, global, results);
        if (!results.length) return null;

        const controls = results.map(x => <ListItem key={x.id} button style={{ padding: 6}}><User userId={x.id} showUsername={true}/></ListItem>);

        return (
            <div ref={this.hintsRef} className='stickers-hint scrollbars-hidden'>
                {controls}
            </div>
        );
    }

}

InputBoxHints.propTypes = {};

export default InputBoxHints;