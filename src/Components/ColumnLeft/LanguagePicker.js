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
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import TdLibController from '../../Controllers/TdLibController';
import LocalizationStore from '../../Stores/LocalizationStore';

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

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language: event.target.value });
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    open = () => {
        this.setState({ open: true });
    };

    render() {
        const { classes, t } = this.props;
        const { open, language } = this.state;
        const info = LocalizationStore.info || { language_packs: [] };

        const languages = info.language_packs.map(x => (
            <FormControlLabel
                key={x.id}
                value={x.id}
                control={<Radio color='primary' />}
                label={`${x.name}\xa0(${x.native_name})`}
            />
        ));

        return (
            <Dialog
                open={open}
                onClose={this.handleClose}
                aria-labelledby='language-dialog-title'
                aria-describedby='language-dialog-description'>
                <DialogTitle id='language-dialog-title'>{t('Language')}</DialogTitle>
                <DialogContent>
                    <FormControl component='fieldset'>
                        <RadioGroup
                            aria-label='language'
                            name='language1'
                            value={language}
                            onChange={this.handleChange}>
                            {languages}
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
    withTranslation(),
    withStyles(styles, { withTheme: true }),
    withRestoreRef()
);

export default enhance(LanguagePicker);
