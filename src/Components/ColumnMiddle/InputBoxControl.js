/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import emojiRegex from 'emoji-regex';
import SendIcon from '@material-ui/icons/Send';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import AttachButton from './../ColumnMiddle/AttachButton';
import CreatePollDialog from '../Popup/CreatePollDialog';
import EditUrlDialog from '../Popup/EditUrlDialog';
import InputBoxHeader from './InputBoxHeader';
import PasteFilesDialog from '../Popup/PasteFilesDialog';
import UpdateDraftDialog from '../Popup/UpdateDraftDialog';
import OutputTypingManager from '../../Utils/OutputTypingManager';
import { borderStyle } from '../Theme';
import { draftEquals, getChatDraft, getChatDraftReplyToMessageId, isMeChat, isPrivateChat } from '../../Utils/Chat';
import { findLastTextNode } from '../../Utils/DOM';
import { getEntities, getNodes } from '../../Utils/Message';
import { getSize, readImageSize } from '../../Utils/Common';
import { PHOTO_SIZE } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './InputBoxControl.css';

const EmojiPickerButton = React.lazy(() => import('./../ColumnMiddle/EmojiPickerButton'));

const styles = theme => ({
    iconButton: {
        margin: '8px 0'
    },
    closeIconButton: {
        margin: 0
    },
    ...borderStyle(theme)
});

class InputBoxControl extends Component {
    constructor(props) {
        super(props);

        this.attachDocumentRef = React.createRef();
        this.attachPhotoRef = React.createRef();
        this.newMessageRef = React.createRef();

        const chatId = AppStore.getChatId();

        this.state = {
            chatId,
            replyToMessageId: getChatDraftReplyToMessageId(chatId)
        };

        document.addEventListener(
            'selectionchange',
            () => {
                // console.log('selection change: ', document.getSelection());
                if (document.activeElement === this.newMessageRef.current) {
                    this.handleSelect();
                }
            },
            true
        );
    }

    handleSelect = event => {
        this.selection = document.getSelection();
        this.range = this.selection.getRangeAt(0);
    };

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, t } = this.props;
        const { chatId, newDraft, files, replyToMessageId, openEditUrl } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.t !== t) {
            return true;
        }

        if (nextState.chatId !== chatId) {
            return true;
        }

        if (nextState.newDraft !== newDraft) {
            return true;
        }

        if (nextState.files !== files) {
            return true;
        }

        if (nextState.replyToMessageId !== replyToMessageId) {
            return true;
        }

        if (nextState.openEditUrl !== openEditUrl) {
            return true;
        }

        return false;
    }

    loadDraft() {
        this.setDraft();
        this.setInputFocus();
        this.handleInput();
    }

    saveDraft() {
        const { chatId, replyToMessageId } = this.state;

        const draftMessage = this.getDraftMessage(chatId, replyToMessageId);
        this.setChatDraftMessage(draftMessage);
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ChatStore.on('updateChatDraftMessage', this.onUpdateChatDraftMessage);
        MessageStore.on('clientUpdateReply', this.onClientUpdateReply);
        StickerStore.on('clientUpdateStickerSend', this.onClientUpdateStickerSend);

        this.loadDraft();
    }

    componentWillUnmount() {
        this.saveDraft();

        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ChatStore.off('updateChatDraftMessage', this.onUpdateChatDraftMessage);
        MessageStore.off('clientUpdateReply', this.onClientUpdateReply);
        StickerStore.off('clientUpdateStickerSend', this.onClientUpdateStickerSend);
    }

    onClientUpdateFocusWindow = update => {
        const { focused } = update;
        if (focused) return;

        this.saveDraft();
    };

    onUpdateChatDraftMessage = update => {
        const { chat_id, draft_message } = update;
        const { chatId, replyToMessageId } = this.state;

        if (chatId !== chat_id) return;

        this.loadDraft();
        // const currentDraft = this.getDraftMessage(chatId, replyToMessageId);
        // if (!currentDraft || draftEquals(draft_message, currentDraft.draftMessage)) {
        //     this.loadDraft();
        // } else {
        //     this.setState({
        //         newDraft: { chatId: chat_id, draftMessage: draft_message }
        //     });
        // }
    };

    onClientUpdateStickerSend = update => {
        const { sticker: item } = update;
        if (!item) return;

        const { sticker, thumbnail, width, height } = item;
        if (!sticker) return;

        this.newMessageRef.current.innerText = null;

        const content = {
            '@type': 'inputMessageSticker',
            sticker: {
                '@type': 'inputFileId',
                id: sticker.id
            },
            width,
            height
        };

        if (thumbnail) {
            const { width: thumbnailWidth, height: thumbnailHeight, photo } = thumbnail;

            content.thumbnail = {
                thumbnail: {
                    '@type': 'inputFileId',
                    id: photo.id
                },
                width: thumbnailWidth,
                height: thumbnailHeight
            };
        }

        this.onSendInternal(content, true, result => {});

        TdLibController.clientUpdate({
            '@type': 'clientUpdateLocalStickersHint',
            hint: null
        });
    };

    onClientUpdateReply = update => {
        const { chatId: currentChatId } = this.state;
        const { chatId, messageId } = update;

        if (currentChatId !== chatId) {
            return;
        }

        this.setState({ replyToMessageId: messageId });

        if (messageId) {
            this.setInputFocus();
        }
    };

    onClientUpdateChatId = update => {
        const { chatId } = this.state;
        if (chatId === update.nextChatId) return;

        this.saveDraft();
        this.setState(
            {
                chatId: update.nextChatId,
                replyToMessageId: getChatDraftReplyToMessageId(update.nextChatId),
                openEditUrl: false
            },
            () => {
                this.loadDraft();
            }
        );
    };

    setDraft = () => {
        const { chatId } = this.state;

        const element = this.newMessageRef.current;

        const draft = getChatDraft(chatId);
        if (draft) {
            const { text, entities } = draft;

            try {
                const nodes = getNodes(text, entities);
                element.innerHTML = null;
                nodes.forEach(x => {
                    element.appendChild(x);
                });
            } catch (e) {
                element.innerText = draft.text;
            }

            this.setState({
                replyToMessageId: getChatDraftReplyToMessageId(chatId)
            });
        } else {
            element.innerText = null;
        }
    };

    setInputFocus = () => {
        setTimeout(() => {
            const element = this.newMessageRef.current;
            if (!element) return;

            const textNode = findLastTextNode(element);
            if (textNode) {
                const range = document.createRange();
                range.setStart(textNode, textNode.length);
                range.collapse(true);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }

            element.focus();
        }, 100);
    };

    setChatDraftMessage = chatDraftMessage => {
        if (!chatDraftMessage) return;

        const { chatId, draftMessage } = chatDraftMessage;
        if (!chatId) return;

        TdLibController.send({
            '@type': 'setChatDraftMessage',
            chat_id: chatId,
            draft_message: draftMessage
        });
    };

    getDraftMessage = (chatId, replyToMessageId) => {
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { draft_message } = chat;
        const { innerHTML } = this.newMessageRef.current;
        const { text, entities } = getEntities(innerHTML);
        const draftMessage =
            text.length > 0 || entities.length > 0
                ? {
                      '@type': 'draftMessage',
                      reply_to_message_id: replyToMessageId,
                      input_message_text: {
                          '@type': 'inputMessageText',
                          text: {
                              '@type': 'formattedText',
                              text,
                              entities
                          },
                          disable_web_page_preview: false,
                          clear_draft: false
                      }
                  }
                : null;

        if (draftEquals(draft_message, draftMessage)) {
            return null;
        }

        return { chatId, draftMessage };
    };

    handleSubmit = () => {
        const element = this.newMessageRef.current;
        if (!element) return;

        const { innerHTML } = element;

        element.innerText = null;
        this.handleInput();

        if (!innerHTML) return;
        if (!innerHTML.trim()) return;

        const { text, entities } = getEntities(innerHTML);

        const content = {
            '@type': 'inputMessageText',
            text: {
                '@type': 'formattedText',
                text,
                entities
            },
            disable_web_page_preview: false,
            clear_draft: true
        };

        this.onSendInternal(content, false, result => {});
    };

    handleAttachPoll = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewPoll'
        });
    };

    handleAttachPhoto = () => {
        if (!this.attachPhotoRef) return;

        this.attachPhotoRef.current.click();
    };

    handleAttachPhotoComplete = () => {
        let files = this.attachPhotoRef.current.files;
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            readImageSize(file, result => {
                this.handleSendPhoto(result);
            });
        });

        this.attachPhotoRef.current.value = '';
    };

    handleAttachDocument = () => {
        if (!this.attachDocumentRef) return;

        this.attachDocumentRef.current.click();
    };

    handleAttachDocumentComplete = () => {
        let files = this.attachDocumentRef.current.files;
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            this.handleSendDocument(file);
        });

        this.attachDocumentRef.current.value = '';
    };

    setTyping() {
        const { chatId } = this.state;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const element = this.newMessageRef.current;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
        const { innerText } = element;

        if (!innerText) return;
        if (isMeChat(chatId)) return;

        const typingManager = chat.OutputTypingManager || (chat.OutputTypingManager = new OutputTypingManager(chat.id));
        typingManager.setTyping({ '@type': 'chatActionTyping' });
    }

    setHints() {
        const innerText = this.newMessageRef.current.innerText;
        if (!innerText || innerText.length > 11) {
            const { hint } = StickerStore;
            if (hint) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateLocalStickersHint',
                    hint: null
                });
            }

            return;
        }

        const t0 = performance.now();
        const regex = emojiRegex();
        let match = regex.exec(innerText);
        const t1 = performance.now();
        console.log('Matched ' + (t1 - t0) + 'ms', match);
        if (!match || innerText !== match[0]) {
            const { hint } = StickerStore;
            if (hint) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateLocalStickersHint',
                    hint: null
                });
            }

            return;
        }

        const timestamp = Date.now();
        TdLibController.send({
            '@type': 'getStickers',
            emoji: match[0],
            limit: 100
        }).then(stickers => {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateLocalStickersHint',
                hint: {
                    timestamp,
                    emoji: match[0],
                    stickers
                }
            });
        });

        TdLibController.send({
            '@type': 'searchStickers',
            emoji: match[0],
            limit: 100
        }).then(stickers => {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateRemoteStickersHint',
                hint: {
                    timestamp,
                    emoji: match[0],
                    stickers
                }
            });
        });
    }

    handleClear = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
    };

    handleBold = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        document.execCommand('bold', false, null);
    };

    handleItalic = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        document.execCommand('italic', false, null);
    };

    handleUnderline = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        document.execCommand('underline', false, null);
    };

    handleStrikeThrough = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
        document.execCommand('strikeThrough', false, null);
    };

    handleUrl = () => {
        this.openEditUrlDialog();
    };

    handleKeyDown = event => {
        const { altKey, ctrlKey, key, keyCode, metaKey, repeat, shiftKey } = event;

        if (key === 'Enter' && !shiftKey) {
            event.preventDefault();
            this.handleSubmit();
            return;
        }

        if ((ctrlKey || metaKey) && !shiftKey) {
            if (!altKey) {
                switch (keyCode) {
                    case 66: {
                        // cmd + b
                        if (!repeat) {
                            this.handleBold();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    case 73: {
                        // cmd + i
                        if (!repeat) {
                            this.handleItalic();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    case 75: {
                        // cmd + k
                        if (!repeat) {
                            this.handleUrl();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                }
            } else {
                switch (keyCode) {
                    case 192: {
                        // alt + cmd + n
                        if (!repeat) {
                            this.handleClear();
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                }
            }
        }
    };

    handleSendPhoto = file => {
        if (!file) return;

        const content = {
            '@type': 'inputMessagePhoto',
            photo: { '@type': 'inputFileBlob', name: file.name, data: file },
            width: file.photoWidth,
            height: file.photoHeight
        };

        this.onSendInternal(content, true, result => {
            const cachedMessage = MessageStore.get(result.chat_id, result.id);
            if (cachedMessage != null) {
                this.handleSendingMessage(cachedMessage, file);
            }

            FileStore.uploadFile(result.content.photo.sizes[0].photo.id, result);
        });
    };

    handleSendPoll = poll => {
        this.onSendInternal(poll, true, () => {});
    };

    handleSendDocument = file => {
        if (!file) return;

        const content = {
            '@type': 'inputMessageDocument',
            document: { '@type': 'inputFileBlob', name: file.name, data: file }
        };

        this.onSendInternal(content, true, result => FileStore.uploadFile(result.content.document.document.id, result));
    };

    handlePaste = event => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;

        const files = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind.indexOf('file') === 0) {
                files.push(items[i].getAsFile());
            }
        }

        if (files.length > 0) {
            event.preventDefault();

            this.setState({ files });
            return;
        }

        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
            return;
        }
    };

    handlePasteConfirm = () => {
        const { files } = this.state;
        if (!files) return;
        if (!files.length) return;

        files.forEach(file => {
            this.handleSendDocument(file);
        });

        this.handlePasteCancel();
    };

    handlePasteCancel = () => {
        this.setState({ files: null });
    };

    handleUpdateDraftConfirm = () => {
        const { newDraft } = this.state;
        if (!newDraft) return;

        this.loadDraft();
        this.handleUpdateDraftCancel();
    };

    handleUpdateDraftCancel = () => {
        this.setState({ newDraft: null });
    };

    handleSendingMessage = (message, blob) => {
        if (message && message.sending_state && message.sending_state['@type'] === 'messageSendingStatePending') {
            if (message.content && message.content['@type'] === 'messagePhoto' && message.content.photo) {
                let size = getSize(message.content.photo.sizes, PHOTO_SIZE);
                if (!size) return;

                let file = size.photo;
                if (file && file.local && file.local.is_downloading_completed && !file.blob) {
                    file.blob = blob;
                    FileStore.updatePhotoBlob(message.chat_id, message.id, file.id);
                }
            }
        }
    };

    onSendInternal = async (content, clearDraft, callback) => {
        const { chatId, replyToMessageId } = this.state;

        if (!chatId) return;
        if (!content) return;

        try {
            await AppStore.invokeScheduledAction(`clientUpdateClearHistory chatId=${chatId}`);

            const result = await TdLibController.send({
                '@type': 'sendMessage',
                chat_id: chatId,
                reply_to_message_id: replyToMessageId,
                input_message_content: content
            });

            this.setState({ replyToMessageId: 0 }, () => {
                if (clearDraft) {
                    this.saveDraft();
                }
            });
            //MessageStore.set(result);

            TdLibController.send({
                '@type': 'viewMessages',
                chat_id: chatId,
                message_ids: [result.id]
            });

            callback(result);
        } catch (error) {
            alert('sendMessage error ' + JSON.stringify(error));
        }
    };

    handleEmojiSelect = emoji => {
        if (!emoji) return;

        document.execCommand('insertText', false, emoji.native);
        this.newMessageRef.current.focus();
        this.handleInput();
    };

    handleInput = async event => {
        this.setTyping();
        this.setHints();
    };

    openEditUrlDialog = () => {
        let defaultText = '';
        let defaultUrl = '';

        const { selection, range } = this;
        if (range) {
            const { startContainer, endContainer } = range;
            if (startContainer === endContainer) {
                const { parentElement } = startContainer;
                if (parentElement && parentElement.nodeName === 'A') {
                    defaultText = parentElement.innerText;
                    defaultUrl = parentElement.href;
                }
            }
        }

        if (!defaultText && selection && !selection.isCollapsed) {
            defaultText = selection.toString();
        }

        this.setState({
            openEditUrl: true,
            defaultUrl,
            defaultText
        });
    };

    closeEditUrlDialog = () => {
        this.setState(
            {
                openEditUrl: false
            },
            () => {
                this.restoreSelection();
            }
        );
    };

    restoreSelection = () => {
        if (!this.range) {
            this.focusInput();
            return;
        }

        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(this.range);

        this.newMessageRef.current.focus();
    };

    focusInput = () => {
        const element = this.newMessageRef.current;
        if (!element) return;
        if (!element.childNodes.length) {
            element.focus();
            return;
        }

        const lastTextNode = findLastTextNode(element);
        if (!lastTextNode) {
            return;
        }

        const range = document.createRange();
        range.setStart(lastTextNode, lastTextNode.length);
        range.collapse(true);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        element.focus();
    };

    handleCancel = () => {
        this.closeEditUrlDialog();
    };

    handleDone = (text, url) => {
        this.closeEditUrlDialog();
        setTimeout(() => {
            // edit current link node
            const { range } = this;
            if (range) {
                const { startContainer, endContainer } = range;
                if (startContainer && startContainer === endContainer) {
                    const { parentNode } = startContainer;
                    if (parentNode && parentNode.nodeName === 'A') {
                        parentNode.href = url;
                        parentNode.title = url;
                        parentNode.innerText = text;

                        // move cursor to end of editing node
                        const { lastChild } = parentNode;
                        if (lastChild) {
                            const range = document.createRange();
                            range.setStart(lastChild, lastChild.textContent.length);
                            range.setEnd(lastChild, lastChild.textContent.length);

                            const selection = document.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                        return;
                    }
                }
            }

            // replace selected text with new link node
            const link = `<a href=${url} title=${url} rel='noopener norefferer' target='_blank'>${text}</a>`;
            document.execCommand('removeFormat', false, null);
            document.execCommand('insertHTML', false, link);
        }, 0);
    };

    render() {
        const { classes, t } = this.props;
        const { chatId, replyToMessageId, files, newDraft, defaultText, defaultUrl, openEditUrl } = this.state;

        return (
            <>
                <div className={classNames(classes.borderColor, 'inputbox')}>
                    <InputBoxHeader chatId={chatId} messageId={replyToMessageId} />
                    <div className='inputbox-wrapper'>
                        <div className='inputbox-left-column'>
                            <React.Suspense
                                fallback={
                                    <IconButton className={classes.iconButton} aria-label='Emoticon'>
                                        <InsertEmoticonIcon />
                                    </IconButton>
                                }>
                                <EmojiPickerButton onSelect={this.handleEmojiSelect} />
                            </React.Suspense>
                        </div>
                        <div className='inputbox-middle-column'>
                            <div
                                id='inputbox-message'
                                ref={this.newMessageRef}
                                placeholder={t('Message')}
                                contentEditable
                                suppressContentEditableWarning
                                onKeyDown={this.handleKeyDown}
                                onPaste={this.handlePaste}
                                onInput={this.handleInput}
                            />
                        </div>
                        <div className='inputbox-right-column'>
                            <input
                                ref={this.attachDocumentRef}
                                className='inputbox-attach-button'
                                type='file'
                                multiple='multiple'
                                onChange={this.handleAttachDocumentComplete}
                            />
                            <input
                                ref={this.attachPhotoRef}
                                className='inputbox-attach-button'
                                type='file'
                                multiple='multiple'
                                accept='image/*'
                                onChange={this.handleAttachPhotoComplete}
                            />
                            <AttachButton
                                chatId={chatId}
                                onAttachPhoto={this.handleAttachPhoto}
                                onAttachDocument={this.handleAttachDocument}
                                onAttachPoll={this.handleAttachPoll}
                            />

                            {/*<IconButton>*/}
                            {/*<KeyboardVoiceIcon />*/}
                            {/*</IconButton>*/}
                            <IconButton
                                color='primary'
                                className={classes.iconButton}
                                aria-label='Send'
                                onClick={this.handleSubmit}>
                                <SendIcon />
                            </IconButton>
                        </div>
                    </div>
                </div>
                {!isPrivateChat(chatId) && <CreatePollDialog onSend={this.handleSendPoll} />}
                <PasteFilesDialog files={files} onConfirm={this.handlePasteConfirm} onCancel={this.handlePasteCancel} />
                {/*<UpdateDraftDialog draft={newDraft} onConfirm={this.handleUpdateDraftConfirm} onCancel={this.handleUpdateDraftCancel}/>*/}
                <EditUrlDialog
                    open={openEditUrl}
                    defaultText={defaultText}
                    defaultUrl={defaultUrl}
                    onDone={this.handleDone}
                    onCancel={this.handleCancel}
                />
            </>
        );
    }
}

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(InputBoxControl);
