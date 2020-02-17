/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

export function compose(...funcs) {
    return funcs.reduce((a, b) => (...args) => a(b(...args)), arg => arg);
}

export function withSaveRef() {
    return Component => {
        return React.forwardRef((props, ref) => <Component {...props} forwardedRef={ref} />);
    };
}

export function withRestoreRef() {
    return Component => {
        return class extends React.Component {
            render() {
                const { forwardedRef, ...rest } = this.props;

                return <Component {...rest} ref={forwardedRef} />;
            }
        };
    };
}

export function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
