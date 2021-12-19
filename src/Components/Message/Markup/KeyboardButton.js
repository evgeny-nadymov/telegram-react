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
import { getChatTitle } from '../../../Utils/Chat';
import { setText, showAlert, showInputPasswordAlert, showOpenGameAlert, showOpenUrlAlert, showRequestUrlAlert, showSnackbar } from '../../../Actions/Client';
import { openChatSelect } from '../../../Actions/Message';
import LStore from '../../../Stores/LocalizationStore';
import MessageStore from '../../../Stores/MessageStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './KeyboardButton.css';

class KeyboardButton extends React.Component {
    state = {
        loading: false
    }

    handleCallbackQueryAnswer = (type, result, message) => {
        const { chatId } = this.props;
        const { sender_id, content, via_bot_user_id } = message;
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
                const userId = via_bot_user_id ? via_bot_user_id : sender_id.user_id;
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

                const { sender_id, content, via_bot_user_id } = message;
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

                const { sender_id, via_bot_user_id } = message;
                let userId = sender_id.user_id;
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

                showOpenUrlAlert(url, { punycode: false, ask: true, tryTelegraph: true });
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