/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../Assets/Icons/Back';
import DialogsList from './DialogsList';

class Archive extends React.Component {
    render() {
        const { t, innerListRef, items, cacheItems, onClose } = this.props;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button main-menu-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('ArchivedChats')}</span>
                    </div>
                </div>
                <div className='dialogs-content'>
                    <DialogsList
                        type='chatListArchive'
                        ref={innerListRef}
                        cacheItems={cacheItems}
                        open={true}
                        items={items}
                    />
                </div>
            </>
        );
    }
}

Archive.propTypes = {};

export default withTranslation()(Archive);
