/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { SnackbarProvider } from 'notistack';
import { getDisplayName } from './Utils/HOC';
import { MAX_SNACK } from './Constants';

function withSnackbarNotifications(WrappedComponent) {
    class NotificationsWrapper extends React.Component {
        render() {
            return (
                <SnackbarProvider maxSnack={MAX_SNACK}>
                    <WrappedComponent {...this.props} />
                </SnackbarProvider>
            );
        }
    }
    NotificationsWrapper.displayName = `WithSnackbarNotifications(${getDisplayName(WrappedComponent)})`;

    return NotificationsWrapper;
}

export default withSnackbarNotifications;
