/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from '../../Utils/HOC';
import { withIV } from '../InstantView/IVContext';
import { withTranslation } from 'react-i18next';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import CloseIcon from '../../Assets/Icons/Close';
import NavigateBeforeIcon from '../../Assets/Icons/Left';
import ReplyIcon from '../../Assets/Icons/Share';
import InstantViewMediaViewerContent from './InstantViewMediaViewerContent';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';
import { getBlockCaption, getBlockMedia, getBlockUrl, getValidBlocks, isValidMediaBlock } from '../../Utils/InstantView';
import { cancelPreloadIVMediaViewerContent, getViewerFile, preloadIVMediaViewerContent, saveMedia } from '../../Utils/File';
import { getInputMediaContent } from '../../Utils/Media';
import { forward, setInstantViewViewerContent } from '../../Actions/Client';
import { modalManager } from '../../Utils/Modal';
import TdLibController from '../../Controllers/TdLibController';
import './InstantViewMediaViewer.css';

class InstantViewMediaViewer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            index: -1,
            hasPreviousMedia: false,
            hasNextMedia: false,
            blocks: []
        };

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);
    }

    componentDidMount() {
        this.loadContent();

        KeyboardManager.add(this.keyboardHandler);
    }

    componentWillUnmount() {
        KeyboardManager.remove(this.keyboardHandler);
    }

    onKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        const { index, blocks } = this.state;
        if (!blocks) return null;
        if (index === -1) return null;

        const block = blocks[index];
        const media = getBlockMedia(block);
        if (!media) return;

        const { key } = event;
        switch (key) {
            case 'Escape': {
                this.handleClose();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
            case 'ArrowLeft': {
                this.handleNext();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
            case 'ArrowRight': {
                this.handlePrevious();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }

        const isVideo = media['@type'] === 'video';
        if (isVideo) {
            TdLibController.clientUpdate({ '@type': 'clientUpdateMediaShortcut', event });
        }
    };

    loadContent() {
        const { iv, media } = this.props;

        const blocks = getValidBlocks(iv, isValidMediaBlock);
        const index = blocks.findIndex(x => getBlockMedia(x) === media);

        this.setState({
            blocks,
            index,
            hasPreviousMedia: this.hasPreviousMedia(index, blocks),
            hasNextMedia: this.hasNextMedia(index, blocks)
        });

        preloadIVMediaViewerContent(index, blocks);
    }

    hasPreviousMedia(index, blocks) {
        if (index === -1) return false;

        const nextIndex = index + 1;
        return nextIndex < blocks.length;
    }

    handlePrevious = event => {
        if (event) {
            event.stopPropagation();
        }

        const { index, blocks } = this.state;
        const nextIndex = index + 1;

        if (!this.hasPreviousMedia(index, blocks)) return;

        return this.loadMedia(nextIndex);
    };

    hasNextMedia(index, blocks) {
        if (index === -1) return false;

        const nextIndex = index - 1;
        return nextIndex >= 0;
    }

    handleNext = event => {
        if (event) {
            event.stopPropagation();
        }

        const { index, blocks } = this.state;
        const nextIndex = index - 1;

        if (!this.hasNextMedia(index, blocks)) return;

        return this.loadMedia(nextIndex);
    };

    loadMedia = index => {
        const { blocks } = this.state;

        if (index < 0) return false;
        if (index >= blocks.length) return false;

        this.setState(
            {
                index,
                hasPreviousMedia: this.hasPreviousMedia(index, blocks),
                hasNextMedia: this.hasNextMedia(index, blocks)
            }
        );

        preloadIVMediaViewerContent(index, blocks);
        return true;
    };

    handleClose = () => {
        setInstantViewViewerContent(null);

        const { index, blocks } = this.state;
        if (index !== -1) {
            cancelPreloadIVMediaViewerContent(index, blocks);
        }
    };

    handleForward = () => {
        const { media } = this.props;

        const inputMessageContent = getInputMediaContent(media, null);
        if (!inputMessageContent) return;

        forward(inputMessageContent);
    };

    handleSave = () => {
        const { media } = this.props;

        saveMedia(media, null);
    };

    handleWrapperMouseDown = event => {
        this.mouseDownTarget = event.currentTarget;
    }

    handleWrapperClick = event => {
        const { mouseDownTarget } = this;
        this.mouseDownTarget = null;

        if (event.currentTarget !== mouseDownTarget) return;

        this.handleClose();
    };

    render() {
        const { size, t } = this.props;
        const { index, blocks, hasNextMedia, hasPreviousMedia } = this.state;
        if (!blocks) return null;
        if (index === -1) return null;

        const block = blocks[index];
        const media = getBlockMedia(block);
        const caption = getBlockCaption(block);
        const url = getBlockUrl(block);

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
        const maxCount = blocks.length;

        return (
            <div className={classNames('instant-view-media-viewer', 'media-viewer-default')}>
                <div className='media-viewer-footer'>
                    <MediaViewerFooterText
                        title={title}
                        subtitle={maxCount && index >= 0 ? `${index + 1} of ${maxCount}` : null}
                        style={{ marginLeft: 128 }}
                    />
                    <MediaViewerDownloadButton title={t('Save')} fileId={file.id} onClick={this.handleSave} />
                    <MediaViewerFooterButton title={t('Forward')} onClick={this.handleForward}>
                        <ReplyIcon />
                    </MediaViewerFooterButton>
                    <MediaViewerFooterButton title={t('Close')} onClick={this.handleClose}>
                        <CloseIcon />
                    </MediaViewerFooterButton>
                </div>
                <div className='media-viewer-wrapper' onMouseDown={this.handleWrapperMouseDown} onClick={this.handleWrapperClick}>
                    <div className='media-viewer-left-column'>
                        <MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>
                            <NavigateBeforeIcon />
                        </MediaViewerButton>
                    </div>
                    <div className='media-viewer-content-column'>
                        <InstantViewMediaViewerContent media={media} size={size} caption={caption} url={url} />
                    </div>
                    <div className='media-viewer-right-column'>
                        <MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>
                            <NavigateBeforeIcon style={{ transform: 'rotate(180deg)' }} />
                        </MediaViewerButton>
                    </div>
                </div>
            </div>
        );
    }
}

InstantViewMediaViewer.propTypes = {
    media: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired,
    caption: PropTypes.object.isRequired
};

const enhance = compose(
    withTranslation(),
    withIV
);

export default enhance(InstantViewMediaViewer);
