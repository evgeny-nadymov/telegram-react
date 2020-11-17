/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from '../../Utils/HOC';
import { withSnackbar } from 'notistack';
import { withTranslation } from 'react-i18next';
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail';
import CallIcon from '@material-ui/icons/Call';
import CloseIcon from '../../Assets/Icons/Close';
import Divider from '@material-ui/core/Divider';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Chat from '../Tile/Chat';
import ChatDetailsHeader from './ChatDetailsHeader';
import NotificationsListItem from './NotificationsListItem';
import SharedMediaTabs from './SharedMedia/SharedMediaTabs';
import { copy } from '../../Utils/Text';
import { getFormattedText, getUrlMentionHashtagEntities } from '../../Utils/Message';
import {
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isGroupChat,
    getGroupChatMembers,
    getChatFullInfo,
    isMeChat, isChannelChat, getChatMedia
} from '../../Utils/Chat';
import { loadUsersContent, loadChatsContent } from '../../Utils/File';
import { formatPhoneNumber } from '../../Utils/Phone';
import { openChat, openUser, setProfileMediaViewerContent } from '../../Actions/Client';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import OptionStore from '../../Stores/OptionStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatDetails.css';

class ChatMedia extends React.Component {
    constructor(props) {
        super(props);

        this.chatDetailsListRef = React.createRef();

        const { chatId } = this.props;

        this.members = new Map();
        this.state = {
            prevChatId: chatId
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {
            const media = MessageStore.getMedia(props.chatId);

            return {
                prevChatId: props.chatId,
                photoAndVideo: media ? media.photoAndVideo : [],
                document: media ? media.document : [],
                audio: media ? media.audio : [],
                url: media ? media.url : [],
                voiceNote: media ? media.voiceNote : []
            };
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { chatId } = this.props;

        const list = this.chatDetailsListRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = list;
        const snapshot = {
            scrollTop,
            scrollHeight,
            offsetHeight
        };

        return snapshot;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, theme, counters, migratedCounters } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.counters !== counters) {
            return true;
        }

        if (nextProps.migratedCounters !== migratedCounters) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId } = this.props;
        if (prevProps.chatId !== chatId) {
            this.loadContent();
        }

