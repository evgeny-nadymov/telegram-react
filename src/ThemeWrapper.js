/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TelegramApp from './TelegramApp';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import blue from '@material-ui/core/colors/blue';
import ApplicationStore from './Stores/ApplicationStore';

const lightTheme = createMuiTheme({
    palette: {
        type: 'light',
        primary: blue,
        // primary: { main: '#3B9EDB' },
        secondary: { main: '#FF5555' }
    },
    typography: {
        useNextVariants: true
    }
});

const darkTheme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: green,
        secondary: { main: '#FF5555' }
    },
    typography: {
        useNextVariants: true
    }
});

class ThemeWrapper extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            theme: lightTheme
        };
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
    }

    onClientUpdateThemeChanging = update => {
        const { type, primary } = update;

        const theme = createMuiTheme({
            palette: {
                type: type,
                primary: primary,
                secondary: { main: '#FF5555' },
                typography: {
                    useNextVariants: true
                }
            }
        });

        this.setState({ theme: theme }, () => ApplicationStore.emit('clientUpdateThemeChange'));
    };

    render() {
        const { theme } = this.state;

        return (
            <MuiThemeProvider theme={theme}>
                <TelegramApp />
            </MuiThemeProvider>
        );
    }
}

export default ThemeWrapper;
