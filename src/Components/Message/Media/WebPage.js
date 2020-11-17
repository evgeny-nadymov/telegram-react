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
import SvgIcon from '@material-ui/core/SvgIcon';
import Animation from './Animation';
import Audio from './Audio';
import Document from './Document';
import Photo from './Photo';
import Sticker, { StickerSourceEnum } from './Sticker';
import Video from './Video';
import VideoNote from './VideoNote';
import VoiceNote from './VoiceNote';
import { getSize } from '../../../Utils/Common';
import { getSrc } from '../../../Utils/File';
import { openInstantView } from '../../../Actions/InstantView';
import { getFormattedText, getTwitterInstagramEntities } from '../../../Utils/Message';
import {
    PHOTO_DISPLAY_EXTRA_SMALL_SIZE,
    PHOTO_DISPLAY_SIZE,
    PHOTO_DISPLAY_SMALL_SIZE,
    PHOTO_SIZE
} from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import './WebPage.css';

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
                    <Animation stretch={true} chatId={chatId} messageId={messageId} animation={animation} openMedia={openMedia} />
                ];
            }
        }

        if (video) {
            if (video.thumbnail) {
                return [null, <Video stretch={true} chatId={chatId} messageId={messageId} video={video} openMedia={openMedia} />];
            }
        }

        if (photo) {
            const photoSize = getSize(photo.sizes, size);
            const smallPhoto =
                (type === 'article' || type === 'photo' || type === 'telegram_megagroup' || type === 'telegram_channel') &&
                (site_name || title || description && description.text.length > 0) &&
                photoSize &&
                (photoSize.width === photoSize.height || Math.max(photoSize.width, photoSize.height) < PHOTO_DISPLAY_SIZE );
            const extraSmallPhoto = smallPhoto && (!description || description.text.length < 50);

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
                !smallPhoto ? <Photo stretch={true} chatId={chatId} messageId={messageId} photo={photo} openMedia={openMedia} /> : null
            ];
        }

        return [null, null];
    };

    handleInstantViewClick = async event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const { url } = web_page;

        openInstantView(url);
    };

    getWebPage() {
        const { chatId, messageId, t } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        const { web_page } = content;
        if (!web_page) return null;

        const { instant_view_version, site_name } = web_page;
        let { description, title } = web_page;

        if (description['@type'] === 'formattedText') {
            description = getFormattedText(description);
        } else if (typeof description === 'string' && site_name && (site_name.toLowerCase() === 'twitter' || site_name.toLowerCase() === 'instagram')) {
            // const { text: t2, entities: e2 } = getTwitterInstagramEntities(site_name.toLowerCase() === 'twitter' ? 1 : 2, title, []);
            // title = getFormattedText({ '@type': 'formattedText', text: title, entities: e2 });

            const { text: t1, entities: e1 } = getTwitterInstagramEntities(site_name.toLowerCase() === 'instagram' ? 1 : 2, description, []);
            description = getFormattedText({ '@type': 'formattedText', text: description, entities: e1 });
        }

        const webPageContent = (
            <>
                {site_name && <div className='web-page-site-name'>{site_name}</div>}
                {title && <div className='web-page-title'>{title}</div>}
                {description && <div className='web-page-description'>{description}</div>}
            </>
        );
        const [webPageMediaTop, webPageMediaBottom] = this.getMedia();
        const webPageInstantView = instant_view_version > 0 && (
            <Button
                variant='outlined'
                color='primary'
                classes={{
                    outlinedPrimary: 'message-control',
                    disabled: 'message-control-disabled'
                }}
                fullWidth
                onClick={this.handleInstantViewClick}
                className='web-page-button'>
                <SvgIcon>
                    <path d='M10.5159727,16.7438514 C10.1741929,18.1203636 10.687342,18.4055299 11.6053255,17.4005852 L15.4613785,12.9698209 C16.3535455,11.8808642 16.1300862,11.0059438 14.8452805,10.7872179 L12.9861121,10.4429102 L12.9861121,10.4429102 C12.8775019,10.4227962 12.8057616,10.3184447 12.8258756,10.2098345 C12.8265392,10.2062511 12.8273007,10.2026864 12.8281591,10.1991446 L13.5436135,7.24719783 C13.8863521,5.8619451 13.3150978,5.61107807 12.4582164,6.59275159 C11.2270125,7.98097123 10.2913754,9.02966176 9.65130514,9.73882318 C9.42814828,9.98606827 9.06894462,10.3719875 8.57369417,10.8965808 C7.48829706,12.1010165 8.05955136,12.9745105 9.31498713,13.1932365 L11.0917769,13.5117472 L11.0917769,13.5117472 C11.2005008,13.5312372 11.2728391,13.6351751 11.253349,13.743899 C11.2525988,13.7480841 11.2517153,13.7522442 11.2506999,13.756373 L10.5159727,16.7438514 Z' />
                </SvgIcon>
                {t('InstantView')}
            </Button>
        );

        return (
            <>
                {webPageMediaTop}
                {webPageContent}
                {webPageMediaBottom}
                {webPageInstantView}
            </>
        );
    }

    render() {
        const { meta } = this.props;

        return (
            <>
                <div className='web-page'>
                    <div className='border' />
                    <div className='web-page-wrapper'>{this.getWebPage()}</div>
                </div>
                {meta}
            </>
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

export default withTranslation()(WebPage);
