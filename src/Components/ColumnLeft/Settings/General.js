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
import ArrowBackIcon from '../../../Assets/Icons/Back';
import './General.css';

class General extends React.Component {
    render() {
        const { t, onClose } = this.props;

        return (
            <div className='settings-page'>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('GeneralSettings')}</span>
                    </div>
                </div>
                <div className='settings-page-content' />
            </div>
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
