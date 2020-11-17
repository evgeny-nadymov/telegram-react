/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getDownloadedSize, getUploadedSize, getFileSize } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';
import './DocumentAction.css';

class DocumentAction extends React.Component {
    constructor(props) {
        super(props);

        const { file } = this.props;
        this.state = {
            prevPropsFile: file,
            prevFile: null,
            file: FileStore.get(file.id) || file
        };
    }

    componentDidMount() {
        FileStore.on('updateFile', this.onUpdateFile);
    }

    componentWillUnmount() {
        FileStore.off('updateFile', this.onUpdateFile);
    }

    onUpdateFile = update => {
        const currentFile = this.state.file;
        const nextFile = update.file;

        if (currentFile && currentFile.id === nextFile.id) {
            this.setState({ file: nextFile, prevFile: currentFile });
        }
    };

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
        const { theme } = this.props;
        const { file, prevFile } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextState.file !== file) {
            return true;
        }

        if (nextState.prevFile !== prevFile) {
            return true;
        }

        return false;
    }

    render() {
        const { date, meta } = this.props;
        const { file } = this.state;
        if (!file) return null;

        const isDownloadingActive = file.local && file.local.is_downloading_active;
        const isUploadingActive = file.remote && file.remote.is_uploading_active;

        const size = getFileSize(file);
        let progressSize = null;
        if (isDownloadingActive) {
            progressSize = getDownloadedSize(file);
        } else if (isUploadingActive) {
            progressSize = getUploadedSize(file);
        }

        const sizeString = progressSize ? `${progressSize}/${size}` : `${size}`;

        return (
            <div className='document-action'>
                <span>
                    {sizeString}
                    {date && ` · ${date}`}
                </span>
                {meta}
            </div>
        );
    }
}

DocumentAction.propTypes = {
    file: PropTypes.object.isRequired,
    date: PropTypes.string
};

export default DocumentAction;
