/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import UserTileControl from '../../Tile/UserTileControl';
import { formatPhoneNumber } from '../../../Utils/Common';
import { getUserFullName } from '../../../Utils/User';
import UserStore from '../../../Stores/UserStore';
import './Contact.css';

class Contact extends React.Component {
    render() {
        const { contact, openMedia } = this.props;
        if (!contact) return null;

        const { user_id, first_name, last_name, phone_number } = contact;

        const user = UserStore.get(user_id) || {
            '@type': 'user',
            type: { '@type': 'userTypeRegular' },
            id: user_id,
            first_name: first_name,
            last_name: last_name
        };

        const fullName = getUserFullName(user);
        const number = formatPhoneNumber(phone_number);

        return (
            <div className='contact'>
                <div className='contact-tile'>
                    <UserTileControl userId={user_id} user={user} />
                </div>
                <div className='contact-content'>
                    <div className='contact-name'>
                        {user_id > 0 ? <a onClick={openMedia}>{fullName}</a> : <span>{fullName}</span>}
                    </div>
                    <div className='contact-phone'>{number}</div>
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

export default Contact;
