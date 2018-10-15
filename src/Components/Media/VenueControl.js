/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './VenueControl.css';

class VenueControl extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        let message = this.props.message;
        if (!message) return null;

        let venue = message.content.venue;
        if (!venue) return null;

        let title = venue.title;
        let address = venue.address;

        let location = message.content.venue.location;
        if (!location) return null;

        let longitude = location.longitude;
        let latitude = location.latitude;

        let source = `https://maps.google.com/?q=${latitude},${longitude}`;

        //let staticSource = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=100x100&sensor=true&format=jpg&scale=2&language=en&markers=color:red|${latitude},${longitude}`;
        let staticSource = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=200,200&z=16&l=map&scale=2.0&lang=en_US&pt=${longitude},${latitude},pm2rdm`;

        let alt = `Venue ${source}`;

        return (
            <div className='venue'>
                <a href={source} target='_blank' rel='noopener noreferrer'>
                    <img className='location-image' width='100' height='100' alt={alt} src={staticSource}/>
                </a>
                <div className='venue-content'>
                    <a href={source} target='_blank' rel='noopener noreferrer'><div className='venue-title'>{title}</div></a>
                    <div className='venue-subtitle'>{address}</div>
                </div>
            </div>
        );
    }
}

VenueControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default VenueControl;