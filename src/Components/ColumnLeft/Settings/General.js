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
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import ColorizeIcon from '../../../Assets/Icons/Colorize';
import ChatBackground from './ChatBackground';
import SidebarPage from '../SidebarPage';
import SharedMediaIcon from '../../../Assets/Icons/SharedMedia';
import ThemePicker from '../ThemePicker';
import TdLibController from '../../../Controllers/TdLibController';
import './General.css';

class General extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            backgrounds: null,
            openChatBackground: false
        };

        this.themePickerRef = React.createRef();
    }

    handleAppearance = () => {
        this.themePickerRef.current.open();
    };

    componentDidMount() {
        this.loadContent();
    }

    loadContent = () => {
        TdLibController.send({
            '@type': 'getBackgrounds',
            for_dark_theme: false
        }).then(backgrounds => this.setState({ backgrounds }));
    };

    openChatBackground = () => {
        if (!this.state.backgrounds) return;

        this.setState({
            openChatBackground: true
        });
    };

    closeChatBackground = () => {
        this.setState({
            openChatBackground: false
        });
    };

    render() {
        const { t, onClose } = this.props;
        const { backgrounds, openChatBackground } = this.state;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('GeneralSettings')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section'>
                        {/*<ListItem autoFocus={false} className='settings-list-item' button onClick={this.openChatBackground}>*/}
                        {/*    <ListItemIcon>*/}
                        {/*        <SharedMediaIcon />*/}
                        {/*    </ListItemIcon>*/}
                        {/*    <ListItemText primary={t('ChatBackground')} />*/}
                        {/*</ListItem>*/}
                        <ListItem autoFocus={false} className='settings-list-item' button onClick={this.handleAppearance}>
                            <ListItemIcon>
                                <ColorizeIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Appearance')} />
                        </ListItem>
                    </div>
                </div>
                <SidebarPage open={openChatBackground} onClose={this.closeChatBackground}>
                    <ChatBackground backgrounds={backgrounds} />
                </SidebarPage>
                <ThemePicker ref={this.themePickerRef} />
            </>
        );
    }
}

General.propTypes = {
    onClose: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(General);
