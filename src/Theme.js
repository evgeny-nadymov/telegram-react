/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import blue from '@material-ui/core/colors/blue';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import { StylesProvider } from '@material-ui/core/styles';
import { getDisplayName } from './Utils/HOC';
import Cookies from 'universal-cookie';
import ApplicationStore from './Stores/ApplicationStore';

function updateLightTheme() {
    const { style } = document.documentElement;

    style.setProperty('--badge-green', '#4DCD5E');
    style.setProperty('--badge-gray', '#C4C9CC');

    style.setProperty('--indicator-green', '#0AC630');

    style.setProperty('--day-color', '#FFFFFF');
    style.setProperty('--day-background', '#00000033');
}

function updateDarkTheme() {
    const { style } = document.documentElement;

    style.setProperty('--badge-green', '#4DCD5E');
    style.setProperty('--badge-gray', 'rgba(255, 255, 255, 0.5)');

    style.setProperty('--indicator-green', '#0AC630');

    style.setProperty('--day-color', '#FFFFFF');
    style.setProperty('--day-background', '#303030');
}

function createTheme(type, primary) {
    if (type === 'dark') {
        updateDarkTheme();
    } else {
        updateLightTheme();
    }

    return createMuiTheme({
        palette: {
            type: type,
            primary: primary,
            secondary: { main: '#E53935' }
        },
        typography: {
            useNextVariants: true
        },
        shape: {
            borderRadius: 8
        },
        overrides: {
            MuiOutlinedInput: {
                input: {
                    padding: '17.5px 14px'
                }
            },
            MuiAutocomplete: {
                option: {
                    paddingLeft: 0,
                    paddingTop: 0,
                    paddingRight: 0,
                    paddingBottom: 0
                },
                paper: {
                    '& > ul': {
                        maxHeight: 56 * 5.5
                    }
                }
            }
        }
    });
}

function withTheme(WrappedComponent) {
    class ThemeWrapper extends React.Component {
        constructor(props) {
            super(props);

            const cookies = new Cookies();
            const { type, primary } = cookies.get('themeOptions') || { type: 'light', primary: { main: '#5B8AF1' } };
            const theme = createTheme(type, primary);

            this.state = { theme };
        }

        componentDidMount() {
            ApplicationStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        componentWillUnmount() {
            ApplicationStore.off('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        onClientUpdateThemeChanging = update => {
            const { type, primary } = update;

            const theme = createTheme(type, primary);
            const cookies = new Cookies();
            cookies.set('themeOptions', { type: type, primary: primary });

            this.setState({ theme }, () => ApplicationStore.emit('clientUpdateThemeChange'));
        };

        render() {
            const { theme } = this.state;

            return (
                <StylesProvider injectFirst={true}>
                    <MuiThemeProvider theme={theme}>
                        <WrappedComponent {...this.props} />
                    </MuiThemeProvider>
                </StylesProvider>
            );
        }
    }
    ThemeWrapper.displayName = `WithTheme(${getDisplayName(WrappedComponent)})`;

    return ThemeWrapper;
}

export default withTheme;
