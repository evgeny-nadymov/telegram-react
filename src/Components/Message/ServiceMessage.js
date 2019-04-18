/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import UnreadSeparator from './UnreadSeparator';
import { getServiceMessageContent } from '../../Utils/ServiceMessage';
import MessageStore from '../../Stores/MessageStore';
import './ServiceMessage.css';

class ServiceMessage extends React.Component {
    constructor(props) {
        super(props);

        if (process.env.NODE_ENV !== 'production') {
            const { chatId, messageId } = this.props;
            this.state = {
                message: MessageStore.get(chatId, messageId)
            };
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, sendingState, showUnreadSeparator } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.messageId !== messageId) {
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            return true;
        }

        return false;
    }

    render() {
        const { chatId, messageId, showUnreadSeparator } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty service message]</div>;

        const content = getServiceMessageContent(message);

        return (
            <div className='service-message'>
                {showUnreadSeparator && <UnreadSeparator />}
                <div className='service-message-wrapper'>
                    <div className='service-message-content'>{content}</div>
                </div>
            </div>
        );
    }
}

export default ServiceMessage;
