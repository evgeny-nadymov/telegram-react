/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import ReplyControl from '../Message/ReplyControl';
import MessageStore from '../../Stores/MessageStore';
import './InputBoxHeader.css';

const styles = {
    closeIconButton: {
        margin: 0
    }
};

class InputBoxHeader extends React.Component {
    state = {
        reply: null
    };

    componentDidMount() {
        MessageStore.on('clientUpdateReply', this.onClientUpdateReply);
    }

    componentWillUnmount() {
        MessageStore.removeListener('clientUpdateReply', this.onClientUpdateReply);
    }

    onClientUpdateReply = update => {
        const currentChatId = this.props.chatId;
        const { chatId, messageId } = update;

        if (currentChatId !== chatId) {
            return;
        }

        if (messageId > 0) {
            this.setState({ reply: update });
            this.props.onFocusInput();
        } else {
            this.handleCloseReply();
        }
    };

    handleCloseReply = () => {
        this.setState({ reply: null });
    };

    render() {
        const { classes } = this.props;
        const { reply } = this.state;
        if (!reply) {
            return null;
        }

        return (
            <div className='inputbox-header'>
                <div className='inputbox-left-column'>
                    <IconButton className={classes.closeIconButton} aria-label='Close' onClick={this.handleCloseReply}>
                        <CloseIcon />
                    </IconButton>
                </div>
                <div className='inputbox-middle-column'>
                    <ReplyControl chatId={reply.chatId} messageId={reply.messageId} />
                </div>
            </div>
        );
    }
}

InputBoxHeader.propTypes = {
    chatId: PropTypes.number.isRequired,
    onFocusInput: PropTypes.func.isRequired
};

export default withStyles(styles)(InputBoxHeader);
