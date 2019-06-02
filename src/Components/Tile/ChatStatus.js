/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { isUserOnline } from '../../Utils/User';
import { getChatUserId } from '../../Utils/Chat';
import UserStore from './../../Stores/UserStore';
import './ChatStatus.css';

const styles = theme => ({
    root: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        borderRadius: '50%',
        overflow: 'hidden'
    },
    icon: {
        background: 'transparent',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box'
    },
    iconIndicator: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: '#80d066'
    }
});

class ChatStatus extends React.Component {
    constructor(props) {
        super(props);

        const userId = getChatUserId(props.chatId);
        const user = UserStore.get(userId);

        this.state = {
            userId: userId,
            online: isUserOnline(user)
        };
    }

    componentDidMount() {
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
    }

    componentWillUnmount() {
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
    }

    onUpdateUserStatus = update => {
        const { userId } = this.state;
        const { user_id } = update;
        if (user_id !== userId) return;

        const user = UserStore.get(userId);
        if (!user) return;

        this.setState({
            online: isUserOnline(user)
        });
    };

    render() {
        const { classes, size, borderSize, className } = this.props;
        const { online } = this.state;
        if (!online) return null;

        return (
            <div className={classNames(className, classes.root)} style={{ width: size, height: size }}>
                <div className={classes.icon} style={{ padding: borderSize }}>
                    <div className={classes.iconIndicator} />
                </div>
            </div>
        );
    }
}

ChatStatus.propTypes = {
    chatId: PropTypes.number.isRequired,
    size: PropTypes.number,
    borderSize: PropTypes.number
};

ChatStatus.defaultProps = {
    size: 12,
    borderSize: 2
};

export default withStyles(styles)(ChatStatus);
