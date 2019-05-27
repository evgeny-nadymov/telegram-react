/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import ChatDetails from './ChatDetails';
import GroupsInCommon from './GroupsInCommon';
import SharedMedia from './SharedMedia';
import { borderStyle } from '../Theme';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatInfo.css';

// const styles = (theme) => ({
//     borderColor: {
//         borderColor: theme.palette.divider
//     }
// });

class ChatInfo extends React.Component {
    constructor(props) {
        super(props);

        const { popup } = props;

        this.state = {
            chatId: popup ? ApplicationStore.dialogChatId : ApplicationStore.chatId
        };
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        const { popup } = this.props;
        if (popup) return;

        this.setState({
            chatId: update.nextChatId,
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
        const { popup } = this.props;
        const { userChatId } = this.state;
        if (userChatId) {
            this.setState({ userChatId: null });
        } else if (popup) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateDialogChatId',
                chatId: 0
            });
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

    render() {
        const { classes, className, popup } = this.props;
        const { chatId, userChatId, openSharedMedia, openGroupsInCommon } = this.state;
        const currentChatId = chatId || userChatId;

        let content = null;
        if (openSharedMedia) {
            content = <SharedMedia chatId={currentChatId} popup={popup} onClose={this.handleCloseSharedMedia} />;
        } else if (openGroupsInCommon) {
            content = <GroupsInCommon chatId={currentChatId} popup={popup} onClose={this.handleCloseGroupsInCommon} />;
        } else {
            content = (
                <ChatDetails
                    chatId={currentChatId}
                    popup={popup}
                    backButton={userChatId === chatId}
                    onOpenSharedMedia={this.handelOpenSharedMedia}
                    onOpenGroupsInCommon={this.handleOpenGroupsInCommon}
                    onClose={this.handleCloseChatDetails}
                />
            );
        }

        //return <>{content}</>;

        return popup ? (
            <>{content}</>
        ) : (
            <div className={classNames(classes.borderColor, { 'right-column': !popup }, className)}>{content}</div>
        );
    }
}

ChatInfo.propTypes = {
    className: PropTypes.string,
    classes: PropTypes.object,
    popup: PropTypes.bool
};

ChatInfo.defaultProps = {
    className: null,
    classes: null,
    popup: false
};

export default withStyles(borderStyle)(ChatInfo);
