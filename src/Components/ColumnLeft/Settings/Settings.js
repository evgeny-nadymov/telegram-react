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
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import DataIcon from '../../../Assets/Icons/Data';
import EditIcon from '../../../Assets/Icons/Edit';
import LanguageIcon from '../../../Assets/Icons/Language';
import SettingsIcon from '../../../Assets/Icons/Settings';
import UnmuteIcon from '../../../Assets/Icons/Unmute';
import ThemePicker from '../ThemePicker';
import PhotoIcon from '../../../Assets/Icons/SharedMedia';
import { loadChatsContent } from '../../../Utils/File';
import { setProfileMediaViewerContent } from '../../../Actions/Client';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Settings.css';

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.themePickerRef = React.createRef();
    }

    componentDidMount() {
        this.loadContent();
    }

    async loadContent() {
        const { chatId } = this.props;

        const store = FileStore.getStore();

        loadChatsContent(store, [chatId]);

        const result = await TdLibController.send({
            '@type': 'getUserFullInfo',
            user_id: UserStore.getMyId()
        });

        UserStore.setFullInfo(UserStore.getMyId(), result);
    }

    handleAppearance = () => {
        this.themePickerRef.current.open();
    };

    handleOpenViewer = () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.photo) return;

        setProfileMediaViewerContent({ chatId });
    };

    handleEditProfile = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenEditProfile'
        });
    };

    handleNotifications = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNotificationsPage',
            opened: true
        });
    };

    handlePrivacySecurity = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePrivacySecurityPage',
            opened: true
        });
    };

    handleLanguage = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateLanguagePage',
            opened: true
        });
    };

    render() {
        const { chatId, t } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { photo } = chat;

        return (
            <div ref={this.listRef} className='settings'>
                <div className='chat-details-info'>
                    <Chat
                        chatId={chatId}
                        big={true}
                        showStatus={true}
                        showSavedMessages={false}
                        onTileSelect={photo ? this.handleOpenViewer : null}
                    />
                </div>
                <ListItem className='settings-list-item' button onClick={this.handleEditProfile}>
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('EditProfile')} />
                </ListItem>
                <ListItem className='settings-list-item' button onClick={this.handleHelp}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('GeneralSettings')} />
                </ListItem>
                <ListItem className='settings-list-item' button onClick={this.handleNotifications}>
                    <ListItemIcon>
                        <UnmuteIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Notifications')} />
                </ListItem>
                <ListItem className='settings-list-item' button onClick={this.handlePrivacySecurity}>
                    <ListItemIcon>
                        <DataIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('PrivacySettings')} />
                </ListItem>
                <ListItem autoFocus={false} className='settings-list-item' button onClick={this.handleLanguage}>
                    <ListItemIcon>
                        <LanguageIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Language')} />
                </ListItem>
                <ListItem autoFocus={false} className='settings-list-item' button onClick={this.handleAppearance}>
                    <ListItemIcon>
                        <PhotoIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Appearance')} />
                </ListItem>
                <ThemePicker ref={this.themePickerRef} />
            </div>
        );
    }
}

Settings.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(Settings);
