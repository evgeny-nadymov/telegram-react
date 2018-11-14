/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import FooterCommand from './FooterCommand';
import NotificationsControl from './NotificationsControl';

class NotificationsCommandControl extends NotificationsControl {
    constructor(props){
        super(props);
    }

    render() {
        const { isMuted } = this.state;
        const command = isMuted ? 'unmute' : 'mute';

        return (
            <FooterCommand
                command={command}
                onCommand={this.handleSetChatNotifications}/>
        );
    }

}

export default NotificationsCommandControl;