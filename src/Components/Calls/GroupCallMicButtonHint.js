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
import AnimatedItem from '../ColumnMiddle/AnimatedItem';
import './GroupCallMicButtonHint.css';

class GroupCallMicButtonHint extends React.Component {

    getItemTemplate = item => {
        const { t } = this.props;

        let title = '';
        let subtitle = '';
        switch (item) {
            case 'muted': {
                title = t('VoipGroupUnmute');
                subtitle = t('VoipHoldAndTalk');
                break;
            }
            case 'unmuted': {
                title = t('VoipTapToMute');
                break;
            }
            case 'forceMuted': {
                title = t('VoipMutedByAdmin');
                subtitle = t('VoipMutedByAdminInfo');
                break;
            }
            case 'connecting': {
                title = t('Connecting');
                break;
            }
        }

        return (
            <div className='group-call-mic-button-hint-item'>
                <div className='group-call-mic-button-hint-title'>{title}</div>
                {subtitle && <div className='group-call-mic-button-hint-subtitle'>{subtitle}</div>}
            </div>
        );
    }

    render() {
        const { className, status } = this.props;

        return (
            <div className={classNames('group-call-mic-button-hint', className)}>
                <AnimatedItem item={status} height={37} getItemTemplate={this.getItemTemplate} scrollDown={true} animateOnMount={false}/>
            </div>
        );
    }
}

GroupCallMicButtonHint.propTypes = {
    status: PropTypes.string
};

export default withTranslation()(GroupCallMicButtonHint);