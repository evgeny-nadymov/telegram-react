/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import CloseIcon from '@material-ui/icons/Close';
import ReplyIcon from '@material-ui/icons/Reply';
import InstantViewMediaViewerContent from './InstantViewMediaViewerContent';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';
import { getViewerFile, saveMedia } from '../../Utils/File';
import { setInstantViewViewerContent } from '../../Actions/Client';
import TdLibController from '../../Controllers/TdLibController';
import './InstantViewMediaViewer.css';

const forwardIconStyle = {
    padding: 20,
    transform: 'scaleX(-1)'
};

class InstantViewMediaViewer extends React.Component {
    handleClose = () => {
        setInstantViewViewerContent(null);
    };

    handleForward = () => {
        const { media } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateForward',
            info: { media }
        });
    };

    handleSave = () => {
        const { media } = this.props;

        saveMedia(media, null);
    };

    render() {
        const { media, size, t, text } = this.props;

        const [width, height, file] = getViewerFile(media, size);

        let title = '';
        if (media['@type'] === 'photo') {
            title = t('AttachPhoto');
        }
        if (media['@type'] === 'video') {
            title = t('AttachVideo');
        } else if (media['@type'] === 'animation') {
            title = t('AttachGif');
        }

        return (
            <div className={classNames('instant-view-media-viewer', 'media-viewer-default')}>
                <div className='media-viewer-wrapper'>
                    <div className='media-viewer-left-column'>
                        {/*<div className='media-viewer-button-placeholder' />*/}
                        {/*<MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>*/}
                        {/*    <NavigateBeforeIcon fontSize='large' />*/}
                        {/*</MediaViewerButton>*/}
                    </div>
                    <div className='media-viewer-content-column'>
                        <InstantViewMediaViewerContent media={media} size={size} text={text} />
                    </div>
                    <div className='media-viewer-right-column'>
                        <MediaViewerButton onClick={this.handleClose}>
                            <CloseIcon fontSize='large' />
                        </MediaViewerButton>
                        {/*<MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>*/}
                        {/*    <NavigateNextIcon fontSize='large' />*/}
                        {/*</MediaViewerButton>*/}
                    </div>
                </div>

                <div className='media-viewer-footer'>
                    <MediaViewerFooterText title={title} subtitle={null} />
                    <MediaViewerDownloadButton title={t('Save')} fileId={file.id} onClick={this.handleSave} />
                    <MediaViewerFooterButton title={t('Forward')} onClick={this.handleForward}>
                        <ReplyIcon style={forwardIconStyle} />
                    </MediaViewerFooterButton>
                </div>
            </div>
        );
    }
}

InstantViewMediaViewer.propTypes = {
    media: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired,
    text: PropTypes.object.isRequired
};

export default withTranslation()(InstantViewMediaViewer);
