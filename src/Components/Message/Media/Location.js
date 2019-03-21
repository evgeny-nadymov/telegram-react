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
import { getSrc } from '../../../Utils/File';
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
        const { fileId } = update;
        const { location } = this.props;

        const locationId = getLocationId(location);
        const file = FileStore.getLocationFile(locationId);
        if (!file) return;

        if (file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { location } = this.props;
        if (!location) return null;

        const locationId = getLocationId(location);
        const file = FileStore.getLocationFile(locationId);
        const src = getSrc(file);

        const { longitude, latitude } = location;
        const source = `https://maps.google.com/?q=${latitude},${longitude}`;

        return (
            <a href={source} target='_blank' rel='noopener noreferrer'>
                <div className='location-wrapper'>
                    <img className='location-image' draggable={false} alt={source} src={src} />
                    <div className='location-icon'>
                        <RoomIcon fontSize='large' color='primary' />
                    </div>
                </div>
            </a>
        );
    }
}

Location.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    location: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

export default Location;
