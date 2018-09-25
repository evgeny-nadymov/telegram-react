import React from 'react';
import './MessageAuthorControl.css';
import UserStore from '../Stores/UserStore';
import { getUserFullName } from '../Utils/User';

class MessageAuthorControl extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        const user = UserStore.get(this.props.userId);
        if (!user) return null;

        const fullName = getUserFullName(user) || 'Deleted Account';

        return (
            <a className='message-author' onClick={this.props.onSelect}>{fullName}</a>
        );
    }
}

export default MessageAuthorControl;