/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import NextIcon from '../../Assets/Icons/Back';
import NewChatPhoto from './NewChatPhoto';
import { openChat } from '../../Actions/Client';
import { THUMBNAIL_PRIORITY } from '../../Constants';
import TdLibController from '../../Controllers/TdLibController';
import './NewGroup.css';

class NewChannel extends React.Component {
    constructor(props) {
        super(props);

        this.titleRef = React.createRef();
        this.descriptionRef = React.createRef();

        this.state = {
            error: false,
            defaultPhoto: null,
            defaultPhotoURL: null,
            defaultPhotoFile: null
        };
    }

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewChannel',
            open: false
        });
    };

    handleDone = async () => {
        const { error } = this.state;
        const { defaultPhoto, defaultPhotoFile } = this.state;

        const title = this.titleRef.current.value.trim();
        if (!title) {
            this.setState({
                error: true
            });
            return;
        }

        if (error) {
            this.setState({
                error: false
            });
        }

        this.handleClose();

        const description = this.descriptionRef.current.value;

        const chat = await TdLibController.send({
            '@type': 'createNewSupergroupChat',
            title,
            description,
            is_channel: true,
            location: null
        });

        if (defaultPhotoFile) {
            TdLibController.send({
                '@type': 'setChatPhoto',
                chat_id: chat.id,
                photo: { '@type': 'inputFileId', id: defaultPhotoFile.id }
            });
        } else if (defaultPhoto) {
            TdLibController.send({
                '@type': 'setChatPhoto',
                chat_id: chat.id,
                photo: { '@type': 'inputFileBlob', name: 'photo.jpg', data: defaultPhoto }
            });
        }

        openChat(chat.id);
    };

    handleChoosePhoto = async (blob, blobURL) => {
        this.setState({
            defaultPhoto: blob,
            defaultPhotoURL: blobURL
        });

        const result = await TdLibController.send({
            '@type': 'uploadFile',
            file: {
                '@type': 'inputFileBlob',
                name: 'photo.jpg',
                data: blob
            },
            file_type: { '@type': 'fileTypePhoto' },
            priority: THUMBNAIL_PRIORITY
        });

        this.setState({
            defaultPhotoFile: result
        });
    };

    render() {
        const { popup, t } = this.props;
        const { error } = this.state;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        { popup ? <CloseIcon/> : <ArrowBackIcon /> }
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('NewChannel')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='new-chat-content'>
                        <NewChatPhoto onChoose={this.handleChoosePhoto}/>
                        <div className='new-chat-title'>
                            <TextField
                                inputRef={this.titleRef}
                                error={error}
                                className='new-chat-input'
                                variant='outlined'
                                fullWidth
                                label={t('EnterChannelName')}
                                defaultValue={''}
                            />
                            <TextField
                                inputRef={this.descriptionRef}
                                className='new-chat-input'
                                variant='outlined'
                                fullWidth
                                label={t('DescriptionOptionalPlaceholder')}
                                defaultValue={''}
                            />
                            <div className='edit-profile-hint'>{t('DescriptionInfo')}</div>
                        </div>
                    </div>
                </div>

                <div className='new-chat-bottom-button' onClick={this.handleDone}>
                    <NextIcon/>
                </div>
            </>
        );
    }
}

NewChannel.propTypes = {
    popup: PropTypes.bool,
    userIds: PropTypes.array
};

export default withTranslation()(NewChannel);
