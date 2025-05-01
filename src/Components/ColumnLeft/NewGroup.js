/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import AddParticipants from './AddParticipants';
import NewGroupParams from './NewGroupParams';
import SidebarPage from './SidebarPage';
import NextIcon from '../../Assets/Icons/Back';
import { openChat } from '../../Actions/Client';
import { THUMBNAIL_PRIORITY } from '../../Constants';
import TdLibController from '../../Controllers/TdLibController';
import './NewGroup.css';

class NewGroup extends React.Component {
    constructor(props) {
        super(props);

        this.addParticipantsRef = React.createRef();
        this.newGroupParamsRef = React.createRef();

        this.state = {
            openParams: false,
            userIds: [],
            defaultPhoto: null,
            defaultPhotoURL: null,
            defaultPhotoFile: null
        };
    }

    handleDone = async () => {
        const { openParams } = this.state;
        if (!openParams) {
            const userIds = this.addParticipantsRef.current.getUserIds();
            if (!userIds.length) return;

            this.setState({
                openParams: true,
                userIds
            })
        } else {
            const { userIds, defaultPhoto, defaultPhotoFile } = this.state;

            const title = this.newGroupParamsRef.current.getTitle();
            if (!title) {
                return;
            }

            this.handleClose();

            const chat = await TdLibController.send({
                '@type': 'createNewSupergroupChat',
                title,
                is_channel: false,
                description: '',
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

            if (userIds.length > 0) {
                TdLibController.send({
                    '@type': 'addChatMembers',
                    chat_id: chat.id,
                    user_ids: userIds
                });
            }

            openChat(chat.id);
        }
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: false
        });
    };

    handleCloseParams = () => {
        this.setState({
            openParams: false,
            userIds: []
        })
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
    }

    render() {
        const { popup } = this.props;
        const { openParams, userIds, defaultPhotoURL } = this.state;

        return (
            <>
                <AddParticipants ref={this.addParticipantsRef} popup={popup} onClose={this.handleClose}/>

                <SidebarPage open={openParams}>
                    <NewGroupParams
                        ref={this.newGroupParamsRef}
                        defaultPhotoURL={defaultPhotoURL}
                        userIds={userIds}
                        onChoosePhoto={this.handleChoosePhoto}
                        onClose={this.handleCloseParams}
                    />
                </SidebarPage>

                <div className='new-chat-bottom-button' onClick={this.handleDone}>
                    <NextIcon/>
                </div>
            </>
        );
    }
}

NewGroup.propTypes = {
    popup: PropTypes.bool,
    userIds: PropTypes.array
};

export default withTranslation()(NewGroup);
