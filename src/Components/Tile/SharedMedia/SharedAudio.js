/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';
import { openMedia } from '../../../Utils/Message';
import { getMedia } from '../../../Utils/Media';
import MessageStore from '../../../Stores/MessageStore';
import './SharedDocument.css';

class SharedAudio extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

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
        const { chatId, messageId } = this.props;
        const { contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        return (
            <>
                <div className='shared-document' onContextMenu={this.handleOpenContextMenu}>
                    {getMedia(message, () => openMedia(chatId, messageId, true))}
                </div>
                <ContextMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    showOpenMessage={true}
                    onClose={this.handleCloseContextMenu}
                />
            </>
        );
    }
}

SharedAudio.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired
};

export default SharedAudio;
