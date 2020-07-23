/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserTitle.css';

class UserTitle extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        if (props.userId !== state.prevUserId) {
            const { userId, t } = props;

            return {
                prevUserId: userId,
                fullName: getUserFullName(userId, null, t)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { userId } = this.props;
        const { fullName } = this.state;

        if (nextProps.userId !== userId) {
            return true;
        }

        if (nextState.fullName !== fullName) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        UserStore.on('updateUser', this.onUpdateUser);
    }

    componentWillUnmount() {
        UserStore.off('updateUser', this.onUpdateUser);
    }

    onUpdateUser = update => {
        const { userId, t } = this.props;
        if (userId !== update.user.id) return;

        this.setState({ fullName: getUserFullName(userId, null, t) });
    };

    render() {
        const { fullName } = this.state;

        return (
            <div className='user-title'>{fullName}</div>
        );
    }
}

UserTitle.propTypes = {
    userId: PropTypes.number.isRequired
};

export default withTranslation()(UserTitle);