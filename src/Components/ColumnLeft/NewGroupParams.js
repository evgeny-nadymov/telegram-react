/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../Utils/HOC';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import TextField from '@material-ui/core/TextField';
import ArrowBackIcon from '../../Assets/Icons/Back';
import SectionHeader from './SectionHeader';
import User from '../Tile/User';
import NewChatPhoto from './NewChatPhoto';
import { loadUsersContent } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import './NewGroupParams.css';

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

class NewGroupParams extends React.Component {

    constructor(props) {
        super(props);

        this.titleRef = React.createRef();

        this.state = {
            error: false
        };
    }

    componentDidMount() {
        const { userIds } = this.props;

        const store = FileStore.getStore();
        loadUsersContent(store, userIds);
    }

    getTitle() {
        const { error } = this.state;

        const title = this.titleRef.current.value.trim();
        if (!title) {
            this.setState({
                error: true
            });
            return title;
        }

        if (error) {
            this.setState({
                error: false
            })
        }

        return title;
    }

    handleClose = () => {
        const { onClose } = this.props;
        if (!onClose) return;

        onClose();
    };

    render() {
        const { t, userIds, defaultPhotoURL, onChoosePhoto } = this.props;
        const { error } = this.state;

        const items = userIds.map(userId => (<UserListItem key={userId} userId={userId} />));

        const itemsCaption = userIds.length !== 1 ? `${userIds.length} members` : `${userIds.length} member`;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('NewGroup')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='new-chat-content'>
                        <NewChatPhoto defaultURL={defaultPhotoURL} onChoose={onChoosePhoto}/>
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
                        <SectionHeader>{itemsCaption}</SectionHeader>
                        {items}
                    </div>
                </div>
            </>
        );
    }
}

NewGroupParams.propTypes = {
    userIds: PropTypes.array,
    defaultPhotoURL: PropTypes.string,
    onChoosePhoto: PropTypes.func,
    onClose: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(NewGroupParams);