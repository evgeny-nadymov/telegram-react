/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { openChat, showAlert, showOpenUrlAlert } from '../../Actions/Client';
import { getDecodedUrl, getHref, isTelegramLink, isUrlSafe } from '../../Utils/Url';
import { openChatSelect } from '../../Actions/Message';
import { isBotChat } from '../../Utils/Chat';
import AppStore from '../../Stores/ApplicationStore';
import LStore from '../../Stores/LocalizationStore';
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

    async handleAddStickersLink(name) {
        const stickerSet = await TdLibController.send({
            '@type': 'searchStickerSet',
            name
        }).catch(() => {
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('ChooseStickerSetNotFound'),
                ok: LStore.getString('OK')
            });
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSet',
            stickerSet
        });
    }

    handleBotCommand(command) {
        if (!command) return;

        TdLibController.send({
            '@type': 'sendMessage',
            chat_id: AppStore.getChatId(),
            message_thread_id: 0,
            reply_to_message_id: 0,
            options: null,
            reply_markup: null,
            input_message_content: {
                '@type': 'inputMessageText',
                text: {
                    '@type': 'formattedText',
                    text: command,
                    entities: []
                },
                disable_web_page_preview: true,
                clear_draft: false
            }
        });
    }

    async handleOpenUsername(username) {
        const chat = await TdLibController.send({
            '@type': 'searchPublicChat',
            username
        }).catch(() => {
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('NoUsernameFound'),
                ok: LStore.getString('OK')
            });
        });

        if (!chat) return;

        openChat(chat.id);
    }

    async handleBotStart(username, parameter, isGroup) {
        const chat = await TdLibController.send({
            '@type': 'searchPublicChat',
            username
        }).catch(() => {
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('NoUsernameFound'),
                ok: LStore.getString('OK')
            });
        });

        if (!chat) return;
        if (!isBotChat(chat.id)) return;

        if (isGroup) {
            openChatSelect({ botStartMessage: { botUserId: chat.type.user_id, parameter }})
        } else {
            openChat(chat.id, null, false, { botStartMessage: { botUserId: chat.type.user_id, parameter }});
        }
    }

    async handleOpenMessageLinkInfo(url) {
        const result = await TdLibController.send({
            '@type': 'getMessageLinkInfo',
            url
        }).catch(e => {
            console.log('[SafeLink] getMessageLinkInfo error', url, e);
            throw e;
        });

        if (!result) return;

        const { is_public, chat_id, message, for_album, for_comment } = result;
        if (!chat_id) return;

        openChat(chat_id, message ? message.id: null, false);
    };

    async handlePrivatePost(url) {
        if (url.searchParams.has('channel')) {

        }

        if (url.searchParams.has('post')) {

        }

        if (url.searchParams.has('thread')) {

        }

        if (url.searchParams.has('comment')) {

        }

        await this.handleOpenMessageLinkInfo(url.href);
    }

    async handleUnknownDeepLink(href) {
        const result = await TdLibController.send({
            '@type': 'getDeepLinkInfo',
            link: href
        });

        const { text, need_update_application } = result;

        showAlert({
            title: LStore.getString('AppName'),
            message: text,
            ok: LStore.getString('OK')
        });
    }

    /// based on Android handleIntent function
    handleSafeClick = async event => {
        event && event.stopPropagation();

        let { onClick, url: href } = this.props;

        href = href.startsWith('http') || href.startsWith('tg://') ? href : 'https://' + href;
        let handled = false;
        if (isTelegramLink(href)) {
            event && event.preventDefault();
            try {
                const url = new URL(href);
                console.log('[SafeLink] url', url);

                switch (url.protocol) {
                    case 'http:':
                    case 'https:': {
                        if (url.pathname.startsWith('/bg/')) {

                        } else if (url.pathname.startsWith('/login/')) {

                        } else if (url.pathname.startsWith('/joinchat/')) {

                        } else if (url.pathname.startsWith('/addstickers/')) {
                            const set = url.pathname.replace('/addstickers/', '');
                            await this.handleAddStickersLink(set);
                            handled = true;
                        } else if (url.pathname.startsWith('/mgs/') || url.pathname.startsWith('/share/')) {

                        } else if (url.pathname.startsWith('/confirmphone/')) {

                        } else if (url.pathname.startsWith('/setlanguage/')) {

                        } else if (url.pathname.startsWith('/addtheme/')) {

                        } else if (url.pathname.startsWith('/c/')) {
                            await this.handlePrivatePost(url);
                            handled = true;
                        } else if (url.pathname.length > 1) {
                            const username = url.pathname[0] === '/' ? url.pathname.substr(1) : url.pathname;
                            if (username) {
                                if (url.searchParams.has('start')){
                                    await this.handleBotStart(username, url.searchParams.get('start'), false);
                                    handled = true;
                                } else if (url.searchParams.has('startgroup')) {
                                    await this.handleBotStart(username, url.searchParams.get('startgroup'), true);
                                    handled = true;
                                } else if (url.searchParams.has('game')) {
                                    await this.handleOpenUsername(username);
                                    handled = true;
                                } else if (url.searchParams.has('post')) {

                                } else if (url.searchParams.has('thread')) {

                                } else if (url.searchParams.has('comment')) {

                                }

                                if (!handled) {
                                    await this.handleOpenMessageLinkInfo(href);
                                    handled = true;
                                }
                            }
                        }

                        break;
                    }
                    case 'tg:': {
                        if (href.startsWith('tg:resolve') || href.startsWith('tg://resolve')) {
                            const username = url.searchParams('domain');
                            if (username) {
                                if (username === 'telegrampassport') {

                                } else {
                                    if (url.searchParams.has('start')){
                                        await this.handleBotStart(username, url.searchParams.get('start'), false);
                                        handled = true;
                                    } else if (url.searchParams.has('startgroup')) {
                                        await this.handleBotStart(username, url.searchParams.get('startgroup'), true);
                                        handled = true;
                                    } else if (url.searchParams.has('game')) {
                                        await this.handleOpenUsername(username);
                                        handled = true;
                                    } else if (url.searchParams.has('post')) {

                                    } else if (url.searchParams.has('thread')) {

                                    } else if (url.searchParams.has('comment')) {

                                    }

                                    if (!handled) {
                                        await this.handleOpenMessageLinkInfo(href);
                                        handled = true;
                                    }
                                }
                            }
                        } else if (href.startsWith('tg:privatepost') || href.startsWith('tg://privatepost')) {
                            await this.handlePrivatePost(url)
                            handled = true;
                        } else if (href.startsWith('tg:bg') || href.startsWith('tg://bg')) {

                        } else if (href.startsWith('tg:join') || href.startsWith('tg://join')) {

                        } else if (href.startsWith('tg:addstickers') || href.startsWith('tg://addstickers')) {
                            const set = url.searchParams.get('set');
                            await this.handleAddStickersLink(set);
                            handled = true;
                        } else if (href.startsWith('tg:msg') || href.startsWith('tg://msg') || href.startsWith('tg:share') || href.startsWith('tg://share')) {

                        } else if (href.startsWith('tg:confirmphone') || href.startsWith('tg://confirmphone')) {

                        } else if (href.startsWith('tg:login') || href.startsWith('tg://login')) {

                        } else if (href.startsWith('tg:openmessage') || href.startsWith('tg://openmessage')) {

                        } else if (href.startsWith('tg:passport') || href.startsWith('tg://passport') || href.startsWith('tg:secureid') || href.startsWith('tg://secureid')) {

                        } else if (href.startsWith('tg:setlanguage') || href.startsWith('tg://setlanguage')) {

                        } else if (href.startsWith('tg:addtheme') || href.startsWith('tg://addtheme')) {

                        } else if (href.startsWith('tg:settings') || href.startsWith('tg://settings')) {

                        } else if (href.startsWith('tg:search') || href.startsWith('tg://search')) {

                        } else if (href.startsWith('tg:calllog') || href.startsWith('tg://calllog')) {

                        } else if (href.startsWith('tg:call') || href.startsWith('tg://call')) {

                        } else if (href.startsWith('tg:scanqr') || href.startsWith('tg://scanqr')) {

                        } else if (href.startsWith('tg:addcontact') || href.startsWith('tg://addcontact')) {

                        } else if (href.startsWith('tg:bot_command') || href.startsWith('tg://bot_command')) {
                            const command = url.searchParams.get('command');
                            const bot = url.searchParams.get('bot');

                            this.handleBotCommand(`/${command}` + (bot ? `@${bot}` : ''));
                            handled = true;
                        } else {
                            await this.handleUnknownDeepLink(href);
                            handled = true;
                        }
                        break;
                    }
                }
            } catch (error) {
                console.log('[safeLink] handleSafeLink error', error);
                handled = false;
            }
        }

        if (handled) {
            return;
        }

        if (onClick) {
            onClick(event);
        } else {
            event && event.preventDefault();

            const newWindow = window.open();
            newWindow.opener = null;
            newWindow.location = href;
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
