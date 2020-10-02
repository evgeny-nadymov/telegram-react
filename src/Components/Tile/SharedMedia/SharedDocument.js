/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ContextMenu from './ContextMenu';
import { openMedia } from '../../../Utils/Message';
import { getMedia } from '../../../Utils/Media';
import MessageStore from '../../../Stores/MessageStore';
import './SharedDocument.css';

class SharedDocument extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (showOpenMessage !== nextProps.showOpenMessage) {
            return true;
        }

        if (contextMenu !== nextState.contextMenu) {
            return true;
        }

        if (left !== nextState.left) {
            return true;
        }

        if (top !== nextState.top) {
            return true;
        }

        return false;
    }

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    render() {
        const { chatId, messageId, showOpenMessage, i18n } = this.props;
        const { contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { date } = message;

        const dateString = new Date(date * 1000).toLocaleDateString([i18n.language], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        return (
            <>
                <div className='shared-document' onContextMenu={this.handleOpenContextMenu}>
                    {getMedia(message, () => openMedia(chatId, messageId, true), { date: dateString })}
                </div>
                <ContextMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    showOpenMessage={showOpenMessage}
                    onClose={this.handleCloseContextMenu}
                />
            </>
        );
    }
}

SharedDocument.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    showOpenMessage: PropTypes.bool
};

export default withTranslation()(SharedDocument);
