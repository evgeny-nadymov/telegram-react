/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from '../../Utils/HOC';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import withTheme from '@mui/styles/withTheme';
import { withTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import red from '@mui/material/colors/red';
import orange from '@mui/material/colors/orange';
import amber from '@mui/material/colors/amber';
import green from '@mui/material/colors/green';
import blue from '@mui/material/colors/blue';
import indigo from '@mui/material/colors/indigo';
import deepPurple from '@mui/material/colors/deepPurple';
import { modalManager } from '../../Utils/Modal';
import ApplicationStore from '../../Stores/ApplicationStore';
import './ThemePicker.css';

class ThemePicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            type: this.props.theme.palette.type,
            color: this.getColorString(this.props.theme.palette.primary.main)
        };
    }

    handleChange = event => {
        this.setState({ type: event.target.value });

        ApplicationStore.emit('clientUpdateThemeChanging', {
            type: event.target.value,
            primary: this.getColor(this.state.color)
        });
    };

    handleAccentChange = event => {
        this.setState({ color: event.target.value });

        ApplicationStore.emit('clientUpdateThemeChanging', {
            type: this.state.type,
            primary: this.getColor(event.target.value)
        });
    };

    getColorString = value => {
        switch (value) {
            case red['500']:
                return 'red';
            case orange['500']:
                return 'orange';
            case amber['500']:
                return 'amber';
            case green['500']:
                return 'green';
            case '#50A2E9':
                return 'blue';
            case indigo['500']:
                return 'indigo';
            case deepPurple['500']:
                return 'deepPurple';
        }

        return null;
    };

    getColor = value => {
        switch (value) {
            case 'red':
                return red;
            case 'orange':
                return orange;
            case 'amber':
                return amber;
            case 'green':
                return green;
            case 'blue':
                return { main: '#50A2E9' };
            case 'indigo':
                return indigo;
            case 'deepPurple':
                return deepPurple;
        }

        return null;
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    open = () => {
        this.setState({ open: true });
    };

    render() {
        const { t } = this.props;
        const { type, color, open } = this.state;

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={open}
                onClose={this.handleClose}
                aria-labelledby='alert-dialog-title'
                aria-describedby='alert-dialog-description'>
                <DialogTitle id='alert-dialog-title'>{t('Appearance')}</DialogTitle>
                <DialogContent>
                    <FormControl component='fieldset' className='theme-picker-form'>
                        <FormLabel focused component='legend'>
                            {t('Theme')}
                        </FormLabel>
                        <RadioGroup
                            aria-label='theme'
                            name='theme1'
                            className='theme-picker-group'
                            value={type}
                            onChange={this.handleChange}>
                            <FormControlLabel value='light' control={<Radio color='primary' />} label='Light' />
                            <FormControlLabel value='dark' control={<Radio color='primary' />} label='Dark' />
                        </RadioGroup>
                    </FormControl>
                    <FormControl component='fieldset' className='theme-picker-form'>
                        <FormLabel focused component='legend'>
                            {t('Accent')}
                        </FormLabel>
                        <RadioGroup
                            aria-label='accent'
                            name='accent1'
                            className='theme-picker-group'
                            value={color}
                            onChange={this.handleAccentChange}>
                            <FormControlLabel
                                value='red'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-red'
                                        }}
                                    />
                                }
                                label='Red'
                            />
                            <FormControlLabel
                                value='orange'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-orange'
                                        }}
                                    />
                                }
                                label='Orange'
                            />
                            <FormControlLabel
                                value='amber'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-amber'
                                        }}
                                    />
                                }
                                label='Amber'
                            />
                            <FormControlLabel
                                value='green'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-green'
                                        }}
                                    />
                                }
                                label='Green'
                            />
                            <FormControlLabel
                                value='blue'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-blue'
                                        }}
                                    />
                                }
                                label='Blue'
                            />
                            <FormControlLabel
                                value='indigo'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-indigo'
                                        }}
                                    />
                                }
                                label='Indigo'
                            />
                            <FormControlLabel
                                value='deepPurple'
                                control={
                                    <Radio
                                        color='primary'
                                        classes={{
                                            root: 'theme-picker-deep-purple'
                                        }}
                                    />
                                }
                                label='Deep Purple'
                            />
                        </RadioGroup>
                    </FormControl>
                </DialogContent>
            </Dialog>
        );
    }
}

ThemePicker.propTypes = {};

const enhance = compose(
    withSaveRef(),
    withTheme,
    withTranslation(),
    withRestoreRef()
);

export default enhance(ThemePicker);
