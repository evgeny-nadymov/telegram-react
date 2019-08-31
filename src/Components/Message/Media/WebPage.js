/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Animation from './Animation';
import Photo from './Photo';
import Video from './Video';
import Audio from './Audio';
import Document from './Document';
import VoiceNote from './VoiceNote';
import VideoNote from './VideoNote';
import Sticker, { StickerSourceEnum } from './Sticker';
import { getSize } from '../../../Utils/Common';
import { accentStyles } from '../../Theme';
import { getSrc } from '../../../Utils/File';
import {
    PHOTO_DISPLAY_EXTRA_SMALL_SIZE,
    PHOTO_DISPLAY_SIZE,
    PHOTO_DISPLAY_SMALL_SIZE,
    PHOTO_SIZE
} from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import './WebPage.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class WebPage extends React.Component {
    getMedia = () => {
        const { chatId, messageId, size, displaySize, displaySmallSize, displayExtraSmallSize, openMedia } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const {
            site_name,
            title,
            description,
            url,
            photo,
            animation,
            video,
            audio,
            document,
            voice_note,
            video_note,
            sticker,
            type
        } = web_page;

        if (sticker) {
            return [
                null,
                <Sticker
                    chatId={chatId}
                    messageId={messageId}
                    sticker={sticker}
                    openMedia={openMedia}
                    source={StickerSourceEnum.MESSAGE}
                />
            ];
        }

        if (voice_note) {
            return [
                null,
                <VoiceNote chatId={chatId} messageId={messageId} voiceNote={voice_note} openMedia={openMedia} />
            ];
        }

        if (video_note) {
            return [
                null,
                <VideoNote chatId={chatId} messageId={messageId} videoNote={video_note} openMedia={openMedia} />
            ];
        }

        if (audio) {
            return [null, <Audio chatId={chatId} messageId={messageId} audio={audio} openMedia={openMedia} />];
        }

        if (document) {
            return [null, <Document chatId={chatId} messageId={messageId} document={document} openMedia={openMedia} />];
        }

        if (animation) {
            const animationSrc = getSrc(animation.animation);
            if (animationSrc || animation.thumbnail) {
                return [
                    null,
                    <Animation chatId={chatId} messageId={messageId} animation={animation} openMedia={openMedia} />
                ];
            }
        }

        if (video) {
            if (video.thumbnail) {
                return [null, <Video chatId={chatId} messageId={messageId} video={video} openMedia={openMedia} />];
            }
        }

        if (photo) {
            const photoSize = getSize(photo.sizes, size);
            const smallPhoto =
                (type === 'article' || type === 'photo') &&
                (site_name || title || description) &&
                photoSize &&
                photoSize.width === photoSize.height;
            const extraSmallPhoto = smallPhoto && (!description || description.length < 50);

            const style =
                smallPhoto || extraSmallPhoto
                    ? {
                          float: 'right',
                          marginLeft: 6
                      }
                    : {};

            return [
                smallPhoto ? (
                    <Photo
                        displaySize={extraSmallPhoto ? displayExtraSmallSize : displaySmallSize}
                        style={style}
                        chatId={chatId}
                        messageId={messageId}
                        photo={photo}
                        openMedia={openMedia}
                    />
                ) : null,
                !smallPhoto ? <Photo chatId={chatId} messageId={messageId} photo={photo} openMedia={openMedia} /> : null
            ];
        }

        return [null, null];
    };

    getWebPage = () => {
        const { classes, chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const { site_name, title, description } = web_page;

        const webPageContent = (
            <>
                {site_name && (
                    <div className={classNames('web-page-site-name', classes.accentColorMain)}>{site_name}</div>
                )}
                {title && <div className='web-page-title'>{title}</div>}
                {description && <div className='web-page-description'>{description}</div>}
            </>
        );
        const [webPageMediaTop, webPageMediaBottom] = this.getMedia();

        return (
            <>
                {webPageMediaTop}
                {webPageContent}
                {webPageMediaBottom}
            </>
        );
    };

    render() {
        const { classes } = this.props;

        return (
            <div className='web-page'>
                <div className={classNames('web-page-border', classes.accentBackgroundLight)} />
                <div className='web-page-wrapper'>{this.getWebPage()}</div>
            </div>
        );
    }
}

WebPage.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    displaySmallSize: PropTypes.number,
    displayExtraSmallSize: PropTypes.number,
    openMedia: PropTypes.func
};

WebPage.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE,
    displaySmallSize: PHOTO_DISPLAY_SMALL_SIZE,
    displayExtraSmallSize: PHOTO_DISPLAY_EXTRA_SMALL_SIZE
};

export default withStyles(styles)(WebPage);
