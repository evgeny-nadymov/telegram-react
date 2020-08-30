/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../../Utils/HOC';
import TextField from '@material-ui/core/TextField';
import { IconButton } from '@material-ui/core';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import NewChatPhoto from '../NewChatPhoto';
import { getSrc, loadChatContent } from '../../../Utils/File';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './EditProfile.css';
import { getSimpleMarkupEntities, getFormattedText } from '../../../Utils/Message';

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

    handleChoosePhoto = async data => {
        const { chatId } = this.props;

        await TdLibController.send({
            '@type': 'setProfilePhoto',
            photo: { '@type': 'inputFileBlob', name: 'profile_photo.jpg', data }
        });

        const store = FileStore.getStore();
        loadChatContent(store, chatId, true);
    };

    render() {
        let { chatId, t, onClose } = this.props;
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

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { photo } = chat;

        const src = getSrc(photo ? photo.small : null);
        const entities = [];
        const text = getSimpleMarkupEntities(t('UsernameHelp'), entities);
        const formattedText = getFormattedText({ '@type': 'formattedText', text, entities });

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('EditProfile')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <NewChatPhoto defaultURL={src} onChoose={this.handleChoosePhoto}/>
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
                    <div className='sidebar-page-section-divider' />
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
                            {formattedText}
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

EditProfile.propTypes = {
    chatId: PropTypes.number
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(EditProfile);
