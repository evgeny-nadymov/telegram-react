/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import SectionHeader from '../SectionHeader';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import TdLibController from '../../../Controllers/TdLibController';
import './PrivacyCalls.css';

class PrivacyCalls extends React.Component {
    state = {
        prevAllowCalls: null,
        prevAllowP2PCalls: null
    };

    static getDerivedStateFromProps(props, state) {
        const { allowCalls, allowP2PCalls } = props;
        const { prevAllowCalls, prevAllowP2PCalls } = state;
        if (allowCalls !== prevAllowCalls || allowP2PCalls !== prevAllowP2PCalls) {
            const allowCallsValue = allowCalls.rules.find(x =>
                x['@type'] === 'userPrivacySettingRuleAllowAll' ||
                x['@type'] === 'userPrivacySettingRuleAllowContacts' ||
                x['@type'] === 'userPrivacySettingRuleRestrictAll');

            const allowP2PCallsValue = allowP2PCalls.rules.find(x =>
                x['@type'] === 'userPrivacySettingRuleAllowAll' ||
                x['@type'] === 'userPrivacySettingRuleAllowContacts' ||
                x['@type'] === 'userPrivacySettingRuleRestrictAll');

            return {
                prevAllowCalls: allowCalls,
                prevAllowP2PCalls: allowP2PCalls,
                allowCallsValue: allowCallsValue ? allowCallsValue['@type'] : 'userPrivacySettingRuleRestrictAll',
                allowP2PCallsValue: allowP2PCallsValue ? allowP2PCallsValue['@type'] : 'userPrivacySettingRuleRestrictAll'
            }
        }

        return null;
    }

    componentWillUnmount() {
        this.setSettings();
    }

    setSettings() {
        const { allowCalls, allowP2PCalls } = this.props;
        const { allowCallsValue, allowP2PCallsValue } = this.state;

        const prevAllowCallsValue = allowCalls.rules.find(x =>
            x['@type'] === 'userPrivacySettingRuleAllowAll' ||
            x['@type'] === 'userPrivacySettingRuleAllowContacts' ||
            x['@type'] === 'userPrivacySettingRuleRestrictAll');
        if (!prevAllowCallsValue || allowCallsValue !== prevAllowCallsValue['@type']) {
            let added = false;
            const rules = {
                '@type': 'userPrivacySettingRules',
                rules: allowCalls.rules.map(x => {
                    if (x['@type'] === prevAllowCallsValue['@type']) {
                        added = true;
                        return { '@type': allowCallsValue }
                    } else {
                        return x;
                    }
                })
            }

            if (!added) {
                rules.rules.push({ '@type': allowCallsValue });
            }

            TdLibController.send({
                '@type': 'setUserPrivacySettingRules',
                setting: { '@type': 'userPrivacySettingAllowCalls' },
                rules
            });
        }

        const prevAllowP2PCallsValue = allowP2PCalls.rules.find(x =>
            x['@type'] === 'userPrivacySettingRuleAllowAll' ||
            x['@type'] === 'userPrivacySettingRuleAllowContacts' ||
            x['@type'] === 'userPrivacySettingRuleRestrictAll');
        if (!prevAllowP2PCallsValue || allowP2PCallsValue !== prevAllowP2PCallsValue['@type']) {
            let added = false;
            const rules = {
                '@type': 'userPrivacySettingRules',
                rules: allowP2PCalls.rules.map(x => {
                    if (x['@type'] === prevAllowP2PCallsValue['@type']) {
                        added = true;
                        return { '@type': allowP2PCallsValue }
                    } else {
                        return x;
                    }
                })
            }

            if (!added) {
                rules.rules.push({ '@type': allowP2PCallsValue });
            }

            TdLibController.send({
                '@type': 'setUserPrivacySettingRules',
                setting: { '@type': 'userPrivacySettingAllowPeerToPeerCalls' },
                rules
            });
        }
    }

    handleChangeAllowCalls = event => {
        this.setState({
            allowCallsValue: event.currentTarget.value
        });
    };

    handleChangeAllowP2PCalls = event => {
        this.setState({
            allowP2PCallsValue: event.currentTarget.value
        });
    };

    render() {
        const { onClose, t } = this.props;
        const { allowCallsValue, allowP2PCallsValue } = this.state;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('Calls')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('WhoCanCallMe')}</SectionHeader>
                        <RadioGroup aria-label='' name='' value={allowCallsValue} onChange={this.handleChangeAllowCalls}>
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleAllowAll' control={<Radio color='primary'/>} label={t('P2PEverybody')} />
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleAllowContacts' control={<Radio color='primary'/>} label={t('P2PContacts')} />
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleRestrictAll' control={<Radio color='primary'/>} label={t('P2PNobody')} />
                        </RadioGroup>

                        <SectionHeader>{t('PrivacyP2P')}</SectionHeader>
                        <RadioGroup aria-label='' name='' value={allowP2PCallsValue} onChange={this.handleChangeAllowP2PCalls}>
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleAllowAll' control={<Radio color='primary'/>} label={t('P2PEverybody')} />
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleAllowContacts' control={<Radio color='primary'/>} label={t('P2PContacts')} />
                            <FormControlLabel className='privacy-calls-item' value='userPrivacySettingRuleRestrictAll' control={<Radio color='primary'/>} label={t('P2PNobody')} />
                        </RadioGroup>
                    </div>
                </div>
            </>
        );
    }
}

PrivacyCalls.propTypes = {
    allowCalls: PropTypes.object.isRequired,
    allowP2PCalls: PropTypes.object.isRequired,
};

export default withTranslation()(PrivacyCalls);