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
        this.usernameRef = React.createRef();

        const user = UserStore.get(UserStore.getMyId());
        const userFullInfo = UserStore.getFullInfo(UserStore.getMyId());

        this.state = {
            firstName: user ? user.first_name : '',
            lastName: user ? user.last_name : '',
            bio: userFullInfo ? userFullInfo.bio : '',
            username: user ? user.username : '',
            usernameCheck: null
        };
    }

    componentWillUnmount() {
        this.setName();
        this.setBio();
        this.setUsername();
    }

    setUsername() {
        const { username, usernameCheck } = this.state;
        let newUsername = this.usernameRef.current.value;
        if (newUsername.startsWith('@') && newUsername.length > 1) {
            newUsername = newUsername.substr(1);
        }

        if (username === newUsername) return;
        if (!usernameCheck) return;
        if (usernameCheck['@type'] !== 'checkChatUsernameResultOk') return;

        TdLibController.send({
            '@type': 'setUsername',
            username: newUsername
        });
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

    handleUsernameChange = async () => {
        const { chatId } = this.props;
        const { username } = this.state;
        let newUsername = this.usernameRef.current.value;
        if (newUsername.startsWith('@') && newUsername.length > 1) {
            newUsername = newUsername.substr(1);
        }
        if (username === newUsername || newUsername === '') {
            this.setState({
                usernameCheck: null
            });

            // console.log('[un] checkChatUsername', 'null');
        } else {
            // console.log('[un] checkChatUsername start', chatId, newUsername);
            const result = await TdLibController.send({
                '@type': 'checkChatUsername',
                chat_id: chatId,
                username: newUsername
            });

            // console.log('[un] checkChatUsername end', chatId, newUsername, result);

            let newUsername2 = this.usernameRef.current.value;
            if (newUsername2.startsWith('@') && newUsername2.length > 1) {
                newUsername2 = newUsername2.substr(1);
            }
            if (newUsername2 === newUsername) {
                this.setState({
                    usernameCheck: result
                });
            }
        }
    };

    render() {
        const { chatId, t } = this.props;
        const { firstName, lastName, bio, username, usernameCheck } = this.state;

        let hasError = false;
        let usernameLabel = t('Username');
        if (usernameCheck) {
            switch (usernameCheck['@type']) {
                case 'checkChatUsernameResultOk': {
                    hasError = false;
                    usernameLabel = 'Username is available';
                    break;
                }
                case 'checkChatUsernameResultPublicChatsTooMuch':
                case 'checkChatUsernameResultPublicGroupsUnavailable':
                case 'checkChatUsernameResultUsernameInvalid': {
                    hasError = true;
                    usernameLabel = 'Invalid username';
                    break;
                }
                case 'checkChatUsernameResultUsernameOccupied': {
                    hasError = true;
                    usernameLabel = 'Username is already taken';
                    break;
                }
            }
        }

        // console.log('[un] render', hasError, usernameLabel);

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
                <div className='settings-border' />
                <div className='edit-profile-username'>
                    <TextField
                        inputRef={this.usernameRef}
                        error={hasError}
                        className='edit-profile-input'
                        variant='outlined'
                        fullWidth
                        label={usernameLabel}
                        defaultValue={username}
                        onChange={this.handleUsernameChange}
                    />
                    <div className='edit-profile-hint'>
                        You can choose a username on Telegram. If you do, other people will be able to find you by this
                        username and contact you without knowing your phone number. You can use a-z, 0-9 and
                        underscores. Minimum length is 5 characters.
                    </div>
                </div>
            </div>
        );
    }
}

EditProfile.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(EditProfile);
