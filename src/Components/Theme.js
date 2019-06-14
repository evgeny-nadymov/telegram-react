/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const borderStyle = theme => ({
    borderColor: {
        borderColor: theme.palette.divider
    }
});

const accentStyles = theme => ({
    accentColorLight: {
        color: theme.palette.primary.light
    },
    accentColorDark: {
        color: theme.palette.primary.dark
    },
    accentColorMain: {
        color: theme.palette.primary.main
    },
    accentBackgroundLight: {
        background: theme.palette.primary.light
    },
    accentBackgroundDark: {
        background: theme.palette.primary.dark
    }
});

export { borderStyle, accentStyles };
