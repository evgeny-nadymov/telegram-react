/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import emojiRegex from 'emoji-regex';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import SendIcon from '@material-ui/icons/Send';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import AttachButton from './../ColumnMiddle/AttachButton';
import CreatePollDialog from '../Dialog/CreatePollDialog';
import IconButton from '@material-ui/core/IconButton';
import InputBoxHeader from './InputBoxHeader';
import OutputTypingManager from '../../Utils/OutputTypingManager';
import { getSize, readImageSize } from '../../Utils/Common';
import { getChatDraft, getChatDraftReplyToMessageId, isMeChat, isPrivateChat } from '../../Utils/Chat';
import { borderStyle } from '../Theme';
import { PHOTO_SIZE } from '../../Constants';
import MessageStore from '../../Stores/MessageStore';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
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

        const chatId = ApplicationStore.getChatId();

        this.innerHTML = null;
        this.state = {
            chatId: chatId,
            replyToMessageId: getChatDraftReplyToMessageId(chatId),
            openPasteDialog: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, t } = this.props;
        const { chatId, replyToMessageId, openPasteDialog } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.t !== t) {
            return true;
        }

        if (nextState.chatId !== chatId) {
            return true;
        }

        if (nextState.replyToMessageId !== replyToMessageId) {
            return true;
        }

        if (nextState.openPasteDialog !== openPasteDialog) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        //console.log('Perf componentDidMount');

        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        MessageStore.on('clientUpdateReply', this.onClientUpdateReply);
        StickerStore.on('clientUpdateStickerSend', this.onClientUpdateStickerSend);

        this.setInputFocus();
        this.setDraft();
        this.handleInput();
    }

    componentWillUnmount() {
        const newChatDraftMessage = this.getNewChatDraftMessage(this.state.chatId, this.state.replyToMessageId);
        this.setChatDraftMessage(newChatDraftMessage);

        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
        MessageStore.removeListener('clientUpdateReply', this.onClientUpdateReply);
        StickerStore.removeListener('clientUpdateStickerSend', this.onClientUpdateStickerSend);
    }

    onClientUpdateStickerSend = update => {
        const { sticker: item } = update;
        if (!item) return;

        const { sticker, thumbnail, width, height } = item;
        if (!sticker) return;

        this.newMessageRef.current.innerText = null;
        this.newMessageRef.current.textContent = null;
        this.innerHTML = null;

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

        this.innerHTML = null;
        this.setState({
            chatId: update.nextChatId,
            replyToMessageId: getChatDraftReplyToMessageId(update.nextChatId),
            openPasteDialog: false
        });
    };

    setDraft = () => {
        const { chatId } = this.state;

        const element = this.newMessageRef.current;

        const draft = getChatDraft(chatId);
        if (draft) {
            element.innerText = draft.text;
            this.innerHTML = draft.text;
        } else {
            element.innerText = null;
            this.innerHTML = null;
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        //console.log('Perf componentDidUpdate');
        this.setChatDraftMessage(snapshot);

        if (prevState.chatId !== this.state.chatId) {
            this.setInputFocus();
            this.setDraft();
            this.handleInput();
        }
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        if (prevState.chatId === this.state.chatId) return null;

        return this.getNewChatDraftMessage(prevState.chatId, prevState.replyToMessageId);
    }

    setInputFocus = () => {
        setTimeout(() => {
            if (this.newMessageRef.current) {
                const element = this.newMessageRef.current;

                if (element.childNodes.length > 0) {
                    const range = document.createRange();
                    range.setStart(element.childNodes[0], element.childNodes[0].length);
                    range.collapse(true);

                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                element.focus();
            }
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

    getNewChatDraftMessage = (chatId, replyToMessageId) => {
        let chat = ChatStore.get(chatId);
        if (!chat) return;
        const newDraft = this.getInputText();

        let previousDraft = '';
        let previousReplyToMessageId = 0;
        const { draft_message } = chat;
        if (draft_message && draft_message.input_message_text && draft_message.input_message_text.text) {
            const { reply_to_message_id, input_message_text } = draft_message;

            previousReplyToMessageId = reply_to_message_id;
            if (input_message_text && input_message_text.text) {
                previousDraft = input_message_text.text.text;
            }
        }

        if (newDraft !== previousDraft || replyToMessageId !== previousReplyToMessageId) {
            const draftMessage = {
                '@type': 'draftMessage',
                reply_to_message_id: replyToMessageId,
                input_message_text: {
                    '@type': 'inputMessageText',
                    text: {
                        '@type': 'formattedText',
                        text: newDraft,
                        entities: null
                    },
                    disable_web_page_preview: true,
                    clear_draft: false
                }
            };

            return { chatId: chatId, draftMessage: draftMessage };
        }

        return null;
    };

    handleSubmit = () => {
        let text = this.getInputText();

        this.newMessageRef.current.innerText = null;
        this.newMessageRef.current.textContent = null;
        this.innerHTML = null;

        if (!text) return;

        const content = {
            '@type': 'inputMessageText',
            text: {
                '@type': 'formattedText',
                text: text,
                entities: null
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

    getInputText() {
        let innerText = this.newMessageRef.current.innerText;
        let innerHTML = this.newMessageRef.current.innerHTML;

        if (innerText && innerText === '\n' && innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            this.newMessageRef.current.innerHTML = '';
        }

        return innerText;
    }

    handleKeyUp = () => {
        const { chatId } = this.state;

        if (isMeChat(chatId)) return;

        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const innerText = this.newMessageRef.current.innerText;
        const innerHTML = this.newMessageRef.current.innerHTML;

        if (innerText && innerText === '\n' && innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            this.newMessageRef.current.innerHTML = '';
        }

        if (!innerText) return;

        const typingManager = chat.OutputTypingManager || (chat.OutputTypingManager = new OutputTypingManager(chat.id));

        typingManager.setTyping({ '@type': 'chatActionTyping' });
    };

    handleKeyDown = e => {
        const innerText = this.newMessageRef.current.innerText;
        const innerHTML = this.newMessageRef.current.innerHTML;
        this.innerHTML = innerHTML;

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit();
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

            this.files = files;
            this.setState({ openPasteDialog: true });
            return;
        }

        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertHTML', false, plainText);
            this.innerHTML = plainText;
            return;
        }
    };

    handlePasteContinue = () => {
        this.handleClosePaste();

        const files = this.files;
        if (!files) return;
        if (!files.length) return;

        files.forEach(file => {
            this.handleSendDocument(file);
        });

        this.files = null;
    };

    handleClosePaste = () => {
        this.setState({ openPasteDialog: false });
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
            await ApplicationStore.invokeScheduledAction(`clientUpdateClearHistory chatId=${chatId}`);

            let result = await TdLibController.send({
                '@type': 'sendMessage',
                chat_id: chatId,
                reply_to_message_id: replyToMessageId,
                input_message_content: content
            });

            this.setState({ replyToMessageId: 0 }, () => {
                if (clearDraft) {
                    const newChatDraftMessage = this.getNewChatDraftMessage(
                        this.state.chatId,
                        this.state.replyToMessageId
                    );
                    this.setChatDraftMessage(newChatDraftMessage);
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

        this.newMessageRef.current.innerText += emoji.native;
        this.handleInput();
    };

    handleInput = async event => {
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
    };

    render() {
        const { classes, t } = this.props;
        const { chatId, replyToMessageId, openPasteDialog } = this.state;

        const content = this.innerHTML !== null ? this.innerHTML : null;

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
                                key={new Date()}
                                placeholder={t('Message')}
                                contentEditable
                                suppressContentEditableWarning
                                onKeyDown={this.handleKeyDown}
                                onKeyUp={this.handleKeyUp}
                                onPaste={this.handlePaste}
                                onInput={this.handleInput}>
                                {content}
                            </div>
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
                            <IconButton className={classes.iconButton} aria-label='Send' onClick={this.handleSubmit}>
                                <SendIcon />
                            </IconButton>
                        </div>
                    </div>
                </div>
                {!isPrivateChat(chatId) && <CreatePollDialog onSend={this.handleSendPoll} />}
                <Dialog
                    transitionDuration={0}
                    open={openPasteDialog}
                    onClose={this.handleClosePaste}
                    aria-labelledby='delete-dialog-title'>
                    <DialogTitle id='delete-dialog-title'>{t('AppName')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.files && this.files.length > 1
                                ? 'Are you sure you want to send files?'
                                : 'Are you sure you want to send file?'}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClosePaste} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handlePasteContinue} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(InputBoxControl);
