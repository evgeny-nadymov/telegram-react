/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import ThemePicker from './ThemePicker';
import LanguagePicker from './LanguagePicker';
import { update } from '../../registerServiceWorker';
import { isAuthorizationReady } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';

const styles = {
    menuIconButton: {
        margin: '8px -2px 8px 12px'
    },
    searchIconButton: {
        margin: '8px 12px 8px 0'
    }
};

const menuAnchorOrigin = {
    vertical: 'bottom',
    horizontal: 'left'
};

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            anchorEl: null
        };
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    handleMenuOpen = event => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleLogOut = () => {
        this.handleMenuClose();

        this.props.onLogOut();
    };

    handleCheckUpdates = async () => {
        this.handleMenuClose();

        await update();
    };

    handleAppearance = event => {
        this.handleMenuClose();

        this.themePicker.open();
    };

    handleLanguage = event => {
        this.handleMenuClose();

        this.languagePicker.open();
    };

    setRef = ref => {
        console.log(this);
        this.languagePicker = ref;
    };

    render() {
        const { classes, t } = this.props;
        const { anchorEl, authorizationState } = this.state;

        const mainMenuControl = isAuthorizationReady(authorizationState) ? (
            <>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={menuAnchorOrigin}>
                    <MenuItem onClick={this.handleCheckUpdates}>{t('UpdateTelegram')}</MenuItem>
                    <MenuItem onClick={this.handleAppearance}>{t('Appearance')}</MenuItem>
                    <MenuItem onClick={this.handleLanguage}>{t('Language')}</MenuItem>
                    <MenuItem onClick={this.handleLogOut}>{t('LogOut')}</MenuItem>
                </Menu>
            </>
        ) : null;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className={classes.menuIconButton}
                    aria-label='Menu'
                    onClick={this.handleMenuOpen}>
                    <MenuIcon />
                </IconButton>
                {mainMenuControl}
                <ThemePicker innerRef={ref => (this.themePicker = ref)} />
                <LanguagePicker ref={ref => (this.languagePicker = ref)} />
            </>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(MainMenuButton);
