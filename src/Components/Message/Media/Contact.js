/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import UserTile from '../../Tile/UserTile';
import { formatPhoneNumber } from '../../../Utils/Common';
import { getUserFullName } from '../../../Utils/User';
import UserStore from '../../../Stores/UserStore';
import './Contact.css';

const styles = theme => ({
    contactPhone: {
        color: theme.palette.text.secondary
    }
});

class Contact extends React.Component {
    render() {
        const { classes, contact, openMedia } = this.props;
        if (!contact) return null;

        const { user_id, first_name, last_name, phone_number } = contact;

        const user = UserStore.get(user_id) || {
            '@type': 'user',
            type: { '@type': 'userTypeRegular' },
            id: user_id,
            first_name,
            last_name
        };

        const fullName = getUserFullName(user);
        const number = formatPhoneNumber(phone_number);

        return (
            <div className='contact'>
                <div className='contact-tile'>
                    <UserTile userId={user_id} firstName={first_name} lastName={last_name} />
                </div>
                <div className='contact-content'>
                    <div className='contact-name'>
                        {user_id > 0 ? <a onClick={openMedia}>{fullName}</a> : <span>{fullName}</span>}
                    </div>
                    <div className={classNames('contact-phone', classes.contactPhone)}>{number}</div>
                </div>
            </div>
        );
    }
}

Contact.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    contact: PropTypes.object.isRequired,
    openMedia: PropTypes.func
};

export default withStyles(styles, { withTheme: true })(Contact);
