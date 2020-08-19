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
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import EditUrlDialog from './EditUrlDialog';
import { focusInput } from '../../Utils/DOM';
import { editMessage as editMessageAction } from '../../Actions/Client';
import { getEntities, getNodes } from '../../Utils/Message';
import { getMedia, getMediaPhotoFromFile } from '../../Utils/Media';
import { modalManager } from '../../Utils/Modal';
import MessageStore from '../../Stores/MessageStore';
import './EditMediaDialog.css';

class EditMediaDialog extends React.Component {
    constructor(props) {
        super(props);

        this.captionRef = React.createRef();
        this.editMediaRef = React.createRef();

        this.state = {

        };
    }

    static getDerivedStateFromProps(props, state) {
        const { prevOpen } = state;
        const { open, chatId, messageId, newItem } = props;

        if (prevOpen !== open) {
            if (open) {
                const editMessage = MessageStore.get(chatId, messageId);
                let sendAsPhoto = false;
                if (editMessage && editMessage.content['@type'] === 'messagePhoto') {
                    sendAsPhoto = true;
                } else if (newItem && newItem.media && newItem.media['@type'] === 'messagePhoto'){
                    sendAsPhoto = true;
                }

                return {
                    prevOpen: true,
                    sendAsPhoto,
                    editMessage,
                    editMedia: null,
                    editFile: null
                }
            } else {
                return {
                    prevOpen: false,
                    sendAsPhoto: false,
                    editMessage: null,
                    editMedia: null,
                    editFile: null
                }
            }
        }

        return null;
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

    handleEnter = () => {
        const { chatId, messageId, open, newItem } = this.props;
        if (!open) return;

        let text = null;
        let caption = null;
        const message = MessageStore.get(chatId, messageId);
        if (message) {
            const { content } = message;
            if (content) {
                text = content.text;
                caption = content.caption;
            }
        }

        const element = this.captionRef.current;
        if (!element) return;

        if (text) {
            this.setFormattedText(text);
        } else if (caption) {
            this.setFormattedText(caption);
        } else if (newItem && newItem.caption) {
            element.innerHTML = newItem.caption;
        } else {
            element.innerText = null;
        }

        focusInput(element);
    };

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
        const { chatId, newItem, onSend, onEdit } = this.props;
        const { editMessage, editFile, editMedia, sendAsPhoto } = this.state;

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

        const isEditing = Boolean(editMessage);
        if (isEditing) {
            if (editMedia) {
                const { photo } = editMedia;
                if (!photo) return;

                const { sizes } = photo;
                if (!sizes) return;

                const size = sizes[sizes.length - 1];

                const { width, height } = size;

                const content = {
                    '@type': 'inputMessagePhoto',
                    photo: { '@type': 'inputFileBlob', name: editFile.name, data: editFile },
                    width,
                    height,
                    caption
                };

                onEdit(null, content);
            } else {
                onEdit(caption, null);
            }

            editMessageAction(chatId, 0);
        } else {
            const { media, file } = newItem;
            const { audio, photo, document } = media;

            let content = null;
            if (photo) {
                const { sizes } = photo;
                if (!sizes) return;

                const size = sizes[sizes.length - 1];

                const { width, height } = size;

                content = sendAsPhoto
                    ? {
                        '@type': 'inputMessagePhoto',
                        photo: { '@type': 'inputFileBlob', name: file.name, data: file },
                        width,
                        height,
                        caption
                    }
                    : {
                        '@type': 'inputMessageDocument',
                        document: { '@type': 'inputFileBlob', name: file.name, data: file },
                        thumbnail: null,
                        caption
                    };
            } else if (document) {
                content = {
                    '@type': 'inputMessageDocument',
                    document: { '@type': 'inputFileBlob', name: file.name, data: file },
                    thumbnail: null,
                    caption
                };
            } else if (audio) {
                const { duration, title, performer } = audio;

                content = {
                    '@type': 'inputMessageAudio',
                    audio: { '@type': 'inputFileBlob', name: file.name, data: file },
                    thumbnail: null,
                    duration,
                    title,
                    performer,
                    caption
                };
            }
            if (!content) return;

            onSend(content, file);
        }
    };

    handleCancel = () => {
        const { chatId, messageId, onCancel } = this.props;

        const message = MessageStore.get(chatId, messageId);
        const isEditing = Boolean(message);

        if (isEditing) {
            editMessageAction(chatId, 0);
        }

        onCancel();
    };

