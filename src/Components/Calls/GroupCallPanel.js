/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import CallEndIcon from '../../Assets/Icons/CallEnd';
import GroupCallMicButton from './GroupCallMicButton';
import GroupCallSubtitle from './GroupCallJoinPanelSubtitle';
import GroupCallSettingsButton from './GroupCallSettingsButton';
import GroupCallPanelButtons from './GroupCallPanelButtons';
import GroupCallParticipants from './GroupCallParticipants';
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
                <div className='group-call-panel-participants scrollbars-hidden'>
                    <GroupCallParticipants groupCallId={groupCallId}/>
                </div>
                <GroupCallPanelButtons>
                    <div className='group-call-panel-button'>
                        <GroupCallSettingsButton/>
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
                </GroupCallPanelButtons>
            </div>
        );
    }
}

GroupCallPanel.propTypes = {
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallPanel);