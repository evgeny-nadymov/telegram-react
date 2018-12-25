/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ANIMATION_COMPLETE_PROGRESS_MS } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './FileProgress.css';

const circleStyle = { circle: 'file-progress-circle' };

class FileProgress extends React.Component {
    constructor(props) {
        super(props);

        const { file } = this.props;
        this.state = {
            prevPropsFile: file,
            prevFile: null,
            file: FileStore.get(file.id) || file
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { file } = props;
        const { prevPropsFile } = state;

        if (file && prevPropsFile && file.id !== prevPropsFile.id) {
            return {
                prevPropsFile: file,
                prevFile: null,
                file: FileStore.get(file.id) || file
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { showDownload, showUpload } = this.props;

        if (
            this.isDownloading(nextState.file, nextState.prevFile) &&
            showDownload
        ) {
            return false;
        }

        if (this.isUploading(nextState.file, nextState.prevFile) && showUpload) {
            return false;
        }

        const nextLocal = nextState.file ? nextState.file.local : null;
        const nextIdbKey = nextState.file ? nextState.file.idb_key : null;
        const prevLocal = this.state.prevFile ? this.state.prevFile.local : null;
        const prevIdbKey = this.state.prevFile ? this.state.prevFile.idb_key : null;
        const isDownloadingCompleted =
            prevLocal &&
            nextLocal &&
            !prevLocal.is_downloading_completed &&
            nextLocal.is_downloading_completed;
        const receiveIdbKey = nextIdbKey && !prevIdbKey;

        if (
            nextState.file.id === this.state.file.id &&
            isDownloadingCompleted &&
            receiveIdbKey
        ) {
            return false;
        }

        if (nextState.file !== this.state.file) {
            return true;
        }

        if (nextState.prevFile !== this.state.prevFile) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.mount = true;
        FileStore.on('updateFile', this.onUpdateFile);
    }

    componentWillUnmount() {
        this.mount = false;
        FileStore.removeListener('updateFile', this.onUpdateFile);
    }

    onUpdateFile = update => {
        const currentFile = this.state.file;
        const nextFile = update.file;

        if (currentFile && currentFile.id === nextFile.id) {
            this.setState({ file: nextFile, prevFile: currentFile });
        }
    };

    isDownloading = (file, prevFile) => {
        if (this.props.showDownload) return;

        const wasActive =
            prevFile && prevFile.local && prevFile.local.is_downloading_active;
        const isActive = file && file.local && file.local.is_downloading_active;

        return wasActive || isActive;
    };

    isUploading = (file, prevFile) => {
        if (this.props.showUpload) return;

        const wasActive =
            prevFile && prevFile.remote && prevFile.remote.is_uploading_active;
        const isActive = file && file.remote && file.remote.is_uploading_active;

        return wasActive || isActive;
    };

    getProgressParams = (file, prevFile) => {
        const { local, remote } = file;

        let wasActive = false;
        let isActive = false;
        let isCompleted = false;
        let progressSize = 0;
        let size = 0;
        if (this.isDownloading(file, prevFile)) {
            wasActive =
                prevFile && prevFile.local && prevFile.local.is_downloading_active;
            isActive = local.is_downloading_active;
            isCompleted = local.is_downloading_completed;
            progressSize = local.downloaded_size;
            size = file.size;
            // console.log(`FileProgress.getProgressParams isDownloading id=${file.id} was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`);
        } else if (this.isUploading(file, prevFile)) {
            wasActive =
                prevFile && prevFile.remote && prevFile.remote.is_uploading_active;
            isActive = remote.is_uploading_active;
            isCompleted = remote.is_uploading_completed;
            progressSize = remote.uploaded_size;
            size = file.size;
            // console.log(`FileProgress.getProgressParams isUploading id=${file.id} was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`);
        } else {
            // console.log(`FileProgress.getProgressParams none id=${file.id} was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`);
        }

        return [wasActive, isActive, isCompleted, progressSize, size];
    };

    render() {
        let { showCancel } = this.props;
        const { file, prevFile } = this.state;
        if (!file) return null;

        const [
            wasActive,
            isActive,
            isCompleted,
            progressSize,
            size
        ] = this.getProgressParams(file, prevFile);

        let showProgress = isActive;
        let progress = 0;
        if (isActive) {
            progress =
                progressSize && size ? 100 - ((size - progressSize) / size) * 100 : 1;
        }

        const startCompleteAnimation = wasActive && !isActive;
        if (startCompleteAnimation) {
            progress = isCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() => {
                if (!this.mount) return;

                this.setState({ prevFile: null });
            }, ANIMATION_COMPLETE_PROGRESS_MS);
        }

        // console.log(`FileProgress.render id=${file.id} showProgress=${showProgress} progress=${progress} was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`, file, prevFile);
        // showCancel = true;
        // showProgress = true;
        return (
            showProgress && (
                <div className='file-progress'>
                    <div className='file-progress-background' />
                    <div className='file-progress-indicator'>
                        <CircularProgress
                            classes={circleStyle}
                            variant='static'
                            value={progress}
                            size={42}
                            thickness={3}
                        />
                    </div>
                    {showCancel && (
                        <>
                            <svg className='file-progress-cancel-button'>
                                <line x1='2' y1='2' x2='16' y2='16' />
                                <line x1='2' y1='16' x2='16' y2='2' />
                            </svg>
                        </>
                    )}
                </div>
            )
        );
    }
}

FileProgress.propTypes = {
    file: PropTypes.object.isRequired,
    showCancel: PropTypes.bool,
    showDownload: PropTypes.bool,
    showUpload: PropTypes.bool
};

FileProgress.defaultProps = {
    showCancel: false,
    showDownload: true,
    showUpload: false
};

export default FileProgress;
