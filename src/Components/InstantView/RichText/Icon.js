/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Document from '../../Message/Media/Document';
import RichText from './RichText';

class Icon extends React.Component {
    render() {
        const { document, height, width } = this.props;

        return <Document document={document} height={height} width={width} />;
    }
}

Icon.propTypes = {
    document: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
};

export default Icon;