    handleKeyDown = event => {
        const { altKey, ctrlKey, key, keyCode, code, metaKey, shiftKey, repeat, nativeEvent } = event;

        // fix CJK input
        const { isComposing } = nativeEvent;
        if (isComposing) {
            event.stopPropagation();
            return;
        }

        switch (nativeEvent.code) {
            case 'Enter':
            case 'NumpadEnter': {
                // enter+cmd, enter+ctrl, enter+shift
                if (!altKey && (ctrlKey || metaKey || shiftKey) && !repeat) {
                    document.execCommand('insertLineBreak');

                    event.preventDefault();
                    event.stopPropagation();
                }
                // enter
                else if (!altKey && !ctrlKey && !metaKey && !shiftKey && !repeat) {
                    this.handleDone();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // cmd + b
            case 'KeyB': {
                if (!altKey && (ctrlKey || metaKey) && !shiftKey && !repeat) {
                    this.handleBold();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // cmd + i
            case 'KeyI': {
                if (!altKey && (ctrlKey || metaKey) && !shiftKey && !repeat) {
                    this.handleItalic();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            case 'KeyK': {
                // cmd + k
                if (!altKey && (ctrlKey || metaKey) && !shiftKey && !repeat) {
                    this.handleUrl();

                    event.preventDefault();
                    event.stopPropagation();
                }
                // alt + cmd + k
                else if (altKey && (ctrlKey || metaKey) && !shiftKey && !repeat) {
                    this.handleMono();

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            // alt + cmd + n
            case 'KeyN': {
                if (altKey && (ctrlKey || metaKey) && !shiftKey && !repeat) {
                    this.handleClear();

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
        if (!this.selection) return;
        if (!this.selection.rangeCount) return;

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

    handleEditMediaComplete = async () => {
        const element = this.editMediaRef.current;
        if (!element) return;

        const { files } = element;
        if (files.length === 0) return;

        const [file, ...rest] = Array.from(files);
        if (!file) return;

        const editMedia = await getMediaPhotoFromFile(file);

        this.setState({
            editFile: file,
            editMedia
        });

        element.value = '';
    };

    handleSendAsPhoto = () => {
        const { sendAsPhoto } = this.state;

        this.setState({
            sendAsPhoto: !sendAsPhoto
        });
    };

    render() {
        const { chatId, messageId, newItem, open, t } = this.props;
        const { defaultText, defaultUrl, openEditUrl, editMessage, editMedia, sendAsPhoto } = this.state;
        if (!open) return null;

        const message = MessageStore.get(chatId, messageId);
        const isEditing = Boolean(message);
        let isPhoto = false;
        if (newItem && newItem.media && newItem.media['@type'] === 'messagePhoto') {
            isPhoto = true;
        } else if (editMedia && editMedia['@type'] === 'messagePhoto') {
            isPhoto = true;
        } else if (editMessage && editMessage.content['@type'] === 'messagePhoto'){
            isPhoto = true;
        }

        let media = null;
        if (isEditing) {
            media =
            editMedia
                ? getMedia({ content: editMedia })
                : getMedia(message, null);
        } else if (newItem) {
            media = getMedia({ content: newItem.media });
        }
        const doneLabel = isEditing ? t('Edit') : t('Send');

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={this.handleCancel}
                aria-labelledby='edit-media-dialog-title'
                onEnter={this.handleEnter}>
                <div className='edit-media-dialog-content'>
                    <div style={{ margin: 24 }}>{media}</div>
                    { isEditing && (
                        <>
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
                        </>
                    )}
                    { !isEditing && isPhoto && (
                        <RadioGroup value={sendAsPhoto} onChange={this.handleSendAsPhoto} style={{ margin: '0 24px 24px' }}>
                            <FormControlLabel value={true} control={<Radio color='primary'/>} label={t('SendAsPhoto')} />
                            <FormControlLabel value={false} control={<Radio color='primary'/>} label={t('SendAsFile')} />
                        </RadioGroup>
                    )}
                </div>
                <div
                    ref={this.captionRef}
                    id='edit-media-dialog-caption'
                    className='scrollbars-hidden'
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
                        {doneLabel}
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
    open: PropTypes.bool,

    chatId: PropTypes.number,
    messageId: PropTypes.number,
    newItem: PropTypes.object,

    onSend: PropTypes.func,
    onEdit: PropTypes.func,
    onCancel: PropTypes.func
};

export default withTranslation()(EditMediaDialog);
