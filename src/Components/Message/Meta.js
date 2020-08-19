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
import VisibilityIcon from '@material-ui/icons/Visibility';
import Status from './Status';
import { getDate, getDateHint, getViews } from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import './Meta.css';

class Meta extends React.Component {

    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId } = props;
        const { prevChatId, prevMessageId } = state;

        if (prevChatId !== chatId || prevMessageId !== messageId) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) return null;

            const { date, edit_date: editDate, views, is_outgoing: isOutgoing } = message;

            return {
                prevChatId: chatId,
                prevMessageId: messageId,

                date,
                editDate,
                views,
                isOutgoing
            };
        }

        return null;
    }

    componentDidMount() {
        MessageStore.on('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.onUpdateMessageViews);
    }

    componentWillUnmount() {
        MessageStore.off('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.off('updateMessageViews', this.onUpdateMessageViews);
    }

    onUpdateMessageEdited = update => {
        const { chat_id, message_id, edit_date: editDate } = update;
        const { chatId, messageId } = this.props;

        if (chat_id !== chatId) return;
        if (message_id !== messageId) return;

        this.setState({
            editDate
        });
    };

    onUpdateMessageViews = update => {
        const { chat_id, message_id, views } = update;
        const { chatId, messageId } = this.props;

        if (chat_id !== chatId) return;
        if (message_id !== messageId) return;

        this.setState({
            views
        });
    };

    render() {
        const { className, chatId, messageId, onDateClick, t, style } = this.props;
        const { date, editDate, views, isOutgoing } = this.state;

        const dateStr = getDate(date);
        const dateHintStr = getDateHint(date);
        const viewsStr = getViews(views);

        return (
            <div className={classNames('meta', className)} style={style}>
                <span>&ensp;</span>
                {views > 0 && (
                    <>
                        <VisibilityIcon className='meta-views-icon' />
                        <span className='meta-views' title={views}>
                            &nbsp;
                            {viewsStr}
                            &nbsp; &nbsp;
                        </span>
                    </>
                )}
                {editDate > 0 && <span>{t('EditedMessage')}&nbsp;</span>}
                <a onClick={onDateClick}>
                    <span title={dateHintStr}>{dateStr}</span>
                </a>
                {isOutgoing && <Status chatId={chatId} messageId={messageId} />}
            </div>
        );
    }
}

Meta.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    onDateClick: PropTypes.func
};

export default withTranslation()(Meta);
