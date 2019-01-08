/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import { withNamespaces } from 'react-i18next';
import { compose } from 'recompose';
import ApplicationStore from '../../Stores/ApplicationStore';

const styles = theme => ({
    formControl: {
        margin: theme.spacing.unit * 3
    },
    group: {
        margin: `${theme.spacing.unit}px 0`
    }
});

class LanguagePicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            language: props.lng || 'en'
        };
    }

    handleChange = event => {
        this.setState({ language: event.target.value });

        ApplicationStore.emit('clientUpdateLanguageChanging', {
            language: event.target.value
        });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    open = () => {
        this.setState({ open: true });
    };

    render() {
        const { classes } = this.props;
        const { open, language } = this.state;

        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                aria-labelledby='language-dialog-title'
                aria-describedby='language-dialog-description'>
                <DialogTitle id='language-dialog-title'>Language</DialogTitle>
                <DialogContent>
                    <FormControl component='fieldset'>
                        <RadioGroup
                            aria-label='language'
                            name='language1'
                            value={language}
                            onChange={this.handleChange}>
                            <FormControlLabel value='en' control={<Radio color='primary' />} label='English' />
                            <FormControlLabel value='ru' control={<Radio color='primary' />} label='Russian' />
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
            </Dialog>
        );
    }
}

LanguagePicker.propTypes = {};

function withSaveRef() {
    return Component => {
        return React.forwardRef((props, ref) => <Component {...props} forwardedRef={ref} />);
    };
}

function withRestoreRef() {
    return Component => {
        return class extends React.Component {
            render() {
                const { forwardedRef, ...rest } = this.props;

                return <Component {...rest} ref={forwardedRef} />;
            }
        };
    };
}

const enhance = compose(
    withSaveRef(),
    withNamespaces(),
    withStyles(styles, { withTheme: true }),
    withRestoreRef()
);

export default enhance(LanguagePicker);
