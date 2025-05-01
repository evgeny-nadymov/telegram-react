/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
// import { compose } from '../../../Utils/HOC';
import { withTranslation } from 'react-i18next';
// import { withRestoreRef, withSaveRef } from '../../../Utils/HOC';
// import CheckMarkIcon from '@mui/icons-material/Check';
// import DayMeta from '../DayMeta';
// import Reply from '../Reply';
// import Forward from '../Forward';
import Meta from '../Meta';
// import MessageAuthor from '../MessageAuthor';
// import Header from '../../ColumnMiddle/Storage/Header';
import MessageMenu from '../MessageMenu';
import UserTile from '../../Tile/UserTile';
import ChatTile from '../../Tile/ChatTile';
import EmptyTile from '../../Tile/EmptyTile';
// import UnreadSeparator from '../UnreadSeparator';
// import WebPage from '../Media/WebPage';
import FileStore from '../../../Stores/FileStore';
// import UserStore from '../../../Stores/UserStore';
import { download, saveOrDownload, supportsStreaming } from '../../../Utils/File';
import {
    getEmojiMatches,
    getText,
    getWebPage,
    openMedia,
    showMessageForward,
    isMetaBubble,
    canMessageBeForwarded,
    getMessageStyle
} from '../../../Utils/Message';
import { getMedia } from '../../../Utils/Media';
import { canSendMessages, isChannelChat, isPrivateChat } from '../../../Utils/Chat';
import {
    openUser,
    openChat,
    selectMessage,
    openReply,
    replyMessage,
    forwardMessages
} from '../../../Actions/Client';
import MessageStore from '../../../Stores/MessageStore';
import '../Message.css';
import Folder from './icons/folder';


