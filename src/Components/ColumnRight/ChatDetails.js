/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withSnackbar } from 'notistack';
import { withTranslation } from 'react-i18next';
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail';
import GroupIcon from '@material-ui/icons/Group';
import CallIcon from '@material-ui/icons/Call';
import CloseIcon from '@material-ui/icons/Close';
import Divider from '@material-ui/core/Divider';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import HeadsetIcon from '@material-ui/icons/Headset';
import IconButton from '@material-ui/core/IconButton';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import InsertLinkIcon from '@material-ui/icons/InsertLink';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MicIcon from '@material-ui/icons/Mic';
import PhotoIcon from '@material-ui/icons/Photo';
import Typography from '@material-ui/core/Typography';
import VideocamIcon from '@material-ui/icons/Videocam';
import UserControl from '../Tile/UserControl';
import ChatControl from '../Tile/ChatControl';
import ChatDetailsHeader from './ChatDetailsHeader';
import NotificationsListItem from './NotificationsListItem';
import MoreListItem from './MoreListItem';
import {
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isGroupChat,
    getGroupChatMembers,
    getChatFullInfo,
    isPrivateChat,
    getChatUserId,
    isMeChat
} from '../../Utils/Chat';
import { getUserStatusOrder } from '../../Utils/User';
import { loadUsersContent, loadChatsContent } from '../../Utils/File';
import { formatPhoneNumber } from '../../Utils/Common';
import { openChat, openUser, setProfileMediaViewerContent } from '../../Actions/Client';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import OptionStore from '../../Stores/OptionStore';
import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatDetails.css';

const styles = theme => ({
    closeIconButton: {
        margin: '8px -2px 8px 12px'
    },
    nested: {
        // paddingLeft: theme.spacing.unit * 4,
    },
    close: {
        padding: theme.spacing.unit / 2
    },
    listItem: {
        padding: '11px 22px'
    }
});

