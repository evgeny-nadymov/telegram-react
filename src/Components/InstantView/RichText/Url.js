/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

class Url extends React.Component {
    render() {
        const { text, url } = this.props;

        return (
            <a href={url}>
                <RichText text={text} />
            </a>
        );
    }
}

Url.propTypes = {
    text: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired
};

export default Url;