        const list = this.chatDetailsListRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;
        if (prevProps.chatId === chatId) {
            list.scrollTop = scrollTop;
        } else {
            list.scrollTop = 0;
        }
    }

    componentDidMount() {
        this.loadContent();

        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount() {
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.off('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.off('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    onUpdateBasicGroupFullInfo = update => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group_id
        ) {
            this.forceUpdate(); // update bio
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup_id
        ) {
            this.forceUpdate(); // update bio
        }
    };

    onUpdateUserFullInfo = update => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (
            chat.type &&
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.forceUpdate(); // update bio
        }
    };

    onUpdateUserStatus = update => {
        if (this.members.has(update.user_id)) {
            this.forceUpdate();
        }
    };

    loadContent = () => {
        this.loadChatContents();
    };

    loadChatContents = () => {
        const { chatId, popup } = this.props;

        const store = FileStore.getStore();

        loadChatsContent(store, [chatId]);
        const members = getGroupChatMembers(chatId).map(x => x.user_id);
        loadUsersContent(store, members);

        if (popup) {
            getChatFullInfo(chatId);
            getChatMedia(chatId);
        }
    };

    handleUsernameHint = () => {
        const { t, chatId } = this.props;
        const username = getChatUsername(chatId);
        if (!username) return;

        const telegramUrlOption = OptionStore.get('t_me_url');
        const usernameLink = telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/';

        copy(usernameLink + username);

        this.handleScheduledAction(t('LinkCopied'));
    };

    handleScheduledAction = message => {
        const { enqueueSnackbar, closeSnackbar } = this.props;

        const snackKey = enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => {
                        closeSnackbar(snackKey);
                    }}>
                    <CloseIcon />
                </IconButton>
            ]
        });
    };

    handlePhoneHint = () => {
        const { t, chatId } = this.props;
        const phoneNumber = getChatPhoneNumber(chatId);
        if (!phoneNumber) return;

        copy(formatPhoneNumber(phoneNumber));

        this.handleScheduledAction(t('PhoneCopied'));
    };

    handleHeaderClick = () => {
        this.chatDetailsListRef.current.scrollTop = 0;
    };

    handleOpenViewer = () => {
        const { chatId, popup } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.photo) return;

        setProfileMediaViewerContent({ chatId });

        if (popup) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateDialogChatId',
                chatId: 0
            });
        }
    };

    handleOpenChat = () => {
        const { chatId, popup } = this.props;

        openChat(chatId, null, false);

        if (popup) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateDialogChatId',
                chatId: 0
            });
        }
    };

    handleOpenUser = userId => {
        openUser(userId, true);
    };

    getContentHeight = () => {
        if (!this.chatDetailsListRef) return 0;

        return this.chatDetailsListRef.current.clientHeight;
    };

    render() {
        const {
            backButton,
            className,
            chatId,
            onClose,
            popup,
            t
        } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) {
            return (
                <div className='chat-details'>
                    <ChatDetailsHeader onClose={onClose} />
                    <div ref={this.chatDetailsListRef} className={classNames('chat-details-list', 'scrollbars-hidden')} />
                </div>
            );
        }

        const username = getChatUsername(chatId);
        const phoneNumber = getChatPhoneNumber(chatId);
        let bio = getChatBio(chatId);
        const isGroup = isGroupChat(chatId);
        const isMe = isMeChat(chatId);

        const { photo } = chat;

        if (isGroupChat(chatId) || isChannelChat(chatId)) {
            const { text: bioText, entities: bioEntities } = getUrlMentionHashtagEntities(bio, []);
            if (bioEntities.length > 0) {
                bio = getFormattedText({ '@type': 'formattedText', text: bioText, entities: bioEntities });
            }
        }

        const content = (
            <>
                <ChatDetailsHeader
                    chatId={chatId}
                    backButton={backButton}
                    onClose={onClose}
                    onClick={this.handleHeaderClick}
                />
                <div ref={this.chatDetailsListRef} className={classNames('chat-details-list', 'scrollbars-hidden')}>
                    <div className='chat-details-info'>
                        <Chat
                            chatId={chatId}
                            big={true}
                            showStatus={true}
                            showSavedMessages={!popup}
                            onTileSelect={photo ? this.handleOpenViewer : null}
                        />
                    </div>
                    {!isMe && (username || phoneNumber || bio) && (
                        <>
                            <List>
                                {username && (
                                    <ListItem button className='list-item' onClick={this.handleUsernameHint}>
                                        <ListItemIcon>
                                            <AlternateEmailIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {username}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {phoneNumber && (
                                    <>
                                        <ListItem button className='list-item' onClick={this.handlePhoneHint}>
                                            <ListItemIcon>
                                                <CallIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant='inherit' noWrap>
                                                        {formatPhoneNumber(phoneNumber)}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </>
                                )}
                                {bio && (
                                    <ListItem className='list-item' alignItems='flex-start'>
                                        <ListItemIcon>
                                            <ErrorOutlineIcon className='chat-details-info-icon' />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={bio}
                                            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                    {(!isMe || isGroup || (popup && !isGroup)) && (
                        <>
                            <Divider />
                            <List>
                                {!isMe && <NotificationsListItem chatId={chatId} />}
                                {/*{isGroup && <MoreListItem chatId={chatId} />}*/}
                                {popup && !isGroup && (
                                    <ListItem button className='list-item' onClick={this.handleOpenChat}>
                                        <ListItemText
                                            primary={
                                                <Typography color='primary' variant='inherit' noWrap>
                                                    {t('SendMessage').toUpperCase()}
                                                </Typography>
                                            }
                                            style={{ paddingLeft: 40 }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                </div>
                <SharedMediaTabs chatId={chatId}/>
            </>
        );

        return popup ? <>{content}</> : <div className={classNames('chat-details', className)}>{content}</div>;
    }
}

ChatMedia.propTypes = {
    chatId: PropTypes.number,
    popup: PropTypes.bool,
    onClose: PropTypes.func,
    onOpenGroupInCommon: PropTypes.func,
    onOpenSharedDocuments: PropTypes.func,
    onOpenSharedMedia: PropTypes.func,
    onOpenSharedLinks: PropTypes.func,
    onOpenSharedPhotos: PropTypes.func,
    onOpenSharedVideos: PropTypes.func,
    onOpenSharedVoiceNotes: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withSnackbar,
    withRestoreRef()
);

export default enhance(ChatMedia);
