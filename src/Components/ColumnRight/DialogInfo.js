/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import ChatDetails from './ChatDetails';
import SharedMedia from './SharedMedia';
import GroupsInCommon from './GroupsInCommon';
import ChatStore from '../../Stores/ChatStore';
import { borderStyle } from '../Theme';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './DialogInfo.css';

// const styles = (theme) => ({
//     borderColor: {
//         borderColor: theme.palette.divider
//     }
// });

class DialogInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentChatId: ApplicationStore.getChatId()
        };
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        this.setState({
            currentChatId: update.nextChatId,
            userChatId: null,
            openSharedMedia: false,
            openGroupsInCommon: false
        });
    };

    handelOpenSharedMedia = () => {
        this.setState({ openSharedMedia: true });
    };

    handleCloseSharedMedia = () => {
        this.setState({ openSharedMedia: false });
    };

    handleOpenGroupsInCommon = () => {
        this.setState({ openGroupsInCommon: true });
    };

    handleCloseGroupsInCommon = () => {
        this.setState({ openGroupsInCommon: false });
    };

    handleCloseChatDetails = () => {
        const { userChatId } = this.state;
        if (userChatId) {
            this.setState({ userChatId: null });
        } else {
            ApplicationStore.changeChatDetailsVisibility(false);
        }
    };

    handleSelectUser = async user => {
        if (!user) return;

        let chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: user.id,
            force: true
        });

        chat = ChatStore.get(chat.id) || chat;
        if (!chat) return;

        this.setState({ userChatId: chat.id });
    };

    handleSelectChat = chat => {
        if (!chat) return;

        this.props.onSelectChat(chat.id);
    };

    render() {
        const { classes } = this.props;
        const { currentChatId, userChatId, openSharedMedia, openGroupsInCommon } = this.state;

        let content = null;
        if (openSharedMedia) {
            const chatId = userChatId || currentChatId;

            content = <SharedMedia chatId={chatId} close={this.handleCloseSharedMedia} />;
        } else if (openGroupsInCommon) {
            const chatId = userChatId || currentChatId;

            content = (
                <GroupsInCommon
                    chatId={chatId}
                    onClose={this.handleCloseGroupsInCommon}
                    onSelectChat={this.handleSelectChat}
                />
            );
        } else {
            const chatId = userChatId || currentChatId;
            const backButton = userChatId === chatId;

            content = (
                <ChatDetails
                    chatId={chatId}
                    backButton={backButton}
                    openSharedMedia={this.handelOpenSharedMedia}
                    openGroupsInCommon={this.handleOpenGroupsInCommon}
                    onClose={this.handleCloseChatDetails}
                    onSelectUser={this.handleSelectUser}
                    onSelectChat={this.handleSelectChat}
                />
            );
        }

        return <div className={classNames(classes.borderColor, 'right-column')}>{content}</div>;
    }
}

export default withStyles(borderStyle)(DialogInfo);
