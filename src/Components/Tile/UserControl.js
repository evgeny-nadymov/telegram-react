/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import UserTileControl from './UserTileControl';
import UserStatusControl from './UserStatusControl';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserControl.css';

class UserControl extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.userId !== this.props.userId;
    }

    handleClick = () => {
        const { userId, onSelect } = this.props;

        const user = UserStore.get(userId);
        if (!user) return;
        if (!onSelect) return;

        onSelect(user);
    };

    render() {
        const { userId } = this.props;
        const user = UserStore.get(userId);

        const fullName = getUserFullName(user);

        return (
            <div className='user' onClick={this.handleClick}>
                <div className='user-wrapper'>
                    <UserTileControl userId={userId} />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className='dialog-title'>{fullName}</div>
                        </div>
                        <div className='tile-second-row'>
                            <UserStatusControl userId={userId} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

UserControl.propTypes = {
    userId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default UserControl;
