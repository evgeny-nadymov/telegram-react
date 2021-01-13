/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import AddMemberIcon from '../../Assets/Icons/AddMember';
import GroupCallParticipant from './GroupCallParticipant';
import { orderCompare } from '../../Utils/Common';
import CallStore from '../../Stores/CallStore';
import './GroupCallParticipants.css';

class GroupCallParticipants extends React.Component {
    state = {
        participants: []
    };

    static getDerivedStateFromProps(props, state) {
        const { groupCallId } = props;
        const { prevGroupCallId } = state;

        if (prevGroupCallId !== groupCallId) {
            const participants = Array.from(CallStore.participants.get(groupCallId).values()).filter(x => x.order !== '0').sort((a, b) => orderCompare(a.order, b.order));


            return {
                prevGroupCallId: groupCallId,
                participants: participants.map(x => x.user_id)
            }
        }

        return null;
    }

    componentDidMount() {
        CallStore.on('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    componentWillUnmount() {
        CallStore.off('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    onUpdateGroupCallParticipant = update => {
        const { groupCallId } = this.props;
        const { group_call_id, participant } = update;
        if (!participant) return;

        if (group_call_id !== groupCallId) return;

        const participants = Array.from(CallStore.participants.get(groupCallId).values()).filter(x => x.order !== '0').sort((a, b) => orderCompare(a.order, b.order));
        this.setState({
            participants: participants.map(x => x.user_id)
        });
    };

    render() {
        const { t, groupCallId } = this.props;
        const { participants } = this.state;

        return (
            <div className='group-call-participants'>
                <div className='group-call-participants-invite'>
                    <AddMemberIcon/>
                    <div className='group-call-participants-invite-text'>
                        {t('VoipGroupInviteMember')}
                    </div>
                </div>
                {participants.map(x => <GroupCallParticipant key={x} userId={x} groupCallId={groupCallId}/>)}
            </div>
        );
    }
}

GroupCallParticipants.propTypes = {
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallParticipants);