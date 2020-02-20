/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import User from '../Tile/User';
import UserPlaceholder from '../Tile/UserPlaceholder';
import { openUser } from '../../Actions/Client';
import TdLibController from '../../Controllers/TdLibController';
import './PollOptionResult.css';

class PollOptionResult extends React.Component {
    onClick = () => {
        const { userId } = this.props;
        if (!userId) return;

        openUser(userId, true);

        setTimeout(() => {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateClosePollResults'
            });
        }, 0);
    };

    render() {
        const { index, userId } = this.props;

        const content = userId ? (
            <User userId={userId} showStatus={false} />
        ) : (
            <UserPlaceholder index={index} showStatus={false} />
        );

        return (
            <ListItem button className='user-list-item' onClick={this.onClick}>
                {content}
            </ListItem>
        );
    }
}

PollOptionResult.propTypes = {
    index: PropTypes.number.isRequired,
    userId: PropTypes.number
};

export default PollOptionResult;
