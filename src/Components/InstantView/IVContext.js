/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getDisplayName } from '../../Utils/HOC';

const IVContext = React.createContext(null);

export default IVContext;

export function withIV(Component) {
    class IVComponent extends React.Component {
        render() {
            return <IVContext.Consumer>{value => <Component iv={value} {...this.props} />}</IVContext.Consumer>;
        }
    }
    IVComponent.displayName = `WithIV(${getDisplayName(Component)})`;

    return IVComponent;
}
