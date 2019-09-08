/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

class Anchor extends React.Component {
    render() {
        const { name, text } = this.props;

        return (
            <a id={name}>
                <RichText text={text} />
            </a>
        );
    }
}

Anchor.propTypes = {
    name: PropTypes.string.isRequired,
    text: PropTypes.object.isRequired
};

export default Anchor;
