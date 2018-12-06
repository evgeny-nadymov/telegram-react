/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getVenueId } from '../../../Utils/Message';
import FileStore from '../../../Stores/FileStore';
import './VenueControl.css';

class VenueControl extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount() {
        FileStore.on('clientUpdateLocationBlob', this.onClientUpdateLocationBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateLocationBlob', this.onClientUpdateLocationBlob);
    }

    onClientUpdateLocationBlob = (update) => {
        const { message } = this.props;
        if (!message) return;
        const { chatId, messageId } = update;

        if (message.chat_id === chatId && message.id === messageId) {
            this.forceUpdate();
        }
    };

    render() {
        const { message } = this.props;
        if (!message) return null;

        const { venue } = message.content;
        if (!venue) return null;

        const { title, address, location } = venue;
        if (!location) return null;

        const { longitude, latitude } = location;
        const locationId = getVenueId(location);
        const file = FileStore.getLocationFile(locationId);
        let src = '';
        try {
            src = FileStore.getBlobUrl(file.blob);
        }
        catch (error) {
            console.log(`VenueControl.render photo with error ${error}`);
        }
        const source = `https://maps.google.com/?q=${latitude},${longitude}`;
        //let staticSource = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=100x100&sensor=true&format=jpg&scale=2&language=en&markers=color:red|${latitude},${longitude}`;
        const staticSource = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=600,300&z=16&l=map&scale=2.0&lang=en_US&pt=${longitude},${latitude},pm2rdm`;
        const alt = `Venue ${source}`;

        return (
            <div className='venue'>
                <a href={source} target='_blank' rel='noopener noreferrer'>
                    <img className='location-image' width='300' height='150' alt={alt} src={staticSource}/>
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