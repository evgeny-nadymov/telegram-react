/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Location from './Location';
import './Venue.css';

class Venue extends React.Component {
    render() {
        const { chatId, messageId, venue, openMedia } = this.props;
        if (!venue) return null;

        const { title, address, location } = venue;
        if (!location) return null;

        const { longitude, latitude } = location;
        const source = `https://maps.google.com/?q=${latitude},${longitude}`;

        return (
            <div className='venue'>
                <Location chatId={chatId} messageId={messageId} location={location} openMedia={openMedia} />
                <div className='venue-content'>
                    <a href={source} target='_blank' rel='noopener noreferrer'>
                        <div className='venue-title'>{title}</div>
                    </a>
                    <div className='venue-subtitle'>{address}</div>
                </div>
            </div>
        );
    }
}

Venue.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    venue: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

export default Venue;
