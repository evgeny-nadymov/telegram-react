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
import ListItem from '@material-ui/core/ListItem';
import TextField from '@material-ui/core/TextField';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import NextIcon from '../../Assets/Icons/Back';
import SectionHeader from './SectionHeader';
import User from '../Tile/User';
import NewChatPhoto from './NewChatPhoto';
import { loadUsersContent } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './NewGroup.css';

class UserListItem extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { userId } = this.props;
        if (nextProps.userId !== userId) {
            return true;
        }

        return false;
    }

    render() {
        const { userId, style } = this.props;

        return (
            <ListItem className='user-list-item' button style={style}>
                <User userId={userId} />
            </ListItem>
        );
    }
}

class NewGroup extends React.Component {
    constructor(props) {
        super(props);

        this.titleRef = React.createRef();

        this.state = { };
    }

    componentDidMount() {
        let { userIds } = this.props;

        userIds = [UserStore.getMyId()];

        const store = FileStore.getStore();
        loadUsersContent(store, userIds);
    }

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: false
        });
    };

    handleDone = async () => {
        const title = this.titleRef.current.value;
        if (!title.trim()) {
            this.setState({
                error: true
            });
            return;
        }

        if (this.state.error) {
            this.setState({
                error: false
            });
        }

        const chat = await TdLibController.send({
            '@type': 'createNewSupergroupChat',
            title,
            is_channel: false,
            description: '',
            location: null
        });

        if (this.photo) {
            TdLibController.send({
                '@type': 'setChatPhoto',
                chat_id: chat.id,
                photo: { '@type': 'inputFileBlob', name: 'photo.jpg', data: this.photo }
            });
        }

        this.handleClose();
    };

    handleChoosePhoto = blob => {
        this.photo = blob;
    };

    render() {
        let { popup, t, userIds } = this.props;
        const { error } = this.state;

        userIds = [UserStore.getMyId()];

        const items = userIds.map(userId => (<UserListItem key={userId} userId={userId} />));
        const itemsCaption = userIds.length > 1 ? `${userIds.length} members` : '1 member';

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        { popup ? <CloseIcon/> : <ArrowBackIcon /> }
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('NewGroup')}</span>
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
                                label={t('GroupName')}
                                defaultValue={''}
                            />
                        </div>
                        {/*<div className='sidebar-page-section'>*/}
                        <SectionHeader>{itemsCaption}</SectionHeader>
                        {items}
                        {/*</div>*/}
                    </div>
                </div>

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

NewGroup.defaultProps = {
    userIds: [UserStore.getMyId()]
}

export default withTranslation()(NewGroup);
