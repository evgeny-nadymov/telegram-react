/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import UserTile from '../../Tile/UserTile';
import { formatPhoneNumber } from '../../../Utils/Phone';
import { getUserFullName } from '../../../Utils/User';
import UserStore from '../../../Stores/UserStore';
import './Contact.css';

class Contact extends React.Component {
    render() {
        const { contact, title, openMedia, meta, caption, t } = this.props;
        if (!contact) return null;

        const { user_id: id, first_name, last_name, phone_number } = contact;

        const user = UserStore.get(id) || {
            '@type': 'user',
            type: { '@type': 'userTypeRegular' },
            id,
            first_name,
            last_name
        };

        const fullName = getUserFullName(id, user, t);
        const number = formatPhoneNumber(phone_number);

        return (
            <div className={classNames('contact', { 'media-title': title })}>
                <div className='contact-tile'>
                    <UserTile userId={id} firstName={first_name} lastName={last_name} />
                </div>
                <div className='contact-content'>
                    <div className='contact-name'>
                        {id > 0 ? <a onClick={openMedia}>{fullName}</a> : <span>{fullName}</span>}
                    </div>
                    <div className='contact-phone'>
                        {number}
                        {!caption && meta}
                    </div>
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

export default withTranslation()(Contact);
