/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { borderStyle } from './Theme';
import Footer from './Footer';
import './ColumnMiddle/Header.css';
import './ColumnLeft/Dialogs.css';
import './ColumnMiddle/DialogDetails.css';
import '../TelegramApp.css';

const styles = theme => ({
    page: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    },
    menuIconButton: {
        margin: '8px -2px 8px 12px'
    },
    headerIconButton: {
        margin: '8px 12px 8px 0'
    },
    background: {
        background: theme.palette.type === 'dark' ? theme.palette.grey[900] : 'transparent',
        flex: '1 1 auto'
    },
    ...borderStyle(theme)
});

class StubPage extends React.Component {
    render() {
        const { classes, title, t } = this.props;
        const isChatDetailsVisible = false;

        return (
            <>
                <div className={classNames(classes.page, 'page', { 'page-third-column': isChatDetailsVisible })}>
                    <div
                        className={classNames(classes.borderColor, 'dialogs', {
                            'dialogs-third-column': isChatDetailsVisible
                        })}>
                        <div className='header-master'>
                            <IconButton className={classes.menuIconButton} aria-label='Menu'>
                                <MenuIcon />
                            </IconButton>
                            <div className='header-status grow cursor-pointer'>
                                <span className='header-status-content'>{t('AppName')}</span>
                            </div>
                            <IconButton className={classes.headerIconButton} aria-label={t('Search')}>
                                <SearchIcon />
                            </IconButton>
                        </div>
                    </div>
                    <div
                        className={classNames('dialog-details', {
                            'dialog-details-third-column': isChatDetailsVisible
                        })}>
                        <div className={classNames(classes.borderColor, 'header-details')}>
                            <div className={classNames('header-status', 'grow', 'cursor-default')}>
                                <span className='header-status-content'>{title}</span>
                                {Boolean(title) && (
                                    <>
                                        <span className='header-progress'>.</span>
                                        <span className='header-progress'>.</span>
                                        <span className='header-progress'>.</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={classes.background} />
                    </div>
                </div>
                <Footer />
            </>
        );
    }
}

StubPage.propTypes = {
    title: PropTypes.string
};

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(StubPage);
