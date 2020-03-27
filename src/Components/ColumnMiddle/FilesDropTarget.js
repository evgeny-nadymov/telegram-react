/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import FileStore from '../../Stores/FileStore';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './FilesDropTarget.css';

class FilesDropTarget extends React.Component {
    constructor(props) {
        super(props);

        const { dragParams } = AppStore;

        this.state = { dragParams };
    }

    componentDidMount() {
        AppStore.on('clientUpdateDragging', this.onClientUpdateDragging);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateDragging', this.onClientUpdateDragging);
    }

    onClientUpdateDragging = update => {
        const { dragParams } = AppStore;

        this.setState({ dragParams });
    };

    handleDragEnter = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleDrop = event => {
        event.preventDefault();
        event.stopPropagation();
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDragging',
            dragging: false
        });

        this.handleAttachDocumentComplete(event.dataTransfer.files);
    };

    handleDragLeave = event => {
        event.preventDefault();
        event.stopPropagation();
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDragging',
            dragging: false
        });
    };

    handleAttachDocumentComplete = files => {
        if (files.length === 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateSendFiles',
            files
        });
    };

    render() {
        const { dragParams } = this.state;
        if (!dragParams) return null;

        return (
            <div
                className='files-drop-target'
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onDrop={this.handleDrop}>
                <div className='files-drop-target-wrapper'>
                    <div className='files-drop-target-text'>
                        <div className='files-drop-target-title'>Drop files here</div>
                        <div className='files-drop-target-subtitle'>to send them</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default FilesDropTarget;
