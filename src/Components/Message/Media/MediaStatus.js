/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { isContentOpened } from '../../../Utils/Message';
import MessageStore from '../../../Stores/MessageStore';

class MediaStatus extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = this.props;

        this.state = {
            isOpened: isContentOpened(chatId, messageId)
        };
    }

    componentDidMount() {
        MessageStore.on('updateMessageContentOpened', this.onUpdateMessageContentOpened);
    }

    componentWillUnmount() {
        MessageStore.off('updateMessageContentOpened', this.onUpdateMessageContentOpened);
    }

    onUpdateMessageContentOpened = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chat_id && messageId === update.message_id) {
            this.setState({ isOpened: isContentOpened(chatId, messageId) });
        }
    };

    render() {
        const { icon, openedIcon } = this.props;
        const { isOpened } = this.state;

        return isOpened ? openedIcon : icon;
    }
}

MediaStatus.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    icon: PropTypes.node,
    openedIcon: PropTypes.node
};

MediaStatus.defaultProps = {
    icon: null,
    openedIcon: null
};

export default MediaStatus;
