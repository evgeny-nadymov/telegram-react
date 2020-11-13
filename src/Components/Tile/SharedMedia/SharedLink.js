/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';
import SafeLink from '../../Additional/SafeLink';
import SharedLinkTile from './SharedLinkTile';
import { getFirstLetter, getPhotoSize } from '../../../Utils/Common';
import { getFormattedText, substring } from '../../../Utils/Message';
import punycode from '../../../Utils/Punycode';
import { PHOTO_SIZE } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import './SharedLink.css';

class SharedLink extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, webPage, caption, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (webPage !== nextProps.webPage) {
            return true;
        }

        if (caption !== nextProps.caption) {
            return true;
        }

        if (showOpenMessage !== nextProps.showOpenMessage) {
            return true;
        }

        if (contextMenu !== nextState.contextMenu) {
            return true;
        }

        if (left !== nextState.left) {
            return true;
        }

        if (top !== nextState.top) {
            return true;
        }

        return false;
    }

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    static isValidEntity(entity) {
        if (!entity) return false;

        const { type } = entity;
        if (!type) return false;

        return (
            type['@type'] === 'textEntityTypeUrl' ||
            type['@type'] === 'textEntityTypeTextUrl' ||
            type['@type'] === 'textEntityTypeEmailAddress'
        );
    }

    getTitleFromUrl(url) {
        try {
            url = url.startsWith('http') ? url : 'http://' + url;
            const decodedUrl = decodeURI(url);

            const hostname = new URL(decodedUrl).hostname.split('.');
            const domain = hostname.length >= 2 ? hostname[hostname.length - 2] : new URL(decodedUrl).hostname;

            return punycode.ToUnicode(domain);
        } catch (error) {
            console.error('url: ' + url + '\n' + error);
        }

        return null;
    }

    render() {
        const { chatId, messageId, webPage, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        let thumbnail = null;
        let minithumbnail = null;
        let content = null;
        let { display_url, description, photo, title, url, animation, audio, document, sticker, video, video_note: videoNote } = webPage || {
            title: '',
            description: {
                '@type': 'formattedText',
                text: '',
                entities: []
            },
            photo: null,
            animation: null,
            audio: null,
            document: null,
            sticker: null,
            video: null,
            video_note: null,
            url: ''
        };

        if (animation) {
            minithumbnail = animation.minithumbnail;
            thumbnail = animation.thumbnail;
        } else if (audio) {
            minithumbnail = audio.album_cover_minithumbnail;
            thumbnail = audio.album_cover_thumbnail;
        } else if (document) {
            minithumbnail = document.minithumbnail;
            thumbnail = document.thumbnail;
        } else if (sticker) {
            minithumbnail = sticker.minithumbnail;
            thumbnail = sticker.thumbnail;
        } else if (video) {
            minithumbnail = video.minithumbnail;
            thumbnail = video.thumbnail;
        } else if (videoNote) {
            minithumbnail = videoNote.minithumbnail;
            thumbnail = videoNote.thumbnail;
        }

        if (!thumbnail && !minithumbnail && photo) {
            minithumbnail = photo.minithumbnail;
            thumbnail = getPhotoSize(photo.sizes, PHOTO_SIZE);
        }

        let { text, caption } = message.content;
        text = text || caption;
        if (text) {
            const { entities } = text;
            if (entities && entities.length > 0) {
                const longTextMaxLength = 40;
                const urlEntities = entities.filter(SharedLink.isValidEntity);
                const showLinks = urlEntities.length > 1 || text.text.length > longTextMaxLength;
                const oneLinkText = entities.length === 1 && entities[0].offset === 0 && entities[0].length === text.text.length;

                const nonEmptyUrlEntities = urlEntities
                    .filter(x => {
                        let entityText = substring(text.text, x.offset, x.offset + x.length).trim();
                        entityText = entityText.replace(/\u200B/g,'');

                        return entityText.length > 0;
                    });

                const links = nonEmptyUrlEntities.map((x, i) => {
                        const entityText = substring(text.text, x.offset, x.offset + x.length);
                        url = entityText;
                        let mail = false;

                        switch (x.type['@type']) {
                            case 'textEntityTypeTextUrl': {
                                const { url: typeUrl } = x.type;
                                if (typeUrl) {
                                    url = typeUrl;
                                }
                                break;
                            }
                            case 'textEntityTypeUrl': {
                                break;
                            }
                            case 'textEntityTypeEmailAddress':
                                mail = true;
                                break;
                        }

                        title = title || this.getTitleFromUrl(url) || ' ';

                        return (
                            <SafeLink key={i} className='shared-link-url' url={url} mail={mail}>
                                {entityText}
                            </SafeLink>
                        );
                    });

                if (showLinks) {
                    let d = (nonEmptyUrlEntities.length > 0 && nonEmptyUrlEntities[0].offset > 0 ? text.text.substring(0, nonEmptyUrlEntities[0].offset) : text.text) || description.text || '';
                    d = d.trim();
                    content = (
                        <>
                            {d && !oneLinkText && <div className='web-page-description'>{d}</div>}
                            <div>{links}</div>
                        </>);
                } else {
                    let d = description.text || '';
                    d = d.trim();
                    content = (
                        <>
                            {d && <div className='web-page-description'>{d}</div>}
                            <div className='shared-link-text'>{getFormattedText(text, x => x, { isValidEntity: SharedLink.isValidEntity })}</div>
                        </>);
                }

                if (webPage) {
                    title = title || this.getTitleFromUrl(url);
                }
            }
        }

        return (
            <>
                <div className='shared-link' onContextMenu={this.handleOpenContextMenu}>
                    <SharedLinkTile
                        chatId={chatId}
                        messageId={messageId}
                        minithumbnail={minithumbnail}
                        thumbnail={thumbnail}
                        title={getFirstLetter(this.getTitleFromUrl(url))}
                    />
                    <div className='shared-link-content'>
                        {title && <div className='web-page-title'>{title}</div>}
                        {content}
                    </div>
                </div>
                <ContextMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    showOpenMessage={showOpenMessage}
                    onClose={this.handleCloseContextMenu}
                />
            </>
        );
    }
}

SharedLink.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    webPage: PropTypes.object,
    caption: PropTypes.object,
    showOpenMessage: PropTypes.bool,
    openMedia: PropTypes.func,
};

export default SharedLink;
