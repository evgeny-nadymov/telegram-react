/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import LinearProgress from '@material-ui/core/LinearProgress';
import PollRadio from './PollRadio';
import PollPercentage from './PollPercentage';
import { borderStyle } from '../../Theme';
import './PollOption.css';

const styles = theme => ({
    progressRoot: {
        backgroundColor: 'transparent',
        margin: '2px 0 0 38px',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0
    },
    progressBar: {
        transition: 'transform .2s linear'
    },
    ...borderStyle(theme)
});

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

    handleCancel = event => {
        const { onUnvote } = this.props;

        event.stopPropagation();

        onUnvote();
    };

    render() {
        const { classes, option, onChange, canBeSelected, closed, maxVoterCount, t } = this.props;
        if (!option) return null;

        const { text, voter_count, vote_percentage, is_chosen, is_being_chosen } = option;

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
                        <PollPercentage
                            value={vote_percentage}
                            chosen={is_chosen}
                            closed={closed}
                            onClick={this.handleCancel}
                        />
                        <PollRadio
                            hidden={!canBeSelected}
                            chosen={is_chosen}
                            beingChosen={is_being_chosen}
                            onChange={onChange}
                        />
                        <div className='poll-option-text'>{text}</div>
                    </div>
                </div>
                <div className={classNames('poll-option-bottom-border', { [classes.borderColor]: canBeSelected })} />
                <LinearProgress
                    classes={{ root: classes.progressRoot, bar: classes.progressBar }}
                    color='primary'
                    variant='determinate'
                    value={canBeSelected ? 0 : Math.max(1.5, value)}
                />
            </div>
        );
    }
}

PollOption.propTypes = {
    option: PropTypes.object.isRequired,
    onVote: PropTypes.func.isRequired,
    onUnvote: PropTypes.func.isRequired,
    canBeSelected: PropTypes.bool,
    closed: PropTypes.bool,
    maxVoterCount: PropTypes.number
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(PollOption);
