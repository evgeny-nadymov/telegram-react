/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { openChat, showOpenUrlAlert } from '../../Actions/Client';
import { getDecodedUrl, getHref, isUrlSafe } from '../../Utils/Url';
import MessageStore from '../../Stores/MessageStore';
import OptionStore from '../../Stores/OptionStore';
import TdLibController from '../../Controllers/TdLibController';
import './SafeLink.css';

class SafeLink extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { displayText, mail, url } = props;

        if (state.prevUrl !== url || state.prevDisplayText !== displayText) {
            return {
                prevUrl: url,
                prevDisplayText: displayText,
                safe: isUrlSafe(displayText, url),
                decodedUrl: getDecodedUrl(url, mail),
                href: getHref(url, mail)
            };
        }

        return null;
    }

    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();

        const { onClick } = this.props;
        const { decodedUrl } = this.state;

        showOpenUrlAlert(decodedUrl, { onClick, punycode: false, ask: true, tryTelegraph: false });
    };

    isTelegramLink(url) {
        if (!url) return false;

        const lowerCaseUrl = url
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        const tMeUrl = OptionStore.get('t_me_url')
            .value
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        return lowerCaseUrl.startsWith('t.me/') || lowerCaseUrl.startsWith('tg://') || lowerCaseUrl.startsWith(tMeUrl);
    }

    isAddStickersLink(url) {
        if (!url) return false;

        const lowerCaseUrl = url
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        const tMeUrl = OptionStore.get('t_me_url')
            .value
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        return lowerCaseUrl.startsWith('t.me/addstickers/') || lowerCaseUrl.startsWith(tMeUrl + 'addstickers/');
    }

    handleSafeClick = async event => {
        event.stopPropagation();

        const { onClick, url: href } = this.props;

        if (this.isAddStickersLink(href)) {
            event.preventDefault();
            try {
                const nameIndex = href.toLowerCase().indexOf('/addstickers/') + '/addstickers/'.length;
                if (nameIndex !== -1) {
                    const name = href.substr(nameIndex);

                    const stickerSet = await TdLibController.send({
                        '@type': 'searchStickerSet',
                        name
                    });

                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateStickerSet',
                        stickerSet
                    });
                }
            } catch (error) {
                console.log('[safeLink] messageLinkInfo error', error);
            }

            if (onClick) {
                onClick(event);
            }
        } else if (this.isTelegramLink(href)) {
            event.preventDefault();
            try {
                const messageLinkInfo = await TdLibController.send({
                    '@type': 'getMessageLinkInfo',
                    url: href
                });

                MessageStore.setItems([messageLinkInfo.message]);

                const { chat_id, message } = messageLinkInfo;
                if (chat_id) {
                    openChat(chat_id, message ? message.id : null);
                    return;
                }
            } catch (error) {
                console.log('[safeLink] messageLinkInfo error', error);
            }

            if (onClick) {
                onClick(event);
            }
        }

        if (onClick) {
            event.preventDefault();
            onClick(event);
        }
    };

    render() {
        const { className, children, url } = this.props;
        const { decodedUrl, href, safe } = this.state;

        if (!url) return null;
        if (!decodedUrl) return null;

        return (
            <>
                {safe ? (
                    <a
                        className={className}
                        href={href}
                        title={decodedUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={this.handleSafeClick}>
                        {children || url}
                    </a>
                ) : (
                    <a className={className} title={decodedUrl} onClick={this.handleClick}>
                        {children || url}
                    </a>
                )}
            </>
        );
    }
}

SafeLink.propTypes = {
    url: PropTypes.string.isRequired,
    displayText: PropTypes.string,
    mail: PropTypes.bool,
    onClick: PropTypes.func
};

export default SafeLink;
