/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import DocumentTile from '../../Tile/DocumentTile';
import CallIcon from '@material-ui/icons/Call';
import { getCallTitle } from '../../../Utils/Media';
import './Call.css';
import DoneIcon from '@material-ui/core/SvgIcon/SvgIcon';
import IconButton from '@material-ui/core/IconButton';
import { getDurationString } from '../../../Utils/Common';

class Call extends React.Component {
    render() {
        const { chatId, messageId, duration, openMedia } = this.props;

        const title = getCallTitle(chatId, messageId);
        const durationString = getDurationString(Math.floor(duration || 0));

        return (
            <div className='document'>
                <IconButton color='primary' aria-label='Call'>
                    <CallIcon fontSize='large' />
                </IconButton>
                <div className='document-content'>
                    <div className='document-title'>{title}</div>
                    <div className='document-action'>{durationString}</div>
                </div>
            </div>
        );
    }
}

Call.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    openMedia: PropTypes.func
};

export default Call;
