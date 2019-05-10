/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import RadioGroup from '@material-ui/core/RadioGroup';
import PollOption from './PollOption';
import TdLibController from '../../../Controllers/TdLibController';
import './Poll.css';

const styles = theme => ({});

class Poll extends React.Component {
    getTotalVoterCountString = (count, t = key => key) => {
        if (!count) return t('NoVotes');
        if (count === 1) return '1 vote';

        return count + ' votes';
    };

    handleChoose = index => {
        const { chatId, messageId } = this.props;

        TdLibController.send({
            '@type': 'setPollAnswer',
            chat_id: chatId,
            message_id: messageId,
            option_ids: [index]
        });
    };

    render() {
        const { poll, t } = this.props;
        const { question, options, total_voter_count, is_closed } = poll;

        const canBeSelected = !is_closed && options.every(x => !x.is_chosen);
        const maxVoterCount = Math.max(...options.map(x => x.voter_count));

        return (
            <div className='poll'>
                <div className='poll-question'>
                    <span className='poll-question-title'>{question}</span>
                    <span className='subtitle'>{is_closed ? t('FinalResults') : t('AnonymousPoll')}</span>
                </div>
                <div className='poll-options'>
                    {options.map((x, index) => (
                        <PollOption
                            key={index}
                            option={x}
                            canBeSelected={canBeSelected}
                            maxVoterCount={maxVoterCount}
                            onChange={() => this.handleChoose(index)}
                        />
                    ))}
                </div>
                <div className='poll-total-count subtitle'>{this.getTotalVoterCountString(total_voter_count, t)}</div>
            </div>
        );
    }
}

Poll.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    poll: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Poll);
