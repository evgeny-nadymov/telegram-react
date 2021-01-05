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
        const { id } = props;
        const { prevId } = state;

        if (prevId !== id) {
            let participantCount = 0;
            const groupCall = CallStore.get(id);
            if (groupCall) {
                const { participant_count } = groupCall;
                participantCount = participant_count;
            }

            return {
                prevId: id,
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
        const { id } = this.props;
        const { group_call } = update;

        if (group_call && group_call.id !== id) return;

        let participantCount = 0;
        const groupCall = CallStore.get(id);
        if (groupCall) {
            const { participant_count } = groupCall;
            participantCount = participant_count;
        }

        this.setState({ participantCount });
    };

    render() {
        const { t } = this.props;
        const { participantCount } = this.state;

        return (
            <div className='group-call-join-panel-subtitle'>
                {participantCount === 0? t('MembersTalkingNobody') : LStore.formatPluralString('Participants', participantCount)}
            </div>
        );
    }

}

GroupCallJoinPanelSubtitle.propTypes = {
    id: PropTypes.number
};

export default withTranslation()(GroupCallJoinPanelSubtitle);