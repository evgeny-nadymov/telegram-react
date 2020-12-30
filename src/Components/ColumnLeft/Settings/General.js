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
import Radio from '@material-ui/core/Radio';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import ColorizeIcon from '../../../Assets/Icons/Colorize';
import ChatBackground from './ChatBackground';
import SectionHeader from '../SectionHeader';
import SidebarPage from '../SidebarPage';
import SharedMediaIcon from '../../../Assets/Icons/SharedMedia';
import ThemePicker from '../ThemePicker';
import { isMacOS } from '../../../Utils/Common';
import { SEND_BY_CTRL_ENTER_KEY } from '../../../Constants';
import OptionStore from '../../../Stores/OptionStore';
import TdLibController from '../../../Controllers/TdLibController';
import './General.css';

class General extends React.Component {
    constructor(props) {
        super(props);

        const sendByCtrlEnterOption = OptionStore.get(SEND_BY_CTRL_ENTER_KEY);

        this.state = {
            backgrounds: null,
            openChatBackground: false,
            sendByCtrlEnter: Boolean(sendByCtrlEnterOption && sendByCtrlEnterOption.value)
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

    async handleSetOption(command) {
        let value = false;
        switch (command) {
            case 'sendByCtrlEnter': {
                value = true;
                break;
            }
            case 'sendByEnter': {
                value = false;
                break;
            }
        }

        await TdLibController.send({
            '@type': 'setOption',
            name: SEND_BY_CTRL_ENTER_KEY,
            value: { '@type': 'optionValueBoolean', value }
        });

        this.setState({
            sendByCtrlEnter: value
        });
    }

    render() {
        const { t, onClose } = this.props;
        const { backgrounds, openChatBackground, sendByCtrlEnter } = this.state;

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
                            <ListItemText primary={t('Theme')} />
                        </ListItem>
                    </div>
                    <div className='sidebar-page-section-divider' />
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('Keyboard')}</SectionHeader>
                        <div className='settings-item' onClick={() => this.handleSetOption('sendByEnter')}>
                            <Radio
                                color='primary'
                                className='settings-item-control'
                                checked={!sendByCtrlEnter}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                            <ListItemText
                                id='label-1'
                                primary={t('SendByEnter')}
                                secondary={t('NewLineByShiftEnter')}
                            />
                        </div>
                        <div className='settings-item' onClick={() => this.handleSetOption('sendByCtrlEnter')}>
                            <Radio
                                color='primary'
                                className='settings-item-control'
                                checked={sendByCtrlEnter}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                            <ListItemText
                                id='label-2'
                                primary={isMacOS() ? t('SendByCommandEnter') : t('SendByControlEnter')}
                                secondary={t('NewLineByEnter')}
                            />
                        </div>
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
