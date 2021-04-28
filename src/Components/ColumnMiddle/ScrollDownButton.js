/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import ChatStore from '../../Stores/ChatStore';
import './ScrollDownButton.css';
import { getChatUnreadCount } from '../../Utils/Chat';

class ScrollDownButton extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const {
            chatId,
            chatList
        } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.chatList !== chatList) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.on('updateMessageMentionRead', this.onUpdate);
    }

    componentWillUnmount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.on('updateMessageMentionRead', this.onUpdate);
    }


    render() {
        const { onClick } = this.props;
        const { chatId } = this.props;

        const unreadCount = getChatUnreadCount(chatId);

        return (
            <div className='scroll-down-button'>
                <Badge badgeContent={unreadCount || 0} color="primary" overlap="circle">
                    <IconButton disableRipple={true} onMouseDown={onClick}>
                      <ArrowDownwardIcon />
                    </IconButton>
                </Badge>
            </div>
        );
    }

  onFastUpdatingComplete = update => {
      this.forceUpdate();
  };

  onUpdate = update => {
      const { chatId } = this.props;

      if (update.chat_id !== chatId) return;

      this.forceUpdate();
  };

}

ScrollDownButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default ScrollDownButton;
