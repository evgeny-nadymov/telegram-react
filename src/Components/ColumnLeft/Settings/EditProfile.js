/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Chat from '../../Tile/Chat';
import TextField from '@material-ui/core/TextField';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './EditProfile.css';

class EditProfile extends React.Component {
    constructor(props) {
        super(props);

        this.firstNameRef = React.createRef();
        this.lastNameRef = React.createRef();
        this.bioRef = React.createRef();

        const user = UserStore.get(UserStore.getMyId());
        const userFullInfo = UserStore.getFullInfo(UserStore.getMyId());

        console.log('[edit]', user, userFullInfo);

        this.state = {
            firstName: user ? user.first_name : '',
            lastName: user ? user.last_name : '',
            bio: userFullInfo ? userFullInfo.bio : ''
        };
    }

    componentWillUnmount() {
        this.setName();
        this.setBio();
    }

    setName() {
        const { firstName, lastName } = this.state;
        const newFirstName = this.firstNameRef.current.value;
        const newLastName = this.lastNameRef.current.value;

        if (newFirstName === firstName && newLastName === lastName) {
            return;
        }

        TdLibController.send({
            '@type': 'setName',
            first_name: newFirstName,
            last_name: newLastName
        });
    }

    setBio() {
        const { bio } = this.state;
        const newBio = this.bioRef.current.value;
        if (newBio === bio) {
            return;
        }

        TdLibController.send({
            '@type': 'setBio',
            bio: newBio
        });
    }

    render() {
        const { chatId, t } = this.props;
        const { firstName, lastName, bio } = this.state;

        return (
            <div className='search'>
                <div className='chat-details-info'>
                    <Chat
                        chatId={chatId}
                        showTitle={false}
                        big={true}
                        showStatus={true}
                        showSavedMessages={false}
                        onTileSelect={null}
                    />
                </div>
                <div className='edit-profile-name'>
                    <TextField
                        inputRef={this.firstNameRef}
                        className='edit-profile-input'
                        variant='outlined'
                        fullWidth
                        label={t('FirstName')}
                        defaultValue={firstName}
                    />
                    <TextField
                        inputRef={this.lastNameRef}
                        className='edit-profile-input'
                        variant='outlined'
                        fullWidth
                        label={t('LastName')}
                        defaultValue={lastName}
                    />
                    <TextField
                        inputRef={this.bioRef}
                        className='edit-profile-input'
                        variant='outlined'
                        fullWidth
                        label={t('Bio')}
                        defaultValue={bio}
                    />
                    <div className='edit-profile-hint'>{t('BioAbout')}</div>
                </div>
            </div>
        );
    }
}

EditProfile.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(EditProfile);
