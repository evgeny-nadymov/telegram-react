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
import { albumHistoryEquals, orderCompare } from '../../Utils/Common';
import { canManageVoiceChats } from '../../Utils/Chat';
import { loadUsersContent } from '../../Utils/File';
import { PROFILE_PHOTO_PRELOAD_TIME_MS } from '../../Constants';
import CallStore from '../../Stores/CallStore';
import FileStore from '../../Stores/FileStore';
import './GroupCallParticipants.css';

class GroupCallParticipants extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            participants: []
        };

        this.participantsMap = new Map();
        // this.updateParticipants = throttle(this.updateParticipants, 1000);
    }

    static getDerivedStateFromProps(props, state) {
        const { groupCallId } = props;
        const { prevGroupCallId } = state;

        if (prevGroupCallId !== groupCallId) {
            const participantsMap = CallStore.participants.get(groupCallId) || new Map();
            const participants = Array.from(participantsMap.values()).filter(x => x.order !== '0').sort((a, b) => orderCompare(b.order, a.order));

            return {
                prevGroupCallId: groupCallId,
                participants: participants.map(x => x.user_id)
            }
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { participants } = this.state;
        if (!albumHistoryEquals(participants, nextState.participants)) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.preloadContent();

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

        const { order, user_id } = participant;
        if (order !== '0') {
            this.participantsMap.set(user_id, user_id);
            this.loadContent();

            // wait for profile photo
            setTimeout(() => {
                this.updateParticipants();
            }, PROFILE_PHOTO_PRELOAD_TIME_MS);
        } else {
            this.updateParticipants();
        }
    };

    updateParticipants() {
        const { groupCallId } = this.props;

        const participantsMap = CallStore.participants.get(groupCallId) || new Map();
        const participants = Array.from(participantsMap.values()).filter(x => x.order !== '0').sort((a, b) => orderCompare(b.order, a.order));

        this.setState({
            participants: participants.map(x => x.user_id)
        });
    }

    preloadContent = () => {
        const { participants } = this.state;
        if (!participants) return;
        if (!participants.length) return;

        participants.forEach(x => {
            this.participantsMap.set(x, x);
        });
        this.loadContent();
    };

    loadContent = () => {
        const { participantsMap } = this;
        if (!participantsMap) return;
        if (!participantsMap.size) return;

        this.participantsMap = new Map();

        const store = FileStore.getStore();
        loadUsersContent(store, Array.from(participantsMap.keys()));
    }

    render() {
        const { t, groupCallId } = this.props;
        const { participants } = this.state;
        // console.log('[call][GroupCallParticipants] render');

        const { currentGroupCall } = CallStore;
        if (!currentGroupCall) return null;

        const { chatId } = currentGroupCall;

        const manageGroupCalls = canManageVoiceChats(chatId);

        return (
            <div className='group-call-participants'>
                { manageGroupCalls && (
                    <div className='group-call-participants-invite'>
                        <AddMemberIcon/>
                        <div className='group-call-participants-invite-text'>
                            {t('VoipGroupInviteMember')}
                        </div>
                    </div>
                )}
                {participants.map(x => <GroupCallParticipant key={x} userId={x} groupCallId={groupCallId}/>)}
            </div>
        );
    }
}

GroupCallParticipants.propTypes = {
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallParticipants);