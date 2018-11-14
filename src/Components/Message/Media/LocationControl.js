/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LocationControl.css';

class LocationControl extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        let message = this.props.message;
        if (!message) return null;

        let location = message.content.location;
        if (!location) return null;

        let longitude = location.longitude;
        let latitude = location.latitude;

        let source = `https://maps.google.com/?q=${latitude},${longitude}`;

        //let staticSource = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=300x150&sensor=true&format=jpg&scale=2&language=en&markers=color:red|${latitude},${longitude}`;
        let staticSource = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=600,300&z=16&l=map&scale=2.0&lang=en_US&pt=${longitude},${latitude},pm2rdm`;


        let alt = `Location ${source}`;

        return (
            <a href={source} target='_blank' rel='noopener noreferrer'>
                <img className='location-image' width='300' height='150' alt={alt} src={staticSource}/>
            </a>
        );
    }
}

LocationControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default LocationControl;