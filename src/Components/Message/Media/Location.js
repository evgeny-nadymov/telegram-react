/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import RoomIcon from '@material-ui/icons/Room';
import { getLocationId } from '../../../Utils/Message';
import FileStore from '../../../Stores/FileStore';
import './Location.css';

class Location extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateLocationBlob', this.onClientUpdateLocationBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateLocationBlob', this.onClientUpdateLocationBlob);
    }

    onClientUpdateLocationBlob = update => {
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

        const { location } = message.content;
        if (!location) return null;

        const { longitude, latitude } = location;
        const locationId = getLocationId(location);
        const file = FileStore.getLocationFile(locationId);
        const blob = file ? FileStore.getBlob(file.id) || file.blob : null;
        let src = '';
        try {
            src = FileStore.getBlobUrl(blob);
        } catch (error) {
            console.log(`Location.render photo with error ${error}`);
        }
        const source = `https://maps.google.com/?q=${latitude},${longitude}`;
        //let staticSource = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=300x150&sensor=true&format=jpg&scale=2&language=en&markers=color:red|${latitude},${longitude}`;
        //let staticSource = `https://static-maps.yandex.ru/1.x/?ll=${longitude},${latitude}&size=600,300&z=16&l=map&scale=2.0&lang=en_US&pt=${longitude},${latitude},pm2rdm`;
        const alt = `${source}`;

        return (
            <a href={source} target='_blank' rel='noopener noreferrer'>
                <div className='location-wrapper'>
                    <img className='location-image' alt={alt} src={src} />
                    <div className='location-icon'>
                        <RoomIcon fontSize='large' color='primary' />
                    </div>
                </div>
            </a>
        );
    }
}

Location.propTypes = {
    message: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

export default Location;
