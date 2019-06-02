/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import withStyles from '@material-ui/core/styles/withStyles';
import ChatTileControl from './ChatTileControl';
import DialogTitleControl from './DialogTitleControl';
import './RecentlyFoundChat.css';

const styles = {
    listItem: {
        padding: '0px'
    }
};

class RecentlyFoundChat extends React.PureComponent {
    render() {
        const { chatId, onClick, classes } = this.props;

        return (
            <ListItem button className={classes.listItem} onClick={onClick}>
                <div className='recently-found-chat'>
                    <div className='chat-wrapper'>
                        <ChatTileControl chatId={chatId} showSavedMessages />
                        <div className='dialog-inner-wrapper'>
                            <div className='tile-first-row'>
                                <DialogTitleControl chatId={chatId} />
                            </div>
                        </div>
                    </div>
                </div>
            </ListItem>
        );
    }
}

RecentlyFoundChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default withStyles(styles)(RecentlyFoundChat);
