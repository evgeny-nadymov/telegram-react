/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import ChatInfoDialog from '../Popup/ChatInfoDialog';
import Footer from './Footer';
import Header from './Header';
import HeaderPlayer from '../Player/HeaderPlayer';
import MessagesList from './MessagesList';
import StickerSetDialog from '../Popup/StickerSetDialog';
import { getSrc } from '../../Utils/File';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './DialogDetails.css';


class DialogDetails extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chatId: AppStore.getChatId(),
            messageId: AppStore.getMessageId(),
            selectedCount: 0,
            wallpaper: null,
            wallpaperSrc: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, selectedCount, wallpaper } = this.state;
        if (nextState.chatId !== chatId) {
            return true;
        }
        if (nextState.messageId !== messageId) {
            return true;
        }
        if (nextState.selectedCount !== selectedCount) {
            return true;
        }
        if (nextState.wallpaper !== wallpaper) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        ChatStore.on('clientUpdateChatBackground', this.onClientUpdateChatBackground);
        FileStore.on('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
        ChatStore.off('clientUpdateChatBackground', this.onClientUpdateChatBackground);
        FileStore.off('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentBlob = update => {
        const { wallpaper } = this.state;
        if (!wallpaper) return;

        const { document } = wallpaper;
        if (!document) return;

        const { document: file } = document;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        if (this.thumbnailTime) {
            if (this.thumbnailTime.wallpaper === wallpaper) {
                const diff = new Date() - this.thumbnailTime.time;
                if (diff < 250) {
                    setTimeout(() => {
                        this.forceUpdate();
                    }, 250);
                    return;
                }
            }
        }

        this.forceUpdate();
    };

    onClientUpdateDocumentThumbnailBlob = update => {
        const { wallpaper } = this.state;
        if (!wallpaper) return;

        const { document } = wallpaper;
        if (!document) return;

        const { thumbnail } = document;
        if (!thumbnail) return;

        const { file } = thumbnail;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        this.thumbnailTime = {
            wallpaper,
            time: new Date()
        };
        this.forceUpdate();
    };

    onClientUpdateChatBackground = update => {
        const { wallpaper } = update;

        this.thumbnailTime = {
            wallpaper,
            time: new Date()
        };
        this.setState({
            wallpaper
        });
    };

    onClientUpdateChatDetailsVisibility = update => {
        this.forceUpdate();
    };

    onClientUpdateChatId = update => {
        this.setState({
            chatId: update.nextChatId,
            messageId: update.nextMessageId
        });
    };

    scrollToBottom = () => {
        this.messagesList.scrollToBottom();
    };

    scrollToStart = () => {
        this.messagesList.scrollToStart();
    };

    scrollToMessage = () => {
        this.messagesList.scrollToMessage();
    };

    render() {
        /*let groups = [];
        if (this.props.history.length > 0){
            let currentGroup = {
                key: this.props.history[0].id,
                date: this.props.history[0].date,
                senderUserId: this.props.history[0].sender_user_id,
                messages: [this.props.history[0]]
            };

            for (let i = 1; i < this.props.history.length; i++){
                if (this.props.history[i].sender_user_id === currentGroup.senderUserId
                    && Math.abs(this.props.history[i].date - currentGroup.date) <= 10 * 60
                    && i % 20 !== 0){
                    currentGroup.key += '_' + this.props.history[i].id;
                    currentGroup.messages.push(this.props.history[i]);
                }
                else {
                    groups.push(currentGroup);
                    currentGroup = {
                        key: this.props.history[i].id,
                        date: this.props.history[i].date,
                        senderUserId: this.props.history[i].sender_user_id,
                        messages: [this.props.history[i]]
                    };
                }
            }
            groups.push(currentGroup);
        }

        this.groups = groups.map(x => {
            return (<MessageGroup key={x.key} senderUserId={x.senderUserId} messages={x.messages} onSelectChat={this.props.onSelectChat}/>);
        });*/
        const { chatId, messageId, wallpaper } = this.state;

        let style = null;
        let src = null;
        if (wallpaper) {
            const { document } = wallpaper;
            if (document) {
                const { thumbnail, document: file } = document;
                if (file) {
                    src = getSrc(file);
                }

                if (!src && thumbnail) {
                    src = getSrc(thumbnail.file);
                }
            }

            style = {
                backgroundImage: src ? `url(${src})` : null
            }
        }

        // console.log('[p] dialogDetails.render');
        // console.log(ref => (this.messagesList = ref));

        return (
            <div className='dialog-details' style={style}>
                <HeaderPlayer />
                <Header chatId={chatId} />
                <MessagesList ref={ref => (this.messagesList = ref)} chatId={chatId} messageId={messageId} />
                {/* <MessagesList ref={ref => (this.messagesList = ref)} chatId={-1001263167641} messageId={null} /> */}
                <Footer chatId={chatId} />
                <StickerSetDialog />
                <ChatInfoDialog />
                {/*<Footer />*/}
            </div>
        );
    }
}

export default DialogDetails;
