/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { getUserStatus, isUserOnline } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserStatusControl.css';

const styles = theme => ({
    userStatusSubtitle: {
        color: theme.palette.type === 'dark' ? theme.palette.text.secondary : '#70777b'
    },
    userStatusAccentSubtitle: {
        color: theme.palette.primary.dark + '!important'
    }
});

class UserStatusControl extends React.Component {
    constructor(props) {
        super(props);

        const { userId } = this.props;
        const user = UserStore.get(userId);

        this.state = {
            prevUserId: userId,
            status: getUserStatus(user),
            isAccent: isUserOnline(user)
        };
    }

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
        const { userId, theme } = this.props;
        const { status, isAccent } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

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
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
    }

    onUpdateUserStatus = update => {
        const { userId } = this.props;
        const user = UserStore.get(userId);

        if (userId === update.user_id) {
            this.setState({ status: getUserStatus(user), isAccent: isUserOnline(user) });
        }
    };

    render() {
        const { classes } = this.props;
        const { status, isAccent } = this.state;

        return (
            <div
                className={classNames('dialog-content', classes.userStatusSubtitle, {
                    'accent-color': isAccent,
                    [classes.userStatusAccentSubtitle]: isAccent
                })}>
                {status}
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(UserStatusControl);
