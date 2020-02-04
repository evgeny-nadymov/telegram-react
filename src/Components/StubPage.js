/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
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

class StubPage extends React.Component {
    render() {
        const { title, t } = this.props;
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
                            <IconButton className='header-left-button' aria-label='Menu'>
                                <MenuIcon />
                            </IconButton>
                            <div className='header-status grow cursor-pointer'>
                                <span className='header-status-content'>{t('AppName')}</span>
                            </div>
                            <IconButton className='header-right-button' aria-label={t('Search')}>
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
                        <div className='messages-list'>
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

export default withTranslation()(StubPage);
