/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Footer from './Footer';
import NativeApp from './Additional/NativeApp';

class NativeAppPage extends React.Component {
    render() {
        return (
            <>
                <div className='header-wrapper' />
                <div
                    className='page'
                    style={{
                        background: '#FFFFFF',
                        color: '#000000'
                    }}>
                    <NativeApp />
                </div>
                <Footer />
            </>
        );
    }
}

export default NativeAppPage;
