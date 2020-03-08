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
import General from './General';
import Language from '../Language';
import Notifications from './Notifications';
import PrivacySecurity from './PrivacySecurity';
import SidebarPage from '../SidebarPage';
import { loadChatsContent } from '../../../Utils/File';
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
            openLanguage: false
        };
    }

    componentDidMount() {
        console.log('[perf] Settings.componentDidMount');
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

    handleCloseSettings = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseSettings'
        });
    };

    render() {
        const { chatId } = this.props;
        const { openEditProfile, openGeneral, openNotifications, openPrivacySecurity, openLanguage } = this.state;

        return (
            <>
                <Main
                    chatId={chatId}
                    onClose={this.handleCloseSettings}
                    onEditProfile={this.openEditProfile}
                    onGeneral={this.openGeneral}
                    onNotifications={this.openNotifications}
                    onPrivacySecurity={this.openPrivacySecurity}
                    onLanguage={this.openLanguage}
                />
                <SidebarPage open={openEditProfile}>
                    <EditProfile chatId={chatId} onClose={this.closeEditProfile} />
                </SidebarPage>
                <SidebarPage open={openGeneral}>
                    <General chatId={chatId} onClose={this.closeGeneral} />
                </SidebarPage>
                <SidebarPage open={openNotifications}>
                    <Notifications chatId={chatId} onClose={this.closeNotifications} />
                </SidebarPage>
                <SidebarPage open={openPrivacySecurity}>
                    <PrivacySecurity onClose={this.closePrivacySecurity} />
                </SidebarPage>
                <SidebarPage open={openLanguage}>
                    <Language onClose={this.closeLanguage} />
                </SidebarPage>
            </>
        );
    }
}

Settings.propTypes = {
    chatId: PropTypes.number.isRequired
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Settings);
