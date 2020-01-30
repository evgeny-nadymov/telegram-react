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
import DialogPlaceholder from './Tile/DialogPlaceholder';
import Footer from './Footer';
import HeaderProgress from './ColumnMiddle/HeaderProgress';
import Placeholder from './ColumnMiddle/Placeholder';
import './ColumnMiddle/Header.css';
import './ColumnLeft/Dialogs.css';
import './ColumnMiddle/DialogDetails.css';
import '../TelegramApp.css';
import Dialog from './ColumnLeft/DialogsList';

const styles = theme => ({
    menuIconButton: {
        margin: '8px -2px 8px 12px'
    },
    headerIconButton: {
        margin: '8px 12px 8px 0'
    },
    background: {
        background: theme.palette.type === 'dark' ? theme.palette.grey[900] : 'transparent',
        flex: '1 1 auto',
        position: 'relative'
    }
});

class StubPage extends React.Component {
    render() {
        const { classes, title, t } = this.props;
        const isChatDetailsVisible = false;

        const dialogs = Array.from(Array(10)).map((x, index) => <DialogPlaceholder key={index} index={index} />);

        return (
            <>
                <div
                    className={classNames('page', {
                        'page-third-column': isChatDetailsVisible
                    })}>
                    <div
                        className={classNames('dialogs', {
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
                        {dialogs}
                    </div>
                    <div
                        className={classNames('dialog-details', {
                            'dialog-details-third-column': isChatDetailsVisible
                        })}>
                        <div className='header-details'>
                            <div className={classNames('header-status', 'grow', 'cursor-default')}>
                                <span className='header-status-content'>{title}</span>
                                {Boolean(title) && <HeaderProgress />}
                            </div>
                        </div>
                        <div className={classes.background}>
                            <Placeholder />
                        </div>
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
