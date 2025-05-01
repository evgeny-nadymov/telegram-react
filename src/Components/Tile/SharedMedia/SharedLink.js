/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ContextMenu from './ContextMenu';
import Photo from '../../Message/Media/Photo';
import SafeLink from '../../Additional/SafeLink';
import { getFirstLetter } from '../../../Utils/Common';
import { openMedia, substring } from '../../../Utils/Message';
import punycode from '../../../Utils/Punycode';
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

    isValidEntityType(type) {
        if (!type) return false;

        return (
            type.type['@type'] === 'textEntityTypeUrl' ||
            type.type['@type'] === 'textEntityTypeTextUrl' ||
            type.type['@type'] === 'textEntityTypeEmailAddress'
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
        const { chatId, messageId, webPage, caption, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        let content = null;
        let { display_url, description, photo, title, url } = webPage || {
            title: '',
            description: '',
            photo: null,
            url: ''
        };
        if (webPage) {
            title = title || this.getTitleFromUrl(url);

            content = (
                <SafeLink className='shared-link-url' url={url}>
                    {display_url}
                </SafeLink>
            );
        } else {
            let { text, caption } = message.content;
            text = text || caption;
            if (text) {
                const { entities } = text;
                if (entities && entities.length > 0) {
                    content = entities.filter(this.isValidEntityType).map((x, i) => {
                        const entityText = substring(text.text, x.offset, x.offset + x.length);
                        let url = entityText;
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
                }
            }
        }

        const tileColor = `tile_color_${(Math.abs(title.charCodeAt(0)) % 7) + 1}`;

        return (
            <>
                <div className='shared-link' onContextMenu={this.handleOpenContextMenu}>
                    <div className={classNames('shared-link-photo', tileColor)}>
                        {getFirstLetter(title)}
                        {photo && (
                            <Photo
                                displaySize={90}
                                chatId={chatId}
                                messageId={messageId}
                                photo={photo}
                                openMedia={openMedia}
                                showProgress={false}
                                style={{ width: 48, height: 48, position: 'absolute', top: 0, left: 0 }}
                            />
                        )}
                    </div>
                    <div className='shared-link-content'>
                        {title && <div className='web-page-title'>{title}</div>}
                        {description && <div className='web-page-description'>{description.text}</div>}
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
