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
import ChatStore from '../../../Stores/ChatStore';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import DataIcon from '../../../Assets/Icons/Data';
import EditIcon from '../../../Assets/Icons/Edit';
import LanguageIcon from '../../../Assets/Icons/Language';
import SettingsIcon from '../../../Assets/Icons/Settings';
import UnmuteIcon from '../../../Assets/Icons/Unmute';
import LanguagePicker from '../LanguagePicker';
import ThemePicker from '../ThemePicker';
import PhotoIcon from '../../../Assets/Icons/SharedMedia';

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.languagePickerRef = React.createRef();
        this.themePickerRef = React.createRef();
    }

    handleAppearance = () => {
        this.themePickerRef.current.open();
    };

    handleLanguage = () => {
        this.languagePickerRef.current.open();
    };

    render() {
        const { chatId, t } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { photo } = chat;

        return (
            <div ref={this.listRef} className='search' onScroll={this.handleScroll}>
                <div className='chat-details-info'>
                    <Chat
                        chatId={chatId}
                        big={true}
                        showStatus={true}
                        showSavedMessages={false}
                        onTileSelect={photo ? this.handleOpenViewer : null}
                    />
                </div>
                <ListItem className='list-item' button onClick={this.handleHelp}>
                    <ListItemIcon>
                        <EditIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('EditProfile')} />
                </ListItem>
                <ListItem className='list-item' button onClick={this.handleHelp}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('GeneralSettings')} />
                </ListItem>
                <ListItem className='list-item' button onClick={this.handleHelp}>
                    <ListItemIcon>
                        <UnmuteIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Notifications')} />
                </ListItem>
                <ListItem className='list-item' button onClick={this.handleHelp}>
                    <ListItemIcon>
                        <DataIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('PrivacySettings')} />
                </ListItem>
                <ListItem autoFocus={false} className='list-item' button onClick={this.handleLanguage}>
                    <ListItemIcon>
                        <LanguageIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Language')} />
                </ListItem>
                <ListItem autoFocus={false} className='list-item' button onClick={this.handleAppearance}>
                    <ListItemIcon>
                        <PhotoIcon />
                    </ListItemIcon>
                    <ListItemText primary={t('Appearance')} />
                </ListItem>
                <LanguagePicker ref={this.languagePickerRef} />
                <ThemePicker ref={this.themePickerRef} />
            </div>
        );
    }
}

Settings.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(Settings);
