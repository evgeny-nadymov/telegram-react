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
import MicIcon from '../../Assets/Icons/Mic';
import MicOffIcon from '../../Assets/Icons/MicOff';
import UserTile from '../Tile/UserTile';
import { getUserFullName } from '../../Utils/User';
import CallStore from '../../Stores/CallStore';
import './GroupCallParticipant.css';

class GroupCallParticipant extends React.Component {

    componentDidMount() {
        CallStore.on('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    componentWillUnmount() {
        CallStore.off('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    onUpdateGroupCallParticipant = update => {
        const { groupCallId, userId } = this.props;
        const { group_call_id, participant } = update;
        if (groupCallId !== group_call_id) return;
        if (!participant) return;

        const { user_id } = participant;
        if (userId !== user_id) return;

        this.forceUpdate();
    };

    render() {
        const { groupCallId, userId, t } = this.props;
        const participants = CallStore.participants.get(groupCallId) || new Map();
        const participant = participants.get(userId);
        if (!participant) return null;

        const { is_speaking, is_muted, can_unmute_self } = participant;

        return (
            <div className='group-call-participant'>
                <UserTile userId={userId}/>
                <div className='group-call-participant-content'>
                    <div className='group-call-participant-content-title'>{getUserFullName(userId)}</div>
                    <div className={classNames('group-call-participant-content-subtitle', 'participant-listening', { 'participant-speaking': is_speaking })}>
                        {is_speaking ? t('Speaking') : t('Listening')}
                    </div>
                </div>
                <div className={classNames('group-call-participant-mic', { 'participant-muted-by-admin': is_muted && !can_unmute_self, 'participant-speaking': is_speaking })}>
                    {!is_muted ? <MicIcon /> : <MicOffIcon />}
                </div>
            </div>
        );
    }

}

GroupCallParticipant.propTypes = {
    userId: PropTypes.number,
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallParticipant);