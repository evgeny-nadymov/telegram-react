/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withMessage } from '../MessageContext';
import ListItem from '@material-ui/core/ListItem';
import IconButton from '@material-ui/core/IconButton';
import ArrowTopRightIcon from '../../../Assets/Icons/ArrowTopRight';
import CloseIcon from '../../../Assets/Icons/Close';
import PendingIcon from '../../../Assets/Icons/Pending';
import ShareFilledIcon from '../../../Assets/Icons/ShareFilled';
import { getUserFullName } from '../../../Utils/User';
import { getChatTitle, isBotChat } from '../../../Utils/Chat';
import { setText, showAlert, showInputPasswordAlert, showOpenGameAlert, showOpenUrlAlert, showRequestUrlAlert, showSnackbar, openChat } from '../../../Actions/Client';
import { openChatSelect } from '../../../Actions/Message';
import LStore from '../../../Stores/LocalizationStore';
import MessageStore from '../../../Stores/MessageStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './KeyboardButton.css';
import { isTelegramLink } from '../../../Utils/Url';

import AppStore from '../../../Stores/ApplicationStore';


class KeyboardButton extends React.Component {
    state = {
        loading: false
    }


    /// based on Android handleIntent function
    handleSafeClick = async href => {
   

        href = href.startsWith('http') || href.startsWith('tg://') ? href : 'https://' + href;
        let handled = false;
        if (isTelegramLink(href)) {
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
                            console.log('username='+username)

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

                                } else {
                                    await this.handleOpenUsername(username);
                                    handled = true;
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
                        console.log('href='+href);
                        if (href.startsWith('tg:resolve') || href.startsWith('tg:\/\/resolve')) {
                            const username = url.searchParams.get('domain');
                            console.log('!!!username='+username);

                            if (username) {
                                console.log('!!!username='+username);
                                if (username === 'telegrampassport') {

                                } else {
                                    if (url.searchParams.has('start')){
                                        await this.handleBotStart(username, url.searchParams.get('start'), false);
                                        handled = true;
                                    } else if (url.searchParams.has('startgroup')) {
                                        await this.handleBotStart(username, url.searchParams.get('startgroup'), true);
                                        handled = true;
                                    } else if (url.searchParams.has('game') || url.searchParams.has('domain')) {
                                        await this.handleOpenUsername(username);
                                        handled = true;
                                    } else if (url.searchParams.has('resolve')) {
                    
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

                        } else if (href.startsWith('tg:domain') || href.startsWith('tg://domain')) {


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


    handleCallbackQueryAnswer = (type, result, message) => {
        const { chatId } = this.props;
        const { sender, content, via_bot_user_id } = message;
        const { text, show_alert, url } = result;
        const { game } = content;

        let title = '';
        if (message) {
            if (via_bot_user_id) {
                title = getUserFullName(via_bot_user_id, null);
            } else {
                title = getChatTitle(chatId, false);
            }
        }
        title = title || LStore.getString('Bot');

        if (text) {
            if (show_alert) {
                showAlert({
                    title,
                    message: text,
                    ok: LStore.getString('OK')
                });
            } else {
                showSnackbar(text, closeSnackbar => snackKey => {
                    return (
                        <IconButton
                            key='close'
                            aria-label='Close'
                            color='inherit'
                            className='notification-close-button'
                            onClick={() => { closeSnackbar(snackKey); }}>
                            <CloseIcon />
                        </IconButton>
                    )
                });
            }
        } else if (url) {
            if (type['@type'] === 'inlineKeyboardButtonTypeCallbackGame') {
                const userId = via_bot_user_id ? via_bot_user_id : sender.user_id;
                const user = UserStore.get(userId);

                showOpenGameAlert(game, { message, url, userId, isVerified: user && user.is_verified });
            } else {
                showOpenUrlAlert(url, { punycode: false, ask: false, tryTelegraph: true });
            }
        }
    };

    handleClick = async event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId, messageId, type } = this.props;

        switch (type['@type']) {
            case 'inlineKeyboardButtonTypeBuy': {
                showAlert({
                    title: LStore.getString('AppName'),
                    message: LStore.getString('PaymentsNotSupported'),
                    ok: LStore.getString('OK')
                });
                break;
            }
            case 'inlineKeyboardButtonTypeCallback':
            case 'inlineKeyboardButtonTypeCallbackGame': {
                /// gamee, querty_bot

                const { data } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                const { sender, content, via_bot_user_id } = message;
                if (!content) break;

                let payload = null;
                let game = null;
                if (type['@type'] === 'inlineKeyboardButtonTypeCallbackGame') {
                    game = content.game;
                    if (!game) break;

                    payload = { '@type': 'callbackQueryPayloadGame', game_short_name: game.short_name };
                } else {
                    payload = { '@type': 'callbackQueryPayloadData', data };
                }

                this.setState({ loading: true });
                const result = await TdLibController.send({
                    '@type': 'getCallbackQueryAnswer',
                    chat_id: chatId,
                    message_id: messageId,
                    payload
                }).finally(() => {
                    this.setState({ loading: false });
                });

                this.handleCallbackQueryAnswer(type, result, message);
                break;
            }
            case 'inlineKeyboardButtonTypeCallbackWithPassword': {
                /// BotFather + transfer bot
                const { data } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                this.setState({ loading: true });
                const passwordState = await TdLibController.send({
                    '@type': 'getPasswordState'
                }).finally(() => {
                    this.setState({ loading: false });
                });

                const { has_password } = passwordState;
                if (!has_password) break;

                showInputPasswordAlert(passwordState, async (password, onCloseDialog, onError) => {
                    console.log('[pwd] onPassword', password);
                    this.setState({ loading: true });
                    let error = null;
                    const result = await TdLibController.send({
                        '@type': 'getCallbackQueryAnswer',
                        chat_id: chatId,
                        message_id: messageId,
                        payload: { '@type': 'callbackQueryPayloadDataWithPassword', data, password }
                    }).catch(e => {
                        error = e;
                    }).finally(() => {
                        this.setState({ loading: false });
                    });

                    if (error) {
                        console.log('[pwd] onPassword error', error);
                        onError && onError(error);
                    } else if (result) {
                        console.log('[pwd] onPassword result', result);
                        onCloseDialog && onCloseDialog();
                        this.handleCallbackQueryAnswer(type, result, message);
                    }
                });
                break;
            }
            case 'inlineKeyboardButtonTypeLoginUrl': {
                const { url, id, forward_text } = type;

                this.setState({ loading: true });
                let hasError = false;
                const result = await TdLibController.send({
                    '@type': 'getLoginUrlInfo',
                    chat_id: chatId,
                    message_id: messageId,
                    button_id: id
                }).catch(e => {
                    hasError = true;
                }).finally(() => {
                    this.setState({ loading: false });
                });

                if (hasError) {
                    showOpenUrlAlert(url, { punycode: false, ask: true, tryTelegraph: true });
                } else {
                    switch (result['@type']) {
                        case 'loginUrlInfoOpen': {
                            const { url, skip_confirm } = result;

                            showOpenUrlAlert(url, { punycode: false, ask: !skip_confirm, tryTelegraph: true });
                            break;
                        }
                        case 'loginUrlInfoRequestConfirmation': {
                            const { url } = result;


                            console.log('[login] result', result);
                            showRequestUrlAlert(url, { result, chatId, messageId, buttonId: id });
                            break;
                        }
                    }
                }

                break;
            }
            case 'inlineKeyboardButtonTypeSwitchInline': {
                /// youtube
                const { in_current_chat, query } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                const { sender, via_bot_user_id } = message;
                let userId = sender.user_id;
                if (via_bot_user_id !== 0) {
                    userId = via_bot_user_id;
                }

                const user = UserStore.get(userId);
                if (!user) break;

                const inline = `@${user.username} ${query}`;

                if (in_current_chat){
                    setText(inline);
                } else {
                    openChatSelect({ switchInline: inline });
                }

                break;
            }
            case 'inlineKeyboardButtonTypeUrl': {
                /// qwerty_bot
                const { url } = type;

                if (isTelegramLink(url)) { this.handleSafeClick(url); }
                else { showOpenUrlAlert(url, { punycode: false, ask: true, tryTelegraph: true }); }
                break;
            }
        }
    };

    getIcon(type) {
        switch (type['@type']) {
            case 'inlineKeyboardButtonTypeBuy': {
                return null;
            }
            case 'inlineKeyboardButtonTypeCallback':
            case 'inlineKeyboardButtonTypeCallbackGame': {
                return null;
            }
            case 'inlineKeyboardButtonTypeCallbackWithPassword': {
                return null;
            }
            case 'inlineKeyboardButtonTypeLoginUrl': {
                return <ArrowTopRightIcon className='keyboard-button-icon'/>
            }
            case 'inlineKeyboardButtonTypeSwitchInline': {
                const { in_current_chat } = type;

                return !in_current_chat && <ShareFilledIcon className='keyboard-button-icon'/>;
            }
            case 'inlineKeyboardButtonTypeUrl': {
                return <ArrowTopRightIcon className='keyboard-button-icon'/>
            }
        }
    }

    render() {
        const { text, type } = this.props;
        const { loading } = this.state;

        const icon = this.getIcon(type);

        return (
            <ListItem className='keyboard-button' button onClick={this.handleClick}>
                {text}
                {icon}
                {loading && (
                    <PendingIcon
                        className='keyboard-button-progress'
                        viewBox='0 0 14 14'
                    />
                )}
            </ListItem>
        );
    }

}

KeyboardButton.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    text: PropTypes.string,
    type: PropTypes.object,
    onClick: PropTypes.func
};

export default withMessage(KeyboardButton);