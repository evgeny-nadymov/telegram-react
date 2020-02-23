/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import PollOptionResult from './PollOptionResult';
import { loadUsersContent } from '../../Utils/File';
import { POLL_RESULTS_FIRST_SLICE_LENGTH, POLL_RESULTS_LEAVE_LENGTH, POLL_RESULTS_SLICE_LENGTH } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import UserStore from '../../Stores/UserStore';
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

    async updateVoters(offset, count, loadMore) {
        const { chatId, messageId, optionId, option } = this.props;
        const { voters } = this.state;
        if (count <= 0) return;

        const limit = count - offset;
        // console.log(`[poll] getPollVoters start option_id=${optionId} offset=${offset} limit=${limit}`);
        const result = await TdLibController.send({
            '@type': 'getPollVoters',
            chat_id: chatId,
            message_id: messageId,
            option_id: optionId,
            offset,
            limit
        });
        // console.log(`[poll] getPollVoters end option_id=${optionId} offset=${offset} limit=${limit}`, result, result.user_ids.map(x => UserStore.get(x)));

        if (this.props.option !== option) {
            return;
        }

        const store = FileStore.getStore();
        loadUsersContent(store, result.user_ids);

        this.setState(
            {
                voters: [...voters, ...result.user_ids]
            },
            async () => {
                if (result.user_ids.length < limit && loadMore) {
                    const offset2 = offset + result.user_ids.length;

                    this.updateVoters(offset2, count, false);
                }
            }
        );
    }

    componentDidMount() {
        const { offset, count } = this.state;

        this.updateVoters(offset, count, true);
    }

    handleShowMore = () => {
        const { option } = this.props;
        const { count } = this.state;

        const newOffset = count;
        const newCount = Math.min(option.voter_count, count + POLL_RESULTS_SLICE_LENGTH);

        this.setState(
            {
                offset: newOffset,
                count: newCount
            },
            () => {
                this.updateVoters(newOffset, newCount, true);
            }
        );
    };

    handleCollapse = event => {
        event.preventDefault();
        event.stopPropagation();

        const { option } = this.props;

        const count =
            option && option.voter_count <= POLL_RESULTS_FIRST_SLICE_LENGTH
                ? option.voter_count
                : POLL_RESULTS_FIRST_SLICE_LENGTH - POLL_RESULTS_LEAVE_LENGTH;

        this.setState({
            voters: this.state.voters.slice(0, count),
            offset: 0,
            count
        });
    };

    render() {
        const { option, isQuiz, t } = this.props;
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
            ? voter_count !== 1
                ? `${voter_count} answers`
                : `${voter_count} answer`
            : voter_count !== 1
            ? `${voter_count} votes`
            : `${voter_count} vote`;

        let showMoreButton = null;
        const showMoreCount = voter_count - count;
        if (showMoreCount > 0) {
            const showMore = isQuiz
                ? showMoreCount !== 1
                    ? `${showMoreCount} answers`
                    : `${showMoreCount} answer`
                : showMoreCount !== 1
                ? `${showMoreCount} votes`
                : `${showMoreCount} vote`;

            showMoreButton = (
                <Button
                    classes={{ root: 'poll-option-results-button' }}
                    color='primary'
                    fullWidth
                    onClick={this.handleShowMore}>
                    {t('ShowVotesOT').replace('%1$d', showMore)}
                </Button>
            );
        }
        const showCollapse =
            count > POLL_RESULTS_FIRST_SLICE_LENGTH - POLL_RESULTS_LEAVE_LENGTH &&
            voter_count > POLL_RESULTS_FIRST_SLICE_LENGTH;

        return (
            <>
                <div className='poll-option-results-caption'>
                    <div className='poll-option-results-answer'>{`${text} — ${vote_percentage}%`}</div>
                    {showCollapse ? (
                        <a onClick={this.handleCollapse}>{t('PollCollapse')}</a>
                    ) : (
                        <div className='poll-option-results-count'>{voterCount}</div>
                    )}
                </div>
                {results}
                {showMoreButton}
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

export default withTranslation()(PollOptionResults);
