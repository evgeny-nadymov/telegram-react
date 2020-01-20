/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';

import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import { withStyles } from '@material-ui/core/styles';

import './FilesDropTarget.css';

const styles = theme => ({
    filesDropTargetHover: {
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: theme.palette.primary.main,
        boxSizing: 'border-box'
    }
});

class FilesDropTarget extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            dragging: ApplicationStore.getDragging(),
            hoverIndex: 0
        };
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateDragging', this.onClientUpdateDragging);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDragging', this.onClientUpdateDragging);
    }

    onClientUpdateDragging = update => {
        this.setState({ dragging: ApplicationStore.getDragging() });
    };

    handleDragEnter = (event, index) => {
        event.preventDefault();
        event.stopPropagation();

        this.setState({
            hoverIndex: index
        });
    };

    handleDrop = event => {
        event.preventDefault();
        event.stopPropagation();
        ApplicationStore.setDragging(false);

        this.handleDropComplete(event.dataTransfer.files);
    };

    handleQuickDrop = event => {
        event.preventDefault();
        event.stopPropagation();
        ApplicationStore.setDragging(false);

        this.handleQuickDropComplete(event.dataTransfer.files);
    };

    handleDragLeave = event => {
        event.preventDefault();
        event.stopPropagation();
        ApplicationStore.setDragging(false);

        this.setState({
            hoverIndex: 0
        });
    };

    handleAttachDocumentComplete = files => {
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            this.handleDocument(files[i]);
        }
    };

    handleQuickDropComplete = files => {
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const { type } = file;

            if (type.indexOf('image/') !== -1) {
                this.handlePhoto(file);
            } else {
                this.handleDocument(file);
            }
        }
    };

    handleDocument = document => {
        const content = {
            '@type': 'inputMessageDocument',
            document: { '@type': 'inputFileBlob', name: document.name, data: document }
        };

        this.onSendInternal(content, result => FileStore.uploadFile(result.content.document.document.id, result));
    };

    handlePhoto = async photo => {
        const { height, width } = await this.getHeightAndWidth(photo);

        const content = {
            '@type': 'inputMessagePhoto',
            photo: { '@type': 'inputFileBlob', name: photo.name, data: photo },
            width: width,
            height: height
        };

        this.onSendInternal(content, result => FileStore.uploadFile(result.content.photo.sizes[0].photo.id, result));
    };

    getHeightAndWidth = file =>
        new Promise(resolve => {
            let fr = new FileReader();
            fr.onload = function() {
                // file is loaded
                let img = new Image();

                img.onload = function() {
                    resolve({
                        height: img.height,
                        width: img.width
                    });
                };

                img.src = fr.result;
            };
            fr.readAsDataURL(file);
        });

    onSendInternal = async (content, callback) => {
        const currentChatId = ApplicationStore.getChatId();

        if (!currentChatId) return;
        if (!content) return;

        try {
            ApplicationStore.invokeScheduledAction(`clientUpdateClearHistory chatId=${currentChatId}`);

            let result = await TdLibController.send({
                '@type': 'sendMessage',
                chat_id: currentChatId,
                reply_to_message_id: 0,
                input_message_content: content
            });

            //MessageStore.set(result);

            TdLibController.send({
                '@type': 'viewMessages',
                chat_id: currentChatId,
                message_ids: [result.id]
            });

            callback(result);
        } catch (error) {
            console.log('[Error]', error);
            alert('sendMessage error ' + JSON.stringify(error));
        }
    };

    render() {
        const { dragging, hoverIndex } = this.state;
        const { classes } = this.props;

        return (
            <>
                {dragging && (
                    <div className='files-drop-container'>
                        <div
                            className={classNames('files-drop-target', {
                                [classes.filesDropTargetHover]: hoverIndex === 1
                            })}
                            onDrop={this.handleDrop}
                            onDragEnter={e => this.handleDragEnter(e, 1)}
                            onDragLeave={e => this.handleDragLeave(e, 1)}>
                            <div className='files-drop-target-wrapper'>
                                <div className='files-drop-target-text'>
                                    <div className='files-drop-target-title'>Send as attachment</div>
                                </div>
                            </div>
                        </div>
                        <div
                            className={classNames('files-drop-target', {
                                [classes.filesDropTargetHover]: hoverIndex === 2
                            })}
                            onDrop={this.handleQuickDrop}
                            onDragEnter={e => this.handleDragEnter(e, 2)}
                            onDragLeave={e => this.handleDragLeave(e, 2)}>
                            <div className='files-drop-target-wrapper'>
                                <div className='files-drop-target-text'>
                                    <div className='files-drop-target-title'>Send as photo</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }
}

FilesDropTarget.propTypes = {};

export default withStyles(styles, { withTheme: true })(FilesDropTarget);
