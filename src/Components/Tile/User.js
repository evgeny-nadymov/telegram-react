/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import UserStatus from './UserStatus';
import UserTile from './UserTile';
import UserTitle from './UserTitle';
import UserStore from './../../Stores/UserStore';
import './User.css';

class User extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: UserStore.get(props.userId)
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.userId !== this.props.userId;
    }

    handleClick = () => {
        const { userId, onSelect } = this.props;
        if (!onSelect) return;

        onSelect(userId);
    };

    render() {
        const { userId, showStatus } = this.props;

        const user = UserStore.get(userId);
        if (!user) {
            console.error('[user] can\'t find', userId);
            return null;
        }

        const { is_contact, username } = user;

        return (
            <div className='user' onClick={this.handleClick}>
                <div className='user-wrapper'>
                    <UserTile userId={userId} />
                    <div className='user-inner-wrapper'>
                        <div className='tile-first-row'>
                            <UserTitle userId={userId}/>
                        </div>
                        {showStatus && (
                            <div className='tile-second-row'>
                                {!is_contact && username ? <div className='user-content dialog-content'>{'@' + username}</div> : <UserStatus userId={userId} /> }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

User.propTypes = {
    userId: PropTypes.number.isRequired,
    onSelect: PropTypes.func,
    showStatus: PropTypes.bool
};

User.defaultProps = {
    showStatus: true
};

export default User;