class FileItem extends Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = this.props;
        this.state = {
            message: MessageStore.get(chatId, messageId),
            emojiMatches: getEmojiMatches(chatId, messageId),
            selected: false,
            highlighted: false,
            shook: false,

            contextMenu: false,
            copyLink: null,
            left: 0,
            top: 0,

            folders: [],
            files: []
        };
        
        // console.warn("constructor");
        // this.setState({path: this.props.getPath()});
        
        this.openFolder = this.openFolder.bind(this);
        this.loadFileStructure = this.loadFileStructure.bind(this);
        
        // this.loadFileStructure();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.warn("shouldComponentUpdate");
        // this.loadFileStructure();

        const { chatId, messageId, sendingState, showUnreadSeparator, showTail, showTitle } = this.props;
        const { contextMenu, selected, highlighted, shook, emojiMatches } = this.state;

        if (nextProps.chatId !== chatId) {
            // console.log('Message.shouldComponentUpdate true chatId');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            // console.log('Message.shouldComponentUpdate true messageId');
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            // console.log('Message.shouldComponentUpdate true sendingState');
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            // console.log('Message.shouldComponentUpdate true showUnreadSeparator');
            return true;
        }

        if (nextProps.showTail !== showTail) {
            // console.log('Message.shouldComponentUpdate true showTail');
            return true;
        }

        if (nextProps.showTitle !== showTitle) {
            // console.log('Message.shouldComponentUpdate true showTitle');
            return true;
        }

        if (nextState.contextMenu !== contextMenu) {
            // console.log('Message.shouldComponentUpdate true contextMenu');
            return true;
        }

        if (nextState.selected !== selected) {
            // console.log('Message.shouldComponentUpdate true selected');
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            // console.log('Message.shouldComponentUpdate true highlighted');
            return true;
        }

        if (nextState.shook !== shook) {
            // console.log('Message.shouldComponentUpdate true shook');
            return true;
        }

        if (nextState.emojiMatches !== emojiMatches) {
            // console.log('Message.shouldComponentUpdate true emojiMatches');
            return true;
        }

        // console.log('Message.shouldComponentUpdate false');
        return false;
    }
    
    componentDidMount() {
        // console.warn("componentDidMount");
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    openFolder(folder) {
        // if (folder!='') {
        // if (true) {
            let format = '[\"'+folder+'\"]["@structure"]';
            let newPath = this.props.getPath() + format;
            // console.log(newPath);

            this.props.setPath(newPath);
        // }



        var folders = [];
        var files = [];
        var json = this.state.json;

        let path = eval(newPath);

        for (let key in path) {
            // console.log(key, "->", path[key]);
            if (path[key]['@type'] == "folder") {
                folders.push(
                    <Folder 
                        folder_name={key}
                        openFolder={this.openFolder}
                    ></Folder>
                );
            }
            else {
                files.push(
                    <Folder 
                        folder_name={key}
                        openFolder={this.openFolder}
                    ></Folder>
                );
            }
        }
        
        this.setState({
            folders: folders,
            files: files
        });

        // console.warn(folders);
        // this.props.storage_operations("put", "folders", folders);
        // this.props.storage_operations("put", "files", files);
        this.forceUpdate();
    }

    goBackPath() {
        let current = this.props.getPath();
        var pos = current.lastIndexOf('[', current.lastIndexOf('[')-1);
        var newPath = current.substring(0, pos);
        
        this.setPath(newPath);

        this.openFolder('');
    }

    loadFileStructure() {
        // console.warn("loadFileStructure");
        // const { t, chatId, messageId, showUnreadSeparator, showTitle, showDate } = this.props;
        const { chatId, messageId } = this.props;
        // console.log("ids\n", chatId, messageId);
        
        const message = MessageStore.get(chatId, messageId);

        // Storage load on storage page click
        var json;
        var folders = [];
        var files = [];

        const msg_content  = message.content;
        if (msg_content['@type'] == 'messageDocument') {
            const msg_document = msg_content.document;
    
            var file = msg_document.document;
            var filename = msg_document.file_name;
    
            if (!file) return;
            if (!filename) return;
    
            // console.warn("FileId", file.id);

            let blob = FileStore.getBlob(file.id) || file.blob;
            
            download(file, message, () => {
                blob = FileStore.getBlob(file.id) || file.blob;
                if (blob) {
                    if (typeof window.navigator.msSaveBlob !== 'undefined') {
                        window.navigator.msSaveBlob(blob, filename);
                    } else {
                        let blobURL = window.URL.createObjectURL(blob);
                        let tempLink = document.createElement('a');
                        tempLink.style.display = 'none';
                        tempLink.href = blobURL;
                        tempLink.setAttribute('download', filename);
                        
                        if (typeof tempLink.download === 'undefined') {
                            tempLink.setAttribute('target', '_blank');
                        }
                        
                        if (filename == "FileStructure.json"){
                            // console.log("getMyId :", UserStore.getMyId());
                            fetch(blobURL).then((resp)=>{ 
                                return resp.text() }).then((text)=>{
                                    json = JSON.parse(text);

                                    this.setState({json: json});

                                    if (json.type == "FileStructure") {
                                        // console.log("Current Work");
                                        // console.log("FileStructure.json Contents", json); 

                                        let path = eval(this.props.getPath());

                                        for (let key in path) {
                                            // console.log(key, "->", path[key]);
                                            if (path[key]['@type'] == "folder") {
                                                folders.push(
                                                    <Folder 
                                                        folder_name={key}
                                                        openFolder={this.openFolder}
                                                    ></Folder>
                                                );
                                            }
                                            else {
                                                files.push(
                                                    <Folder 
                                                        folder_name={key}
                                                        openFolder={this.openFolder}
                                                    ></Folder>
                                                );
                                            }
                                        }
                                        
                                        // return {folders: folders, files: files};
                                        this.setState({
                                            folders: folders,
                                            files: files
                                        });
                                        // this.props.storage_operations("put", "folders", folders);
                                        // this.props.storage_operations("put", "files", files);
                                        this.forceUpdate();
                                        // console.warn("In state vars", this.state);
                                    }
                                }
                            );
                        }
                        
                        window.URL.revokeObjectURL(blobURL);
                    }
                }
            });
        }
    }

    componentWillUnmount() {
        // console.warn("componentWillUnmount");
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    onClientUpdateClearSelection = update => {
        if (!this.state.selected) return;

        this.setState({ selected: false });
    };

    onClientUpdateMessageShake = update => {
        const { chatId, messageId } = this.props;
        const { shook } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (shook) {
                this.setState({ shook: false }, () => {
                    setTimeout(() => {
                        this.setState({ shook: true });
                    }, 0);
                });
            } else {
                this.setState({ shook: true });
            }
        }
    };

    onClientUpdateMessageHighlighted = update => {
        const { chatId, messageId } = this.props;
        const { selected, highlighted } = this.state;

        if (selected) return;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (highlighted) {
                this.setState({ highlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true });
                    }, 0);
                });
            } else {
                this.setState({ highlighted: true });
            }
        } else if (highlighted) {
            this.setState({ highlighted: false });
        }
    };

    onClientUpdateMessageSelected = update => {
        const { chatId, messageId } = this.props;
        const { selected } = update;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ selected, highlighted: false });
        }
    };

    onUpdateMessageContent = update => {
        const { chat_id, message_id } = update;
        const { chatId, messageId } = this.props;
        const { emojiMatches } = this.state;

        if (chatId !== chat_id) return;
        if (messageId !== message_id) return;

        const newEmojiMatches = getEmojiMatches(chatId, messageId);
        if (newEmojiMatches !== emojiMatches) {
            this.setState({ emojiMatches: getEmojiMatches(chatId, messageId) });
        } else {
            this.forceUpdate();
        }
    };

    handleSelectUser = userId => {
        openUser(userId, true);
    };

    handleSelectChat = chatId => {
        openChat(chatId, null, true);
    };

    handleSelection = () => {
        if (!this.mouseDown) return;

        const selection = window.getSelection().toString();
        if (selection) return;

        const { chatId, messageId } = this.props;

        const selected = !MessageStore.selectedItems.has(`chatId=${chatId}_messageId=${messageId}`);
        selectMessage(chatId, messageId, selected);
    };

    handleDateClick = e => {
        e.preventDefault();
        e.stopPropagation();

        const { chatId, messageId } = this.props;

        const canBeReplied = canSendMessages(chatId);
        if (canBeReplied) {
            replyMessage(chatId, messageId);

            return;
        }

        const canBeForwarded = canMessageBeForwarded(chatId, messageId);
        if (canBeForwarded) {
            forwardMessages(chatId, [messageId]);
        }
    };

    openMedia = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { chatId, messageId } = this.props;

        openMedia(chatId, messageId);
    };

    handleAnimationEnd = () => {
        this.setState({ highlighted: false });
    };

    handleMouseDown = () => {
        this.mouseDown = true;
    };

    handleMouseOver = () => {
        this.mouseDown = false;
    };

    handleMouseOut = () => {
        this.mouseOut = false;
    };

    handleReplyClick = () => {
        const { chatId, messageId } = this.props;
        openReply(chatId, messageId);
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
            if (MessageStore.selectedItems.size > 1) {
                return;
            }

            const left = event.clientX;
            const top = event.clientY;
            const copyLink =
                event.target && event.target.tagName === 'A' && event.target.href ? event.target.href : null;

            this.setState({
                contextMenu: true,
                copyLink,
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
        let { showTail } = this.props;
        const { t, chatId, messageId, showUnreadSeparator, showTitle, showDate } = this.props;
        const {
            emojiMatches,
            selected,
            highlighted,
            shook,
            copyLink,
            contextMenu,
            left,
            top
        } = this.state;

        // console.log('Message.render', messageId);

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty message]</div>;

        const { content, is_outgoing, views, date, edit_date, reply_to_message_id, forward_info, sender_user_id } = message;

        const isOutgoing = is_outgoing && !isChannelChat(chatId);
        const inlineMeta = (
            <Meta
                className='meta-hidden'
                key={`${chatId}_${messageId}_meta`}
                chatId={chatId}
                messageId={messageId}
                date={date}
                editDate={edit_date}
                views={views}
            />
        );
        const meta = (
            <Meta
                className={classNames('meta-text', {
                    'meta-bubble': isMetaBubble(chatId, messageId)
                })}
                chatId={chatId}
                messageId={messageId}
                date={date}
                editDate={edit_date}
                views={views}
                onDateClick={this.handleDateClick}
            />
        );

        const webPage = getWebPage(message);
        const text = getText(message, !!webPage ? null : inlineMeta, t);
        // console.log(text);
        const hasCaption = text !== null && text.length > 0;
        const showForward = showMessageForward(chatId, messageId);
        const showReply = Boolean(reply_to_message_id);
        const suppressTitle = isPrivateChat(chatId);
        const hasTitle = (!suppressTitle && showTitle) || showForward || showReply;
        const media = getMedia(message, this.openMedia, { hasTitle, hasCaption, inlineMeta, meta });
        const isChannel = isChannelChat(chatId);
        const isPrivate = isPrivateChat(chatId);

        // if (showTail && isMediaContent() && !hasCaption) {
        //     showTail = false;
        // }

        let tile = null;
        if (showTail) {
            if (isPrivate) {
                tile = <EmptyTile small />
            } else if (isChannel) {
                tile = <EmptyTile small />
            } else if (is_outgoing) {
                tile = <EmptyTile small />
            } else if (sender_user_id) {
                tile = <UserTile small userId={sender_user_id} onSelect={this.handleSelectUser} />
            } else {
                tile = <ChatTile small chatId={chatId} onSelect={this.handleSelectChat} />
            }
        }

        const style = getMessageStyle(chatId, messageId);
        const withBubble = content['@type'] !== 'messageSticker' && content['@type'] !== 'messageVideoNote';

        // console.log('[p] m.render id=' + message.id);

        // return (
        //     <StubMessage>
        //         {text}
        //         {media}
        //         <WebPage
        //             chatId={chatId}
        //             messageId={messageId}
        //             openMedia={this.openMedia}
        //             meta={inlineMeta}
        //         />
        //     </StubMessage>
        // );
        
        
        this.loadFileStructure();
        
        
              
        return (
            <div>

                {/* <Header
                    ref={this.headerRef}
                    goBackPath={this.goBackPath}
                /> */}

                {this.state.folders}
                {this.state.files}

                <div
                    className={classNames('message', {
                        'message-short': !tile,
                        'message-out': isOutgoing,
                        'message-selected': selected,
                        'message-highlighted': highlighted && !selected,
                        'message-group-title': showTitle && !showTail,
                        'message-group': !showTitle && !showTail,
                        'message-group-tail': !showTitle && showTail,
                        'message-bubble-hidden': !withBubble
                    })}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                    onMouseDown={this.handleMouseDown}
                    onClick={this.handleSelection}
                    onAnimationEnd={this.handleAnimationEnd}
                    onContextMenu={this.handleOpenContextMenu}>
                    <div className='message-body'>
                        
                    </div>
                </div>
                <MessageMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    copyLink={copyLink}
                />
            </div>
        );
    }
}

// const enhance = compose(
//     withSaveRef(),
//     withTranslation(),
//     withRestoreRef()
// );

const file = withTranslation(['translation', 'local'], { withRef: true })(FileItem);

export default file;
