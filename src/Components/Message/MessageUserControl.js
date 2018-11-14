/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './MessageUserControl.css';

class MessageUserControl extends React.Component {
    constructor(props){
        super(props);

        this.handleSelectUser = this.handleSelectUser.bind(this);
    }

    handleSelectUser(){
        const user = UserStore.get(this.props.userId);

        this.props.onSelect(user);
    }

    render() {
        const user = UserStore.get(this.props.userId);
        if (!user) return null;

        const fullName = getUserFullName(user) || 'Deleted Account';

        return (
            this.props.onSelect
                ? <a className='message-author' onClick={this.handleSelectUser}>{fullName}</a>
                : <>{fullName}</>
        );
    }
}

export default MessageUserControl;