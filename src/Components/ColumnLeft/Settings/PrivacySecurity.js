/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import TdLibController from '../../../Controllers/TdLibController';

class PrivacySecurity extends React.Component {
    handleClose = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdatePrivacySecurityPage', opened: false });
    };

    render() {
        return (
            <div className='sidebar-page'>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('Language')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content' />
            </div>
        );
    }
}

PrivacySecurity.propTypes = {};

export default PrivacySecurity;
