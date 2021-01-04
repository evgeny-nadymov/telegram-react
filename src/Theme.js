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
import { getBadgeSelectedColor } from './Utils/Color';
import { getDisplayName } from './Utils/HOC';
import AppStore from './Stores/ApplicationStore';

function updateLightTheme(theme) {
    // const root = document.querySelector(':root');
    // const style = getComputedStyle(root);
    const { style } = document.documentElement;

    style.setProperty('--text-primary', '#000000');
    style.setProperty('--text-secondary', '#707579');
    style.setProperty('--text-disabled', 'rgba(0, 0, 0, 0.38)');

    style.setProperty('--error', '#E53935');

    style.setProperty('--tile-size', '54px');
    style.setProperty('--tile-size-normal', '48px');
    style.setProperty('--tile-size-extra-small', '16px');
    style.setProperty('--tile-size-small', '33px');
    style.setProperty('--tile-size-big', '120px');

    style.setProperty('--z-index-modal', theme.zIndex.modal);

    style.setProperty('--color-accent-main', theme.palette.primary.main);
    style.setProperty('--color-accent-main44', theme.palette.primary.main + '44');
    style.setProperty('--color-accent-main88', theme.palette.primary.main + '88');
    style.setProperty('--color-accent-dark', theme.palette.primary.dark);
    style.setProperty('--color-accent-light', theme.palette.primary.light);
    style.setProperty('--color-grey700', theme.palette.grey[700]);
    style.setProperty('--color-grey', '#9AA7B2');
    style.setProperty('--color-hover', '#70757914');

    style.setProperty('--search-input-background', '#f4f4f5');
    style.setProperty('--search-input-icon', '#9aa7b2');

    style.setProperty('--header-color', '#000000');
    style.setProperty('--header-subtle-color', '#707579');

    style.setProperty('--badge-unmuted', '#4DCD5E');
    style.setProperty('--badge-muted', '#C4C9CC');
    style.setProperty('--badge-item-selected', getBadgeSelectedColor(theme.palette.primary.main));

    style.setProperty('--online-indicator', '#0AC630');

    style.setProperty('--message-keyboard-button', '#00000033');
    style.setProperty('--message-keyboard-button-hover', '#00000022');

    style.setProperty('--message-service-color', '#FFFFFF');
    style.setProperty('--message-service-background', '#00000033');

    style.setProperty('--panel-background', '#ffffff');
    style.setProperty('--border', '#DADCE0');
    style.setProperty('--chat-background', '#e6ebee');
    style.setProperty('--background', '#ffffff');
    style.setProperty('--background-paper', theme.palette.background.paper);
    style.setProperty('--shared-media-background', theme.palette.background.default);

    style.setProperty('--dialog-color', '#000000');
    style.setProperty('--dialog-subtle-color', '#707579');
    style.setProperty('--dialog-meta-color', '#5F6369');
    style.setProperty('--dialog-meta-read-color', '#4FAE4E');

    style.setProperty('--media-in-tile-background', theme.palette.primary.main);
    style.setProperty('--media-out-tile-background', '#4FAE4E');

    style.setProperty('--message-in-link', theme.palette.primary.main);
    style.setProperty('--message-in-author', theme.palette.primary.main);
    style.setProperty('--message-in-background', '#FFFFFF');
    style.setProperty('--message-in-color', '#000000');
    style.setProperty('--message-in-subtle-color', '#707579');
    style.setProperty('--message-in-meta-color', '#8D969C');
    style.setProperty('--message-in-reply-title', theme.palette.primary.main);
    style.setProperty('--message-in-reply-border', theme.palette.primary.main);
    style.setProperty('--message-in-control', theme.palette.primary.main);
    style.setProperty('--message-in-control-hover', theme.palette.primary.main + '22');
    style.setProperty('--message-in-control-border', theme.palette.primary.main + '77');
    style.setProperty('--message-in-control-border-hover', theme.palette.primary.main);

    style.setProperty('--message-out-link', '#4FAE4E');
    style.setProperty('--message-out-author', '#4FAE4E');
    style.setProperty('--message-out-background', '#EEFFDE');
    style.setProperty('--message-out-color', '#000000');
    style.setProperty('--message-out-subtle-color', '#4FAE4E');
    style.setProperty('--message-out-meta-color', '#4FAE4E');
    style.setProperty('--message-out-reply-title', '#4FAE4E');
    style.setProperty('--message-out-reply-border', '#4FAE4E');
    style.setProperty('--message-out-control', '#4FAE4E');
    style.setProperty('--message-out-control-hover', '#4FAE4E' + '22');
    style.setProperty('--message-out-control-border', '#4FAE4E' + '77');
    style.setProperty('--message-out-control-border-hover', '#4FAE4E');
}

