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
import LinearProgress from '@material-ui/core/LinearProgress';
import CheckIcon from '../../../Assets/Icons/Check';
import CloseIcon from '../../../Assets/Icons/Close';
import PollRadio from './PollRadio';
import PollPercentage from './PollPercentage';
import './PollOption.css';

class PollOption extends React.Component {
    getTitleString = (count, t = key => key) => {
        const { canBeSelected } = this.props;
        if (canBeSelected) return null;

        if (!count) return t('NoVotes').toLowerCase();
        if (count === 1) return '1 vote';

        return count + ' votes';
    };

    handleClick = event => {
        const { canBeSelected, onVote } = this.props;
        if (!canBeSelected) return;

        event.stopPropagation();

        onVote();
    };

    render() {
        const { option, onChange, canBeSelected, closed, maxVoterCount, t, type, isCorrect } = this.props;
        if (!option) return null;

        const { text, voter_count, vote_percentage, is_chosen, isMultiChoosen, is_being_chosen } = option;

        let value = 1.5;
        if (voter_count) {
            value = (voter_count / maxVoterCount) * 100;
        }

        return (
            <div className='poll-option' onClick={this.handleClick}>
                <div
                    className={classNames(
                        'poll-option-wrapper',
                        canBeSelected ? 'poll-option-unselected' : 'poll-option-selected'
                    )}>
                    <div className='poll-option-text-wrapper' title={this.getTitleString(voter_count, t)}>
                        <PollPercentage value={vote_percentage} chosen={is_chosen} closed={closed} />
                        <PollRadio
                            hidden={!canBeSelected}
                            chosen={is_chosen || isMultiChoosen}
                            beingChosen={is_being_chosen}
                            onChange={onChange}
                        />
                        {(is_chosen || isCorrect) && (
                            <div
                                className={classNames(
                                    'poll-option-mark',
                                    { 'poll-option-mark-correct': type === 'correct' },
                                    { 'poll-option-mark-incorrect': type === 'incorrect' }
                                )}>
                                {type === 'incorrect' ? (
                                    <CloseIcon className='poll-option-mark-icon' />
                                ) : (
                                    <CheckIcon className='poll-option-mark-icon' />
                                )}
                            </div>
                        )}
                        <div className='poll-option-text'>{text}</div>
                    </div>
                </div>
                <LinearProgress
                    classes={{
                        root: 'poll-option-progress-root',
                        bar: classNames(
                            'poll-option-progress-bar',
                            { 'poll-option-progress-bar-correct': type === 'correct' },
                            { 'poll-option-progress-bar-incorrect': type === 'incorrect' }
                        )
                    }}
                    color='primary'
                    variant='determinate'
                    value={canBeSelected ? 0 : Math.max(1.5, value)}
                />
            </div>
        );
    }
}

PollOption.propTypes = {
    type: PropTypes.oneOf(['regular', 'correct', 'incorrect']).isRequired,
    option: PropTypes.object.isRequired,
    onVote: PropTypes.func.isRequired,
    canBeSelected: PropTypes.bool,
    closed: PropTypes.bool,
    maxVoterCount: PropTypes.number
};

export default withTranslation()(PollOption);
