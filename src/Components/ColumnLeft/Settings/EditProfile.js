/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Chat from '../../Tile/Chat';
import TextField from '@material-ui/core/TextField';
import './EditProfile.css';

class EditProfile extends React.Component {
    render() {
        const { chatId } = this.props;

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
                        className='edit-profile-input'
                        id='settings-name'
                        variant='outlined'
                        fullWidth
                        label='Name'
                        defaultValue='Evgeny'
                    />
                    <TextField
                        className='edit-profile-input'
                        id='settings-surname'
                        variant='outlined'
                        fullWidth
                        label='Last Name'
                        defaultValue='Nadymov'
                    />
                    <TextField
                        className='edit-profile-input'
                        id='settings-bio'
                        variant='outlined'
                        fullWidth
                        label='Bio (optional)'
                        defaultValue=''
                    />
                    <div className='edit-profile-hint'>
                        Any details such as age, occupation or city. Example: 23 y.o. designer from San Francisco.
                    </div>
                </div>
            </div>
        );
    }
}

EditProfile.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default EditProfile;
