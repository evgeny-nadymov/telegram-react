/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import ChatTileControl from './ChatTileControl';
import { getChatShortTitle } from '../../Utils/Chat';
import './ForwardTargetChat.css';

const styles = theme => ({
    border: {
        borderColor: theme.palette.primary.main
    },
    markSelected: {
        boxShadow: 'inset 0 0 0 10px ' + theme.palette.primary.main,
        border: '2px solid ' + theme.palette.background.paper
    },
    markUnselected: {
        boxShadow: 'inset 0 0 0 0 ' + theme.palette.primary.main,
        border: '2px solid transparent'
    }
});

class ForwardTargetChat extends React.Component {
    render() {
        const { classes, chatId, selected, onSelect } = this.props;

        const shortTitle = getChatShortTitle(chatId, true);

        return (
            <div
                className={classNames('forward-target-chat', { 'forward-target-chat-selected': selected })}
                onClick={onSelect}>
                <div className='forward-target-chat-tile'>
                    <div className='forward-target-chat-tile-wrapper'>
                        <ChatTileControl chatId={chatId} showSavedMessages />
                    </div>
                    {selected && <div className={classNames('forward-target-chat-selection', classes.border)} />}
                    <div
                        className={classNames(
                            'forward-target-chat-mark',
                            selected ? classes.markSelected : classes.markUnselected
                        )}
                    />
                    <div className='forward-target-chat-mark-icon' />
                </div>
                <div className='forward-target-chat-title'>{shortTitle}</div>
            </div>
        );
    }
}

ForwardTargetChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

export default withStyles(styles, { withTheme: true })(ForwardTargetChat);
