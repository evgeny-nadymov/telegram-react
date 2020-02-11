/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import EditIcon from '@material-ui/icons/Edit';
import IconButton from '@material-ui/core/IconButton';
import EditUrlDialog from './EditUrlDialog';
import { focusInput } from '../../Utils/DOM';
import { getEntities, getMedia, getNodes } from '../../Utils/Message';
import { readImageSize } from '../../Utils/Common';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './EditMediaDialog.css';

class EditMediaDialog extends React.Component {
    constructor(props) {
        super(props);

        this.captionRef = React.createRef();
        this.editMediaRef = React.createRef();

        this.state = {};
    }

    componentDidMount() {
        document.addEventListener('selectionchange', this.handleSelectionChange, true);
    }

    componentWillUnmount() {
        document.removeEventListener('selectionchange', this.handleSelectionChange, true);
    }

    handleSelectionChange = () => {
        if (document.activeElement === this.captionRef.current) {
            this.saveSelection();
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, messageId, open } = this.props;
        if (open && open !== prevProps.open) {
            this.file = null;
            this.media = null;

            const message = MessageStore.get(chatId, messageId);
            if (!message) return;

            const { content } = message;
            if (!content) return;

            const { text, caption } = content;
            if (!text && !caption) return;

            setTimeout(() => {
                const element = this.captionRef.current;
                if (!element) return;

                if (text) {
                    this.setFormattedText(text);
                } else if (caption) {
                    this.setFormattedText(caption);
                } else {
                    element.innerText = null;
                }

                focusInput(element);
            }, 0);
        }
    }

    setFormattedText(formattedText) {
        const { t } = this.props;
        const element = this.captionRef.current;

        if (!formattedText) {
            element.innerText = null;
            return;
        }

        const { text, entities } = formattedText;
        try {
            const nodes = getNodes(text, entities, t);
            element.innerHTML = null;
            nodes.forEach(x => {
                element.appendChild(x);
            });
        } catch (e) {
            element.innerText = text;
        }
    }

    handleDone = () => {
        const { chatId, onDone } = this.props;

        const element = this.captionRef.current;
        if (!element) return;

        const { innerHTML } = element;

        element.innerText = null;

        const { text, entities } = getEntities(innerHTML);

        const caption = {
            '@type': 'formattedText',
            text,
            entities
        };

        let content = null;
        if (this.file) {
            readImageSize(this.file, result => {
                content = {
                    '@type': 'inputMessagePhoto',
                    photo: { '@type': 'inputFileBlob', name: result.name, data: result },
                    width: result.photoWidth,
                    height: result.photoHeight,
                    caption
                };
                onDone(null, content);

                TdLibController.clientUpdate({
                    '@type': 'clientUpdateEditMessage',
                    chatId,
                    messageId: 0
                });
            });
            this.file = null;
        } else {
            onDone(caption, null);

            TdLibController.clientUpdate({
                '@type': 'clientUpdateEditMessage',
                chatId,
                messageId: 0
            });
        }
    };

