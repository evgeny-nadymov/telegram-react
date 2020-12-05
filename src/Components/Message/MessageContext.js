/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getDisplayName } from '../../Utils/HOC';

const MessageContext = React.createContext({
    chatId: 0,
    messageId: 0
});

export default MessageContext;

export function withMessage(Component) {
    class MessageComponent extends React.Component {
        render() {
            return <MessageContext.Consumer>{value => <Component chatId={value ? value.chatId : 0} messageId={value? value.messageId: 0} {...this.props} />}</MessageContext.Consumer>;
        }
    }
    MessageComponent.displayName = `WithMessage(${getDisplayName(Component)})`;

    return MessageComponent;
}