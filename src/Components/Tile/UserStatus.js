/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getUserStatus, isUserOnline } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserStatus.css';

class UserStatus extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        if (props.userId !== state.prevUserId) {
            const { userId } = props;
            const user = UserStore.get(userId);

            return {
                prevUserId: userId,
                status: getUserStatus(user),
                isAccent: isUserOnline(user)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { userId } = this.props;
        const { status, isAccent } = this.state;

        if (nextProps.userId !== userId) {
            return true;
        }

        if (nextState.status !== status) {
            return true;
        }

        if (nextState.isAccent !== isAccent) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
    }

    componentWillUnmount() {
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
    }

    onUpdateUserStatus = update => {
        const { userId } = this.props;
        if (userId !== update.user_id) return;

        const user = UserStore.get(userId);
        this.setState({ status: getUserStatus(user), isAccent: isUserOnline(user) });
    };

    render() {
        const { status, isAccent } = this.state;

        return (
            <div className={classNames('user-content', 'dialog-content', { 'user-status-accent': isAccent })}>
                {status}
            </div>
        );
    }
}

UserStatus.propTypes = {
    userId: PropTypes.number.isRequired
};

export default UserStatus;