    handleCancel = () => {
        const { chatId, onCancel } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateEditMessage',
            chatId,
            messageId: 0
        });

        onCancel();
    };

    handleKeyDown = event => {
        const { altKey, ctrlKey, keyCode, metaKey, repeat, shiftKey } = event;

        switch (keyCode) {
            // enter
            case 13: {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    if (!repeat) this.handleDone();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // cmd + b
            case 66: {
                if (!altKey && (ctrlKey || metaKey) && !shiftKey) {
                    if (!repeat) this.handleBold();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // cmd + i
            case 73: {
                if (!altKey && (ctrlKey || metaKey) && !shiftKey) {
                    if (!repeat) this.handleItalic();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            case 75: {
                // cmd + k
                if (!altKey && (ctrlKey || metaKey) && !shiftKey) {
                    if (!repeat) this.handleUrl();

                    event.preventDefault();
                    event.stopPropagation();
                }
                // alt + cmd + k
                else if (altKey && (ctrlKey || metaKey) && !shiftKey) {
                    if (!repeat) this.handleMono();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // alt + cmd + n
            case 192: {
                if (altKey && (ctrlKey || metaKey) && !shiftKey) {
                    if (!repeat) this.handleClear();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
        }
    };

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

    handleMono = () => {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);

        let text = '';
        const { selection } = this;
        if (selection && !selection.isCollapsed) {
            text = selection.toString();
        }

        if (!text) return;
        text = `<code>${text}</code>`;
        document.execCommand('removeFormat', false, null);
        document.execCommand('insertHTML', false, text);
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

    openEditUrlDialog = () => {
        let defaultText = '';
        let defaultUrl = '';

        const { selection, range } = this;
        if (range) {
            let { startContainer, endContainer } = range;
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

    saveSelection() {
        this.selection = document.getSelection();
        this.range = this.selection.getRangeAt(0);
    }

    restoreSelection() {
        const { range } = this;

        if (!range) {
            focusInput();
            return;
        }

        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        this.captionRef.current.focus();
    }

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
        }
    };

    handleInput = () => {
        this.clearInnerHtml();
    };

    clearInnerHtml() {
        const element = this.captionRef.current;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
    }

    handleCancelEditUrl = () => {
        this.closeEditUrlDialog();
    };

    handleDoneEditUrl = (text, url) => {
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
            const link = `<a href=${url} title=${url} rel='noopener noreferrer' target='_blank'>${text}</a>`;
            document.execCommand('removeFormat', false, null);
            document.execCommand('insertHTML', false, link);
        }, 0);
    };

    handleEditMedia = event => {
        const element = this.editMediaRef.current;
        if (!element) return;

        element.click();
    };

    handleEditMediaComplete = event => {
        const element = this.editMediaRef.current;
        if (!element) return;

        const { files } = element;
        if (files.length === 0) return;

        Array.from(files).forEach(file => {
            this.file = file;
            this.getMediaFromFile(file, result => {
                this.media = result;
                this.forceUpdate();
            });
        });

        element.value = '';
    };

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getMediaFromFile(file, callback) {
        if (!file) {
            callback(null);
        }

        if (file.type.startsWith('image')) {
            readImageSize(file, result => {
                const fileId = -this.getRandomInt(1, 1000000);
                FileStore.setBlob(fileId, result);

                callback({
                    '@type': 'messagePhoto',
                    photo: {
                        '@type': 'photo',
                        has_stickers: false,
                        minithumbnail: null,
                        sizes: [
                            {
                                '@type': 'photoSize',
                                photo: { '@type': 'file', id: fileId },
                                width: result.photoWidth,
                                height: result.photoHeight
                            }
                        ]
                    }
                });
            });
        } else {
            callback(null);
        }
    }

    render() {
        const { classes, chatId, messageId, open, t } = this.props;
        if (!open) return null;

        const { defaultText, defaultUrl, openEditUrl } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return;

        const media = getMedia({ content: this.media }) || getMedia(message, null);

        return (
            <Dialog
                transitionDuration={0}
                open={true}
                onClose={this.handleCancel}
                aria-labelledby='edit-media-dialog-title'>
                <div className='edit-media-dialog-content'>
                    <div style={{ margin: 24 }}>{media}</div>
                    <IconButton
                        disableRipple={true}
                        aria-label={t('Edit')}
                        className='edit-media-dialog-edit-button'
                        size='small'
                        onClick={this.handleEditMedia}>
                        <EditIcon fontSize='inherit' />
                    </IconButton>
                    <input
                        ref={this.editMediaRef}
                        className='inputbox-attach-button'
                        type='file'
                        accept='image/*'
                        onChange={this.handleEditMediaComplete}
                    />
                </div>
                <div
                    ref={this.captionRef}
                    id='edit-media-dialog-caption'
                    contentEditable
                    suppressContentEditableWarning
                    placeholder={t('Caption')}
                    onKeyDown={this.handleKeyDown}
                    onPaste={this.handlePaste}
                    onInput={this.handleInput}
                />
                <DialogActions>
                    <Button onClick={this.handleCancel} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={this.handleDone} color='primary'>
                        {t('Edit')}
                    </Button>
                </DialogActions>
                <EditUrlDialog
                    open={openEditUrl}
                    defaultText={defaultText}
                    defaultUrl={defaultUrl}
                    onDone={this.handleDoneEditUrl}
                    onCancel={this.handleCancelEditUrl}
                />
            </Dialog>
        );
    }
}

EditMediaDialog.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    open: PropTypes.bool
};

export default withTranslation()(EditMediaDialog);
