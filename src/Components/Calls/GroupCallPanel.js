/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import GroupCallMicButton from './GroupCallMicButton';
import GroupCallSubtitle from './GroupCallJoinPanelSubtitle';
import CallEndIcon from '../../Assets/Icons/CallEnd';
import TuneIcon from '../../Assets/Icons/Tune';
import { getChatTitle } from '../../Utils/Chat';
import CallStore from '../../Stores/CallStore';
import './GroupCallPanel.css';

class GroupCallPanel extends React.Component {

    handleClick = () => {
        const { onClose } = this.props;

        onClose && onClose();
    }

    handleLeave = async event => {
        event.stopPropagation();

        const { currentGroupCall: call } = CallStore;
        if (!call) return;

        const { chatId, groupCallId } = call;

        await CallStore.leaveGroupCall(chatId, groupCallId);
    };

    render() {
        const { groupCallId, t } = this.props;
        const { currentGroupCall } = CallStore;
        if (!currentGroupCall) return null;

        const { chatId } = currentGroupCall;

        return (
            <div className='group-call-panel'>
                <div className='group-call-panel-header'>
                    <div className='group-call-panel-caption'>
                        <div className='group-call-title'>{getChatTitle(chatId)}</div>
                        <GroupCallSubtitle groupCallId={groupCallId} participantsOnly={true}/>
                    </div>
                </div>
                <div className='group-call-panel-participants'>

                </div>
                <div className='group-call-panel-buttons'>
                    <div className='group-call-panel-button'>
                        <div className='group-call-panel-button-settings'>
                            <TuneIcon />
                        </div>
                        <div className='group-call-panel-button-text'>
                            {t('Settings')}
                        </div>
                    </div>
                    <GroupCallMicButton/>
                    <div className='group-call-panel-button'>
                        <div className='group-call-panel-button-leave' onClick={this.handleLeave}>
                            <CallEndIcon />
                        </div>
                        <div className='group-call-panel-button-text'>
                            {t('Leave')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

GroupCallPanel.propTypes = {
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallPanel);