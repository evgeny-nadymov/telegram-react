/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Radio from '@material-ui/core/Radio';
import CircularProgress from '@material-ui/core/CircularProgress';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import './PollRadio.css';

const styles = {
    progressRoot: {
        position: 'absolute',
        top: 8,
        left: 8,
        pointerEvents: 'none'
    },
    radioRoot: {
        padding: 6
    },
    icon: {
        color: 'transparent'
    }
};

class PollRadio extends React.Component {
    render() {
        const { classes, chosen, beingChosen, hidden, onChange } = this.props;

        return (
            <div className={classNames('poll-radio', { 'poll-radio-hidden': hidden })}>
                <Radio
                    classes={{ root: classes.radioRoot }}
                    color='primary'
                    checked={chosen || beingChosen}
                    onChange={onChange}
                    checkedIcon={<RadioButtonCheckedIcon classes={{ root: beingChosen ? classes.icon : null }} />}
                />
                {beingChosen && <CircularProgress size={20} thickness={4.4} classes={{ root: classes.progressRoot }} />}
            </div>
        );
    }
}

PollRadio.propTypes = {
    chosen: PropTypes.bool.isRequired,
    beingChosen: PropTypes.bool.isRequired,
    hidden: PropTypes.bool
};

export default withStyles(styles)(PollRadio);
