/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import CallStore from '../../Stores/CallStore';
import LStore from '../../Stores/LocalizationStore';
import './GroupCallJoinPanelSubtitle.css';

class GroupCallJoinPanelSubtitle extends React.Component {
    state = {
        participantCount: 0
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { participantCount } = this.state;

        if (nextState.participantCount !== participantCount) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        const { groupCallId } = props;
        const { prevGroupCallId } = state;

        if (prevGroupCallId !== groupCallId) {
            let participantCount = 0;
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                const { participant_count } = groupCall;
                participantCount = participant_count;
            }

            return {
                prevGroupCallId: groupCallId,
                participantCount
            };
        }

        return null;
    }

    componentDidMount() {
        CallStore.on('updateGroupCall', this.onUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('updateGroupCall', this.onUpdateGroupCall);
    }

    onUpdateGroupCall = update => {
        const { groupCallId } = this.props;
        const { group_call } = update;

        if (group_call && group_call.id !== groupCallId) return;

        let participantCount = 0;
        const groupCall = CallStore.get(groupCallId);
        if (groupCall) {
            const { participant_count } = groupCall;
            participantCount = participant_count;
        }

        this.setState({ participantCount });
    };

    render() {
        const { t, participantsOnly } = this.props;
        const { participantCount } = this.state;
        // console.log('[call][GroupCallPanelSubtitle] render');

        return (
            <div className='group-call-join-panel-subtitle'>
                {participantCount === 0 && !participantsOnly? t('MembersTalkingNobody') : LStore.formatPluralString('Participants', participantCount)}
            </div>
        );
    }

}

GroupCallJoinPanelSubtitle.propTypes = {
    groupCallId: PropTypes.number,
    participantsOnly: PropTypes.bool
};

GroupCallJoinPanelSubtitle.defaultProps = {
    participantsOnly: false
}

export default withTranslation()(GroupCallJoinPanelSubtitle);