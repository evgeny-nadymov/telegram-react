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
import ChatDetails from './ChatDetails';
import GroupsInCommon from './GroupsInCommon';
import SharedDocument from './SharedMedia/SharedDocuments';
import SharedMedia from './SharedMedia';
import { borderStyle } from '../Theme';
import { getChatCounters } from '../../Actions/Chat';
import ApplicationStore from '../../Stores/ApplicationStore';
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

        console.log('ChatDetails.ChatInfo.ctor');

        this.detailsRef = React.createRef();

        const { popup } = props;
        const { chatId, dialogChatId } = ApplicationStore;

        this.state = {
            chatId: popup ? dialogChatId : chatId,
            userChatId: null,
            openSharedMedia: false,
            openSharedDocument: false,
            openGroupInCommon: false,
            counters: null
        };
    }

    componentDidMount() {
        console.log('ChatDetails.ChatInfo.componentDidMount');
        this.loadChatCounters(this.state.chatId);

        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId } = this.state;
        if (chatId !== prevState.chatId) {
            this.loadChatCounters(chatId);
        }
    }

    onClientUpdateChatId = update => {
        const { popup } = this.props;
        const { chatId } = this.state;

        if (popup) return;
        if (chatId === update.nextChatId) return;

        this.setState({
            chatId: update.nextChatId,
            userChatId: null,
            openSharedMedia: false,
            openSharedDocument: false,
            openGroupInCommon: false,
            counters: null
        });
    };

    loadChatCounters = async chatId => {
        const counters = await getChatCounters(chatId);

        if (chatId !== this.state.chatId) return;

        this.setState({ counters });
    };

    handelOpenSharedMedia = () => {
        this.setState({ openSharedMedia: true });
    };

    handleCloseSharedMedia = () => {
        this.setState({ openSharedMedia: false });
    };

    handleOpenGroupInCommon = () => {
        this.setState({ openGroupInCommon: true });
    };

    handleCloseGroupsInCommon = () => {
        this.setState({ openGroupInCommon: false });
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

    handleOpenSharedDocument = () => {
        this.setState({ openSharedDocument: true });
    };

    handleCloseSharedDocument = () => {
        this.setState({ openSharedDocument: false });
    };

    render() {
        console.log('ChatDetails.ChatInfo.render', this.state);
        const { classes, className, popup } = this.props;
        const { chatId, counters, userChatId, openSharedDocument, openSharedMedia, openGroupInCommon } = this.state;

        const currentChatId = chatId || userChatId;
        const minHeight = this.detailsRef && this.detailsRef.current ? this.detailsRef.current.getContentHeight() : 0;

        let content = null;
        if (openSharedMedia) {
            content = (
                <SharedMedia
                    chatId={currentChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedMedia}
                />
            );
        } else if (openSharedDocument) {
            content = (
                <SharedDocument
                    chatId={currentChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedDocument}
                />
            );
        } else if (openGroupInCommon) {
            content = (
                <GroupsInCommon
                    chatId={currentChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseGroupsInCommon}
                />
            );
        } else {
            content = (
                <ChatDetails
                    ref={this.detailsRef}
                    chatId={currentChatId}
                    popup={popup}
                    backButton={userChatId === chatId}
                    counters={counters}
                    onOpenSharedMedia={this.handelOpenSharedMedia}
                    onOpenSharedDocument={this.handleOpenSharedDocument}
                    onOpenGroupInCommon={this.handleOpenGroupInCommon}
                    onClose={this.handleCloseChatDetails}
                />
            );
        }

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
