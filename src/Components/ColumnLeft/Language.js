/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Radio from '@material-ui/core/Radio';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Language.css';

class Language extends React.Component {
    constructor(props) {
        super(props);

        const { i18n } = props;
        const language = i18n ? i18n.language : null;

        this.state = {
            language: language || 'en'
        };
    }

    handleChange = language => {
        this.setState({ language });

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language });
    };

    handleClose = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguagePage', opened: false });
    };

    render() {
        const { t } = this.props;
        const { language } = this.state;
        const info = LocalizationStore.info || { language_packs: [] };

        const languages = info.language_packs.map(x => (
            <div className='settings-item' onClick={() => this.handleChange(x.id)}>
                <Radio
                    color='primary'
                    className='settings-item-control'
                    checked={language === x.id}
                    tabIndex={-1}
                    inputProps={{ 'aria-labelledby': 'label-2' }}
                />
                <ListItemText id='label-2' primary={x.name} secondary={x.native_name} />
            </div>
        ));

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
                <div className='sidebar-page-content'>{languages}</div>
            </div>
        );
    }
}

Language.propTypes = {};

export default withTranslation()(Language);
