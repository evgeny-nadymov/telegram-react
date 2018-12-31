/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import red from '@material-ui/core/colors/red';
import orange from '@material-ui/core/colors/orange';
import yellow from '@material-ui/core/colors/yellow';
import green from '@material-ui/core/colors/green';
import blue from '@material-ui/core/colors/blue';
import indigo from '@material-ui/core/colors/indigo';
import deepPurple from '@material-ui/core/colors/deepPurple';
import Cookies from 'universal-cookie';
import TelegramApp from './TelegramApp';
import ApplicationStore from './Stores/ApplicationStore';

class ThemeWrapper extends React.Component {
    constructor(props) {
        super(props);

        const cookies = new Cookies();
        const { type, primary } = cookies.get('themeOptions') || { type: 'light', primary: blue };

        let theme = createMuiTheme({
            palette: {
                type: type,
                primary: primary,
                secondary: { main: '#FF5555' }
            },
            typography: {
                useNextVariants: true
            }
        });

        this.state = {
            theme: theme
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

        const cookies = new Cookies();
        cookies.set('themeOptions', { type: type, primary: primary });

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
