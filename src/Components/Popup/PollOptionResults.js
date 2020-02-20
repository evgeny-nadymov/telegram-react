/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import PollOptionResult from './PollOptionResult';
import { loadUsersContent } from '../../Utils/File';
import { POLL_RESULTS_FIRST_SLICE_LENGTH, POLL_RESULTS_LEAVE_LENGTH } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './PollOptionResults.css';

class PollOptionResults extends React.Component {
    constructor(props) {
        super(props);

        const { option } = this.props;

        const count =
            option && option.voter_count <= POLL_RESULTS_FIRST_SLICE_LENGTH
                ? option.voter_count
                : POLL_RESULTS_FIRST_SLICE_LENGTH - POLL_RESULTS_LEAVE_LENGTH;

        this.state = {
            voters: [],
            offset: 0,
            count
        };
    }

    async updateVoters() {
        const { chatId, messageId, optionId, option } = this.props;
        const { offset, voters, count } = this.state;
        if (count <= 0) return;

        const result = await TdLibController.send({
            '@type': 'getPollVoters',
            chat_id: chatId,
            message_id: messageId,
            option_id: optionId,
            offset: offset,
            limit: count
        });

        if (this.props.option !== option) {
            return;
        }

        const store = FileStore.getStore();
        loadUsersContent(store, result.user_ids);

        this.setState({
            voters: [...voters, ...result.user_ids]
        });
    }

    componentDidMount() {
        this.updateVoters();
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.count !== this.props.count) {
            this.updateVoters();
        }
    }

    render() {
        const { option, isQuiz } = this.props;
        const { voters, count } = this.state;

        const { text, voter_count, vote_percentage } = option;
        if (voter_count === 0) {
            return null;
        }

        const results = [];
        for (let i = 0; i < count; i++) {
            const userId = i < voters.length ? voters[i] : null;
            results.push(<PollOptionResult key={`${i}_userId=${userId}`} index={i} userId={userId} />);
        }

        const voterCount = isQuiz
            ? count === 1
                ? `${count} answers`
                : `${count} answer`
            : count === 1
            ? `${count} votes`
            : `${count} vote`;

        return (
            <>
                <div className='poll-option-results-caption'>
                    <div className='poll-option-results-answer'>{`${text} — ${vote_percentage}%`}</div>
                    <div className='poll-option-results-count'>{voterCount}</div>
                </div>
                {results}
            </>
        );
    }
}

PollOptionResults.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    optionId: PropTypes.number.isRequired,
    option: PropTypes.object.isRequired,
    isQuiz: PropTypes.bool.isRequired
};

export default PollOptionResults;