function updateDarkTheme(theme) {
    // const root = document.querySelector(':root');
    // const style = getComputedStyle(root);
    const { style } = document.documentElement;

    style.setProperty('--text-primary', theme.palette.text.primary);
    style.setProperty('--text-secondary', theme.palette.text.secondary);
    style.setProperty('--text-disabled', theme.palette.text.disabled);

    style.setProperty('--error', '#E53935');

    style.setProperty('--tile-size', '54px');
    style.setProperty('--tile-size-normal', '48px');
    style.setProperty('--tile-size-extra-small', '16px');
    style.setProperty('--tile-size-small', '33px');
    style.setProperty('--tile-size-big', '120px');

    style.setProperty('--z-index-modal', theme.zIndex.modal);

    style.setProperty('--color-accent-main', theme.palette.primary.main);
    style.setProperty('--color-accent-main44', theme.palette.primary.main + '44');
    style.setProperty('--color-accent-main88', theme.palette.primary.main + '88');
    style.setProperty('--color-accent-dark', theme.palette.primary.dark);
    style.setProperty('--color-accent-light', theme.palette.primary.light);
    style.setProperty('--color-grey700', theme.palette.grey[700]);
    style.setProperty('--color-grey', '#9AA7B2');
    style.setProperty('--color-hover', 'rgba(112, 117, 121, 0.15)');

    style.setProperty('--search-input-background', '#424242');
    style.setProperty('--search-input-icon', '#fff');

    style.setProperty('--header-color', '#ffffff');
    style.setProperty('--header-subtle-color', theme.palette.text.secondary);

    style.setProperty('--badge-unmuted', '#4DCD5E');
    style.setProperty('--badge-muted', '#979797');
    style.setProperty('--badge-item-selected', getBadgeSelectedColor(theme.palette.primary.main));

    style.setProperty('--online-indicator', '#0AC630');

    style.setProperty('--message-keyboard-button', '#303030');
    style.setProperty('--message-keyboard-button-hover', '#30303088');

    style.setProperty('--message-service-color', '#FFFFFF');
    style.setProperty('--message-service-background', '#303030');

    style.setProperty('--panel-background', '#303030');
    style.setProperty('--border', theme.palette.divider);
    style.setProperty('--chat-background', theme.palette.grey[900]);
    style.setProperty('--background', theme.palette.grey[900]);
    style.setProperty('--background-paper', theme.palette.background.paper);
    style.setProperty('--shared-media-background', theme.palette.background.paper);

    style.setProperty('--dialog-color', '#ffffff');
    style.setProperty('--dialog-subtle-color', theme.palette.text.secondary);
    style.setProperty('--dialog-meta-color', theme.palette.text.secondary);
    style.setProperty('--dialog-meta-read-color', '#4FAE4E');

    style.setProperty('--media-in-tile-background', theme.palette.primary.main);
    style.setProperty('--media-out-tile-background', theme.palette.primary.main);

    style.setProperty('--message-in-link', theme.palette.primary.main);
    style.setProperty('--message-in-author', theme.palette.primary.main);
    style.setProperty('--message-in-background', '#303030'); // background.default
    style.setProperty('--message-in-color', '#FFFFFF');
    style.setProperty('--message-in-subtle-color', 'rgba(255, 255, 255, 0.7)');
    style.setProperty('--message-in-meta-color', 'rgba(255, 255, 255, 0.7)');
    style.setProperty('--message-in-reply-title', theme.palette.primary.main);
    style.setProperty('--message-in-reply-border', theme.palette.primary.main);
    style.setProperty('--message-in-control', theme.palette.primary.main);
    style.setProperty('--message-in-control-hover', theme.palette.primary.main + '22');
    style.setProperty('--message-in-control-border', theme.palette.primary.main + '77');
    style.setProperty('--message-in-control-border-hover', theme.palette.primary.main);

    style.setProperty('--message-out-link', theme.palette.primary.main);
    style.setProperty('--message-out-author', theme.palette.primary.main);
    style.setProperty('--message-out-background', '#303030'); // background.default
    style.setProperty('--message-out-color', '#FFFFFF');
    style.setProperty('--message-out-subtle-color', 'rgba(255, 255, 255, 0.7)');
    style.setProperty('--message-out-meta-color', 'rgba(255, 255, 255, 0.7)'); // text.secondary
    style.setProperty('--message-out-reply-title', theme.palette.primary.main);
    style.setProperty('--message-out-reply-border', theme.palette.primary.main);
    style.setProperty('--message-out-control', theme.palette.primary.main);
    style.setProperty('--message-out-control-hover', theme.palette.primary.main + '22');
    style.setProperty('--message-out-control-border', theme.palette.primary.main + '77');
    style.setProperty('--message-out-control-border-hover', theme.palette.primary.main);
}

