/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

export default function createSvgIcon(path, displayName) {
    const Component = React.memo(
        React.forwardRef((props, ref) => (
            <SvgIcon data-mui-test={`${displayName}Icon`} ref={ref} {...props}>
                {path}
            </SvgIcon>
        ))
    );

    if (process.env.NODE_ENV !== 'production') {
        Component.displayName = `${displayName}Icon`;
    }

    Component.muiName = SvgIcon.muiName;

    return Component;
}