class ChatDetails extends React.Component {
    constructor(props) {
        super(props);

        console.log('ChatDetails.ctor', this.props.counters);

        this.chatDetailsListRef = React.createRef();

        const { chatId } = this.props;

        this.members = new Map();
        this.state = {
            prevChatId: chatId
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {
            return {
                prevChatId: props.chatId
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

        // console.log(
        //     `[ChatDetails] getSnapshotBeforeUpdate chatId=${chatId} scrollTop=${scrollTop} scrollHeight=${scrollHeight} offsetHeight=${offsetHeight}`
        // );

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
        console.log('ChatDetails.componentDidMount');
        this.loadContent();

        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount() {
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
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
        }
    };

    handleUsernameHint = () => {
        const { t, chatId } = this.props;
        const username = getChatUsername(chatId);
        if (!username) return;

        const telegramUrlOption = OptionStore.get('t_me_url');
        const usernameLink = telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/';

        copy(usernameLink + username);

        const key = `${chatId}_copy_username`;
        const message = t('TextCopied');
        const action = null;

        this.handleScheduledAction(key, message, action);
    };

    handleScheduledAction = (key, message, action) => {
        if (!key) return;

        const { enqueueSnackbar, classes } = this.props;
        if (!enqueueSnackbar) return;

        const TRANSITION_DELAY = 150;
        if (
            ApplicationStore.addScheduledAction(key, NOTIFICATION_AUTO_HIDE_DURATION_MS + 2 * TRANSITION_DELAY, action)
        ) {
            enqueueSnackbar(message, {
                autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
                action: [
                    <IconButton
                        key='close'
                        aria-label='Close'
                        color='inherit'
                        className={classes.close}
                        onClick={() => ApplicationStore.removeScheduledAction(key)}>
                        <CloseIcon />
                    </IconButton>
                ]
            });
        }
    };

    handlePhoneHint = () => {
        const { t, chatId } = this.props;
        const phoneNumber = getChatPhoneNumber(chatId);
        if (!phoneNumber) return;

        copy(formatPhoneNumber(phoneNumber));

        const key = `${chatId}_copy_phone`;
        const message = t('PhoneCopied');
        const action = null;

        this.handleScheduledAction(key, message, action);
    };

    handleHeaderClick = () => {
        this.chatDetailsListRef.current.scrollTop = 0;
    };

    handleOpenViewer = () => {
        const { chatId, popup } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.photo) return;

        setProfileMediaViewerContent({ chatId: chatId });

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
            classes,
            onClose,
            onOpenGroupInCommon,
            onOpenSharedAudios,
            onOpenSharedDocuments,
            onOpenSharedLinks,
            onOpenSharedMedia,
            onOpenSharedPhotos,
            onOpenSharedVideos,
            onOpenSharedVoiceNotes,
            popup,
            t
        } = this.props;

        let { counters, migratedCounters } = this.props;
        counters = counters || [0, 0, 0, 0, 0, 0];
        migratedCounters = migratedCounters || [0, 0, 0, 0, 0, 0];
        console.log('ChatDetails.render counters', counters, migratedCounters);

        const [photoCount, videoCount, documentCount, audioCount, urlCount, voiceAndVideoNoteCount] = counters.map(
            (el, i) => el + migratedCounters[i]
        );

        const chat = ChatStore.get(chatId);
        if (!chat) {
            return (
                <div className='chat-details'>
                    <ChatDetailsHeader onClose={onClose} />
                    <div ref={this.chatDetailsListRef} className='chat-details-list' />
                </div>
            );
        }

        let groupInCommonCount = 0;
        if (isPrivateChat(chatId)) {
            const fullInfo = UserStore.getFullInfo(chat.type.user_id);
            groupInCommonCount = fullInfo ? fullInfo.group_in_common_count : groupInCommonCount;
        }

        const username = getChatUsername(chatId);
        const phoneNumber = getChatPhoneNumber(chatId);
        const bio = getChatBio(chatId);
        const isGroup = isGroupChat(chatId);
        const isMe = isMeChat(chatId);

        const members = getGroupChatMembers(chatId);
        const users = [];
        this.members = new Map();
        members.forEach(member => {
            const user = UserStore.get(member.user_id);
            if (user) {
                this.members.set(user.id, user.id);
                users.push(user);
            }
        });

        const sortedUsers = users.sort((x, y) => {
            return getUserStatusOrder(y) - getUserStatusOrder(x);
        });
        const items = sortedUsers.map(user => (
            <ListItem button className={classes.listItem} key={user.id}>
                <UserControl userId={user.id} onSelect={this.handleOpenUser} />
            </ListItem>
        ));

        const { photo } = chat;

        const content = (
            <>
                <ChatDetailsHeader
                    chatId={chatId}
                    backButton={backButton}
                    onClose={onClose}
                    onClick={this.handleHeaderClick}
                />
                <div ref={this.chatDetailsListRef} className='chat-details-list'>
                    <div className='chat-details-info'>
                        <ChatControl
                            chatId={chatId}
                            showStatus={popup}
                            showSavedMessages={!popup}
                            onTileSelect={photo ? this.handleOpenViewer : null}
                        />
                    </div>
                    {(username || phoneNumber || bio) && (
                        <>
                            <List>
                                {username && (
                                    <ListItem button className={classes.listItem} onClick={this.handleUsernameHint}>
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
                                        <ListItem button className={classes.listItem} onClick={this.handlePhoneHint}>
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
                                    <ListItem className={classes.listItem}>
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
                                {isGroup && <MoreListItem chatId={chatId} />}
                                {popup && !isGroup && (
                                    <ListItem button className={classes.listItem} onClick={this.handleOpenChat}>
                                        <ListItemText
                                            inset
                                            primary={
                                                <Typography color='primary' variant='inherit' noWrap>
                                                    {t('SendMessage').toUpperCase()}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                    {(photoCount > 0 ||
                        videoCount > 0 ||
                        documentCount > 0 ||
                        audioCount > 0 ||
                        urlCount > 0 ||
                        voiceAndVideoNoteCount > 0 ||
                        groupInCommonCount > 0) && (
                        <>
                            <Divider />
                            <List>
                                {photoCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedPhotos}>
                                        <ListItemIcon>
                                            <PhotoIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {photoCount === 1 ? '1 photo' : `${photoCount} photos`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {videoCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedVideos}>
                                        <ListItemIcon>
                                            <VideocamIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {videoCount === 1 ? '1 video' : `${videoCount} videos`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {documentCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedDocuments}>
                                        <ListItemIcon>
                                            <InsertDriveFileIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {documentCount === 1 ? '1 file' : `${documentCount} files`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {audioCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedAudios}>
                                        <ListItemIcon>
                                            <HeadsetIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {audioCount === 1 ? '1 audio file' : `${audioCount} audio files`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {urlCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedLinks}>
                                        <ListItemIcon>
                                            <InsertLinkIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {urlCount === 1 ? '1 shared link' : `${urlCount} shared links`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {voiceAndVideoNoteCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenSharedVoiceNotes}>
                                        <ListItemIcon>
                                            <MicIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {voiceAndVideoNoteCount === 1
                                                        ? '1 voice message'
                                                        : `${voiceAndVideoNoteCount} voice messages`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                                {groupInCommonCount > 0 && (
                                    <ListItem button className={classes.listItem} onClick={onOpenGroupInCommon}>
                                        <ListItemIcon>
                                            <GroupIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            inset
                                            primary={
                                                <Typography variant='inherit' noWrap>
                                                    {groupInCommonCount === 1
                                                        ? '1 group in common'
                                                        : `${groupInCommonCount} groups in common`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                    {items.length > 0 && (
                        <>
                            <Divider />
                            <List>{items}</List>
                        </>
                    )}
                </div>
            </>
        );

        return popup ? <>{content}</> : <div className={classNames('chat-details', className)}>{content}</div>;
    }
}

ChatDetails.propTypes = {
    chatId: PropTypes.number.isRequired,
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
    withStyles(styles, { withTheme: true }),
    withSnackbar,
    withRestoreRef()
);

export default enhance(ChatDetails);
