/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import CloseIcon from '@material-ui/icons/Close';
import { ANIMATION_DURATION_300MS } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './FileProgress.css';

const circleStyle = { circle: 'file-progress-circle' };

class FileProgress extends React.Component {
    constructor(props) {
        super(props);

        this.completeAnimation = false;
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
        const { download, upload, icon, thumbnailSrc } = this.props;

        if (nextProps.thumbnailSrc !== thumbnailSrc) {
            return true;
        }

        if (nextProps.icon !== icon) {
            return true;
        }

        if (this.isDownloading(nextState.file, nextState.prevFile) && !download) {
            return false;
        }

        if (this.isUploading(nextState.file, nextState.prevFile) && !upload) {
            return false;
        }

        const nextLocal = nextState.file ? nextState.file.local : null;
        const nextIdbKey = nextState.file ? nextState.file.idb_key : null;
        const prevLocal = this.state.prevFile ? this.state.prevFile.local : null;
        const prevIdbKey = this.state.prevFile ? this.state.prevFile.idb_key : null;
        const isDownloadingCompleted =
            prevLocal && nextLocal && !prevLocal.is_downloading_completed && nextLocal.is_downloading_completed;
        const receiveIdbKey = nextIdbKey && !prevIdbKey;

        if (nextState.file.id === this.state.file.id && isDownloadingCompleted && receiveIdbKey) {
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
        if (!this.props.download) return false;

        const wasActive = prevFile && prevFile.local && prevFile.local.is_downloading_active;
        const isActive = file && file.local && file.local.is_downloading_active;

        return wasActive || isActive;
    };

    isUploading = (file, prevFile) => {
        if (!this.props.upload) return false;

        const wasActive = prevFile && prevFile.remote && prevFile.remote.is_uploading_active;
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
            wasActive = prevFile && prevFile.local && prevFile.local.is_downloading_active;
            isActive = local.is_downloading_active;
            isCompleted = local.is_downloading_completed;
            progressSize = local.downloaded_size;
            size = file.size;
            // console.log(
            //     `FileProgress.getProgressParams isDownloading id=${
            //         file.id
            //     } was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`,
            //     file,
            //     prevFile
            // );
        } else if (this.isUploading(file, prevFile)) {
            wasActive = prevFile && prevFile.remote && prevFile.remote.is_uploading_active;
            isActive = remote.is_uploading_active;
            isCompleted = remote.is_uploading_completed;
            progressSize = remote.uploaded_size;
            size = file.size;
            // console.log(
            //     `FileProgress.getProgressParams isUploading id=${
            //         file.id
            //     } was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`,
            //     file,
            //     prevFile
            // );
        } else {
            // console.log(
            //     `FileProgress.getProgressParams none id=${file.id} download=${this.props.download} upload=${
            //         this.props.upload
            //     } was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} progress_size=${progressSize} size=${size}`,
            //     file,
            //     prevFile
            // );
        }

        return [wasActive, isActive, isCompleted, progressSize, size];
    };

    render() {
        let { thumbnailSrc, cancelButton, zIndex, icon, completeIcon } = this.props;
        const { file, prevFile } = this.state;
        if (!file) return null;

        const [wasActive, isActive, isCompleted, progressSize, size] = this.getProgressParams(file, prevFile);

        let inProgress = isActive;
        let progress = 0;
        if (isActive) {
            progress = progressSize && size ? 100 - ((size - progressSize) / size) * 100 : 1;
        }

        const startCompleteAnimation = wasActive && !isActive;
        if (startCompleteAnimation) {
            this.completeAnimation = true;
            // console.log('FileProgress.render animationComplete=true');
            progress = isCompleted ? 100 : 0;
            inProgress = true;
            setTimeout(() => {
                this.completeAnimation = false;
                if (!this.mount) return;
                // console.log('FileProgress.render animationComplete=false');

                this.setState({ prevFile: null });
            }, ANIMATION_DURATION_300MS);
        }

        const style = {
            zIndex: zIndex,
            background: !thumbnailSrc && typeof thumbnailSrc !== 'undefined' ? null : 'rgba(0, 0, 0, 0.25)'
        };

        const isDownloadingCompleted =
            file &&
            file.local &&
            (file.local.is_downloading_completed || file.idb_key || file.local.is_uploading_completed) &&
            !this.completeAnimation &&
            !isActive;

        // console.log(
        //     `FileProgress.render \\
        //     id=${file.id} showProgress=${inProgress} progress=${progress} \\
        //     was_active=${wasActive} is_active=${isActive} is_completed=${isCompleted} \\
        //     progress_size=${progressSize} size=${size} complete_animation=${this.completeAnimation} \\
        //     is_downloading_completed=${isDownloadingCompleted}
        //     completeIcon=${completeIcon}`,
        //     file,
        //     prevFile
        // );
        //cancelButton = true;
        //inProgress = true;

        if (isDownloadingCompleted) {
            // console.log('FileProgress.render completeIcon');
            if (completeIcon) {
                return (
                    <div className='file-progress' style={style}>
                        <div className='file-progress-icon'>{completeIcon}</div>
                    </div>
                );
            }

            return null;
        }

        if (inProgress || this.completeAnimation) {
            // console.log('FileProgress.render inProgressIcon');
            return (
                <div className='file-progress' style={style}>
                    <div className='file-progress-indicator'>
                        <CircularProgress
                            classes={circleStyle}
                            variant='static'
                            value={progress}
                            size={42}
                            thickness={2}
                        />
                    </div>
                    {cancelButton && (
                        <div className='file-progress-icon'>
                            <CloseIcon />
                        </div>
                    )}
                </div>
            );
        }

        if (icon) {
            // console.log('FileProgress.render icon');
            return (
                <div className='file-progress' style={style}>
                    <div className='file-progress-icon'>{icon}</div>
                </div>
            );
        }

        return null;
    }
}

FileProgress.propTypes = {
    file: PropTypes.object.isRequired,
    thumbnailSrc: PropTypes.object,
    cancelButton: PropTypes.bool,
    download: PropTypes.bool,
    upload: PropTypes.bool,
    zIndex: PropTypes.number,

    icon: PropTypes.node,
    completeIcon: PropTypes.node
};

FileProgress.defaultProps = {
    cancelButton: false,
    download: true,
    upload: false
};

export default FileProgress;
