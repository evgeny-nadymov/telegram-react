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
import Main from './Main';
import EditProfile from './EditProfile';
import Filters from './Filters';
import General from './General';
import Language from '../Language';
import Notifications from './Notifications';
import PrivacySecurity from './PrivacySecurity';
import SidebarPage from '../SidebarPage';
import { loadChatContent } from '../../../Utils/File';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Settings.css';

class Settings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openEditProfile: false,
            openGeneral: false,
            openNotifications: false,
            openPrivacySecurity: false,
            openLanguage: false,
            openFilters: false
        };
    }

    componentDidMount() {
        this.loadContent();

        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatPhoto', this.onUpdateChatPhoto);
    }

    onUpdateChatPhoto = update => {
        const { chatId } = this.props;
        const { chat_id, photo } = update;

        if (chat_id !== chatId) return;
        if (!photo) return;

        const store = FileStore.get();
        loadChatContent(store, chatId, true);
    };

    async loadContent() {
        const { chatId } = this.props;

        const store = FileStore.getStore();

        loadChatContent(store, chatId, true);

        const result = await TdLibController.send({
            '@type': 'getUserFullInfo',
            user_id: UserStore.getMyId()
        });

        UserStore.setFullInfo(UserStore.getMyId(), result);
    }

    openEditProfile = () => {
        this.setState({
            openEditProfile: true
        });
    };

    closeEditProfile = () => {
        this.setState({
            openEditProfile: false
        });
    };

    openGeneral = () => {
        this.setState({
            openGeneral: true
        });
    };

    closeGeneral = () => {
        this.setState({
            openGeneral: false
        });
    };

    openNotifications = () => {
        this.setState({
            openNotifications: true
        });
    };

    closeNotifications = () => {
        this.setState({
            openNotifications: false
        });
    };

    openPrivacySecurity = () => {
        this.setState({
            openPrivacySecurity: true
        });
    };

    closePrivacySecurity = () => {
        this.setState({
            openPrivacySecurity: false
        });
    };

    openLanguage = () => {
        this.setState({
            openLanguage: true
        });
    };

    closeLanguage = () => {
        this.setState({
            openLanguage: false
        });
    };

    openFilters = () => {
        this.setState({
            openFilters: true
        });
    };

    closeFilters = () => {
        this.setState({
            openFilters: false
        });
    };

    handleCloseSettings = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateSettings',
            open: false
        });
    };

    render() {
        const { chatId, popup } = this.props;
        const { openEditProfile, openGeneral, openNotifications, openPrivacySecurity, openLanguage, openFilters } = this.state;

        return (
            <>
                <Main
                    chatId={chatId}
                    popup={popup}
                    onClose={this.handleCloseSettings}
                    onEditProfile={this.openEditProfile}
                    onGeneral={this.openGeneral}
                    onNotifications={this.openNotifications}
                    onPrivacySecurity={this.openPrivacySecurity}
                    onLanguage={this.openLanguage}
                    onFilters={this.openFilters}
                />
                <SidebarPage open={openEditProfile} onClose={this.closeEditProfile}>
                    <EditProfile chatId={chatId} />
                </SidebarPage>
                <SidebarPage open={openGeneral} onClose={this.closeGeneral}>
                    <General chatId={chatId} />
                </SidebarPage>
                <SidebarPage open={openNotifications} onClose={this.closeNotifications}>
                    <Notifications chatId={chatId} />
                </SidebarPage>
                <SidebarPage open={openPrivacySecurity} onClose={this.closePrivacySecurity}>
                    <PrivacySecurity />
                </SidebarPage>
                <SidebarPage open={openFilters} onClose={this.closeFilters}>
                    <Filters />
                </SidebarPage>
                <SidebarPage open={openLanguage} onClose={this.closeLanguage}>
                    <Language />
                </SidebarPage>
            </>
        );
    }
}

Settings.propTypes = {
    chatId: PropTypes.number,
    popup: PropTypes.bool
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Settings);
