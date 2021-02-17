/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import UserTile from '../Tile/UserTile';
import { loadUsersContent } from '../../Utils/File';
import { PROFILE_PHOTO_PRELOAD_TIME_MS } from '../../Constants';
import CallStore from '../../Stores/CallStore';
import FileStore from '../../Stores/FileStore';
import './GroupCallRecentParticipants.css';

function speakersEquals(lhs, rhs) {
    if (lhs.length !== rhs.length) return false;

    for (let i = 0; i < lhs.length; i++) {
        if (lhs[i].user_id !== rhs[i].user_id) return false;
        if (lhs[i].is_speaking !== rhs[i].is_speaking) return false;
    }

    return true;
}

class GroupCallRecentParticipants extends React.Component {
    state = {
        speakers: []
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { speakers } = this.state;

        if (!speakersEquals(nextState.speakers, speakers)) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        const { id } = props;
        const { prevId } = state;

        if (prevId !== id) {
            let speakers = [];
            const groupCall = CallStore.get(id);
            if (groupCall) {
                const { recent_speakers } = groupCall;
                speakers = recent_speakers;
            }

            return {
                prevId: id,
                speakers
            };
        }

        return null;
    }

    loadContent(speakers) {
        const store = FileStore.getStore();
        loadUsersContent(store, speakers.map(x => x.user_id));
    }

    componentDidMount() {
        this.loadContent(this.state.speakers);

        CallStore.on('updateGroupCall', this.onUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('updateGroupCall', this.onUpdateGroupCall);
    }

    onUpdateGroupCall = update => {
        const { id } = this.props;
        const { group_call } = update;

        if (group_call && group_call.id !== id) return;

        let speakers = [];
        const groupCall = CallStore.get(id);
        if (groupCall) {
            const { recent_speakers } = groupCall;
            speakers = recent_speakers;
        }

        clearTimeout(this.timeout);
        if (!speakers.length) {
            this.setState({ speakers: [] });
        } else {
            this.loadContent(speakers);

            this.timeout = setTimeout(() => {
                this.updateSpeakers();
            }, PROFILE_PHOTO_PRELOAD_TIME_MS);
        }
    };

    updateSpeakers() {
        const { id } = this.props;

        let speakers = [];
        const groupCall = CallStore.get(id);
        if (groupCall) {
            const { recent_speakers } = groupCall;
            speakers = recent_speakers;
        }

        this.setState({ speakers });
    }

    render() {
        const { speakers } = this.state;
        if (!speakers) return null;
        if (!speakers.length) return null;

        return (
            <div className='group-call-recent-participants'>
                {[...speakers].reverse().map(x => <UserTile key={x.user_id} userId={x.user_id} small speaking={x.is_speaking}/>)}
            </div>
        );
    }
}

GroupCallRecentParticipants.propTypes = {
    id: PropTypes.number
};

export default GroupCallRecentParticipants;