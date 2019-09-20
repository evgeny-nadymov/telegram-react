/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RichText from './RichText';
import SafeLink from '../../Additional/SafeLink';
import TdLibController from '../../../Controllers/TdLibController';

class Url extends React.Component {
    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();

        const { url } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateInstantViewUrl',
            url
        });
    };

    render() {
        const { text, url } = this.props;

        return (
            <SafeLink url={url} onClick={this.handleClick}>
                <RichText text={text} />
            </SafeLink>
        );
    }
}

Url.propTypes = {
    text: PropTypes.object.isRequired,
    url: PropTypes.string.isRequired
};

export default Url;
