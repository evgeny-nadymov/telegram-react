/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import ChatInfo from '../ColumnRight/ChatInfo';
import { modalManager } from '../../Utils/Modal';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatInfoDialog.css';

class ChatInfoDialog extends React.Component {
    state = {
        chatId: ApplicationStore.dialogChatId
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId } = this.state;

        return nextState.chatId !== chatId;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    onClientUpdateMediaViewerContent = update => {
        if (ApplicationStore.mediaViewerContent) {
            this.handleClose();
        }
    };

    onClientUpdateDialogChatId = update => {
        const { chatId } = update;

        this.setState({ chatId });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDialogChatId',
            chatId: 0
        });
    };

    render() {
        const { chatId } = this.state;
        if (!chatId) return null;

        return (
            <Dialog
                open
                manager={modalManager}
                transitionDuration={0}
                onClose={this.handleClose}
                classes={{
                    root: 'chat-info-dialog-root',
                    container: 'chat-info-dialog-container',
                    paper: 'chat-info-dialog-paper'
                }}>
                <ChatInfo className='chat-info-dialog-content' chatId={chatId} popup />
            </Dialog>
        );
    }
}

ChatInfoDialog.propTypes = {};

export default ChatInfoDialog;
