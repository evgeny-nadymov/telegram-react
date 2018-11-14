/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import {
    getUserStatus,
    isAccentUserSubtitle
} from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserStatusControl.css';

class UserStatusControl extends React.Component {

    constructor(props){
        super(props);

        const { userId } = this.props;
        const user = UserStore.get(userId);

        this.state = {
            prevUserId: userId,
            status: getUserStatus(user),
            isAccent: isAccentUserSubtitle(user)
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.userId !== state.prevUserId) {

            const { userId } = props;
            const user = UserStore.get(userId);

            return {
                prevUserId: userId,
                status: getUserStatus(user),
                isAccent: isAccentUserSubtitle(user)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.userId !== this.props.userId){
            return true;
        }

        if (nextState.status !== this.state.status
            || nextState.isAccent !== this.state.isAccent){
            return true;
        }

        return false;
    }

    componentDidMount(){
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
    }

    componentWillUnmount(){
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
    }

    onUpdateUserStatus = (update) => {
        const { userId } = this.props;
        const user = UserStore.get(userId);

        if (userId === update.user_id) {
            this.setState({ status: getUserStatus(user), isAccent: isAccentUserSubtitle(user) });
        }
    };

    render() {
        const { status, isAccent } = this.state;

        return (
            <div className={classNames('dialog-content', {'accent-color': isAccent})}>
                {status}
            </div>
        );
    }
}

export default UserStatusControl;