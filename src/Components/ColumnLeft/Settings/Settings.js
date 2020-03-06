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
import { Slide } from '@material-ui/core';
import Main from './Main';
import EditProfile from './EditProfile';
import General from './General';
import Notifications from './Notifications';
import PrivacySecurity from './PrivacySecurity';
import Language from '../Language';
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
            openPrivacy: false,
            openLanguage: false
        };
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
            <div className='settings'>
                <div className='settings-content'>
                    <Main
                        chatId={chatId}
                        onClose={this.handleCloseSettings}
                        onEditProfile={this.openEditProfile}
                        onGeneral={this.openGeneral}
                        onNotifications={this.openNotifications}
                        onPrivacySecurity={this.openPrivacySecurity}
                        onLanguage={this.openLanguage}
                    />
                    <Slide direction='right' in={openEditProfile} mountOnEnter unmountOnExit>
                        <EditProfile chatId={chatId} onClose={this.closeEditProfile} />
                    </Slide>
                    <Slide direction='right' in={openGeneral} mountOnEnter unmountOnExit>
                        <General chatId={chatId} onClose={this.closeGeneral} />
                    </Slide>
                    <Slide direction='right' in={openNotifications} mountOnEnter unmountOnExit>
                        <Notifications chatId={chatId} onClose={this.closeNotifications} />
                    </Slide>
                    <Slide direction='right' in={openPrivacySecurity} mountOnEnter unmountOnExit>
                        <PrivacySecurity onClose={this.closePrivacySecurity} />
                    </Slide>
                    <Slide direction='right' in={openLanguage} mountOnEnter unmountOnExit>
                        <Language onClose={this.closeLanguage} />
                    </Slide>
                </div>
            </div>
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