function getSystemThemeType() {
    if (window.matchMedia) {
        if(window.matchMedia('(prefers-color-scheme: dark)').matches){
            return 'dark';
        } else {
            return 'light';
        }
    }
    return 'light';
}

function createTheme(type, primary) {
    if (type === 'default') {
        type = getSystemThemeType();
    }

    let MuiTouchRipple = {};
    let action = {};
    if (type === 'light') {
        MuiTouchRipple = {
            child: {
                color: type === 'dark' ? 'currentColor' : 'rgba(112, 117, 121)'
            },
            rippleVisible: {
                opacity: 0.08 //type === 'dark' ? 0.15 : 1
            },
            '@keyframes enter': {
                '0%': {
                    transform: 'scale(0)',
                    opacity: 0.03
                },
                '100%': {
                    transform: 'scale(1)',
                    opacity: 0.08 //type === 'dark' ? 0.15 : 1
                }
            }
        };
        action = {
            hover: 'rgba(112, 117, 121, 0.08)',
            hoverOpacity: 0.08
        };
    }

    const theme = createMuiTheme({
        palette: {
            type: type,
            primary: primary,
            secondary: { main: '#E53935' },
            action
        },
        typography: {
            useNextVariants: true
        },
        shape: {
            borderRadius: 10
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
            },
            MuiButton: {
                root: {
                    padding: '12px 16px 11px',
                    fontSize: 16,
                    lineHeight: 'normal'
                }
            },
            MuiMenuList: {
                root: {
                    minWidth: 150
                }
            },
            MuiList: {
                root: {
                    minWidth: 150
                }
            },
            MuiListItemIcon: {
                root: {
                    minWidth: 40
                },
                alignItemsFlexStart: {
                    marginTop: 6
                }
            },
            // MuiListItemText: {
            //     root: {
            //         marginTop: 0,
            //         marginBottom: 0
            //     }
            // },
            // MuiListItem: {
            //     root: {
            //         paddingTop: 10,
            //         paddingBottom: 10
            //     }
            // },
            MuiMenuItem: {
                root: {
                    paddingTop: 10,
                    paddingBottom: 10
                }
            },
            MuiTouchRipple,
            MuiSnackbarContent: {
                root: {
                    flexWrap: 'nowrap',
                    fontSize: 'inherit'
                },
                message: {
                    maxWidth: 512
                }
            }
        }
    });

    if (type === 'dark') {
        updateDarkTheme(theme);
    } else {
        updateLightTheme(theme);
    }

    return theme;
}

function withTheme(WrappedComponent) {
    class ThemeWrapper extends React.Component {
        constructor(props) {
            super(props);

            let { type, primary } = { type: 'light', primary: { main: '#50A2E9' } };
            try {
                const themeOptions = JSON.parse(localStorage.getItem('themeOptions'));
                if (themeOptions) {
                    type = themeOptions.type;
                    primary = themeOptions.primary;
                }
            } catch {}
            const theme = createTheme(type, primary);

            this.state = { theme };

            if (window.matchMedia) {
                const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                colorSchemeQuery.addEventListener('change', this.onSystemThemeChange);
            }
        }

        onSystemThemeChange = () => {
            let { type, primary } = { type: 'light', primary: { main: '#50A2E9' } };
            try {
                const themeOptions = JSON.parse(localStorage.getItem('themeOptions'));
                if (themeOptions && themeOptions.type !== 'default') {
                    return;
                }
                type = themeOptions.type;
                primary = themeOptions.primary;
            } catch {}

            const theme = createTheme(type, primary);
            this.setState({ theme }, () => AppStore.emit('clientUpdateThemeChange'));
        };

        componentDidMount() {
            AppStore.on('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        componentWillUnmount() {
            AppStore.off('clientUpdateThemeChanging', this.onClientUpdateThemeChanging);
        }

        onClientUpdateThemeChanging = update => {
            const { type, primary } = update;

            const theme = createTheme(type, primary);
            localStorage.setItem('themeOptions', JSON.stringify({ type, primary }));

            this.setState({ theme }, () => AppStore.emit('clientUpdateThemeChange'));
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
