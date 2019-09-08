/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';

class Texts extends React.Component {
    render() {
        const { texts } = this.props;

        return (
            <>
                {texts.map(x => (
                    <RichText text={x} />
                ))}
            </>
        );
    }
}

Texts.propTypes = {
    texts: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Texts;
