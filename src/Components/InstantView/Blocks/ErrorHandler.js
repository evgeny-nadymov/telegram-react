/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import './ErrorHandler.css';

class ErrorHandler extends React.Component {
    state = {
        error: null,
        errorInfo: null
    };

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
    }

    render() {
        const { children } = this.props;
        const { error, errorInfo } = this.state;
        if (error || errorInfo) {
            return (
                <div className='error-handler'>
                    <span>
                        <pre>
                            {`${error.name}: ${error.message}`}
                            {errorInfo.componentStack}
                        </pre>
                    </span>
                </div>
            );
        }

        return children;
    }
}

export default ErrorHandler;
