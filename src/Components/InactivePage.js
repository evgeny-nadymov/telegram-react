/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import AppInactiveControl from './Additional/AppInactiveControl';
import Footer from './Footer';

class InactivePage extends React.Component {
    render() {
        return (
            <>
                <div className='header-wrapper' />
                <div className='page'>
                    <AppInactiveControl />
                </div>
                <Footer />
            </>
        );
    }
}

export default InactivePage;
