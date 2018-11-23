/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import { COMPLETE_PROGRESS_ANIMATION_MS } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './FileDownloadProgress.css';

const circleStyle = { circle: 'file-download-progress-circle' };

class FileDownloadProgress extends React.Component {
    constructor(props){
        super(props);

        const { file } = this.props;
        this.state = {
            prevPropsFile: file,
            prevFile: null,
            file: file
        }
    }

    static getDerivedStateFromProps(props, state){
        if (props.file
            && state.prevPropsFile
            && props.file.id !== state.prevPropsFile.id){
            return {
                prevPropsFile: props.file,
                prevFile: null,
                file: props.file
            }
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.file.id === this.state.file.id
            && nextState.file.idb_key && !this.state.file.idb_key){
            return false;
        }

        if (nextState.file !== this.state.file){
            return true;
        }

        return false;
    }

    componentDidMount(){
        this.mount = true;
        FileStore.on('updateFile', this.onUpdateFile);
    }

    componentWillUnmount(){
        this.mount = false;
        FileStore.removeListener('updateFile', this.onUpdateFile);
    }

    onUpdateFile = update => {
        const currentFile = this.state.file;
        const nextFile = update.file;

        if (currentFile && currentFile.id === nextFile.id){
            this.setState({ file: nextFile, prevFile: currentFile });
        }
    };

    render() {
        const { file, prevFile } = this.state;
        if (!file) return null;

        const { local } = file;
        if (!local) return null;

        const wasActive = prevFile && prevFile.local && prevFile.local.is_downloading_active;
        const isActive = local.is_downloading_active;
        const isCompleted = local.is_downloading_completed;
        const downloadedSize = local.downloaded_size;
        const size = file.size;

        let showProgress = isActive;
        let progress = 0;
        if (isActive){
            progress = downloadedSize && size
                ? 100 - (size - downloadedSize) / size * 100
                : 1;
        }

        const startCompleteAnimation = wasActive && !isActive;
        if (startCompleteAnimation){
            progress = isCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() => {
                if (!this.mount) return;

                this.forceUpdate();
            }, COMPLETE_PROGRESS_ANIMATION_MS);
        }

        //console.log('updateFile progress=' + progress + ' show_progress=' + showProgress + ' file=' + file);

        return (
            showProgress &&
            <div className='file-download-progress'>
                <div className='file-download-progress-background'/>
                <div className='file-download-progress-indicator'>
                    <CircularProgress classes={circleStyle} variant='static' value={progress} size={42} thickness={3} />
                </div>
            </div>
        );
    }
}

FileDownloadProgress.propTypes = {
    file: PropTypes.object
};

export default FileDownloadProgress;