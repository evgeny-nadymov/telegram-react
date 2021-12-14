/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import CallIcon from '@material-ui/icons/Call';
import VideocamIcon from '@material-ui/icons/Videocam';
import { getCallContent } from '../../../Utils/Message';
import LStore from '../../../Stores/LocalizationStore';
import MessageStore from '../../../Stores/MessageStore';
import './Call.css';

class Call extends React.Component {
    render() {
        const { chatId, messageId, call, openMedia, title, meta } = this.props;
        if (!call) return null;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { duration, is_video, discard_reason } = call;
        const { sender_id, content, is_outgoing } = message;

        const callTitle = getCallContent(sender_id, content);
        const durationString = duration > 0 ? ', ' + LStore.formatCallDuration(Math.floor(duration || 0)) : '';

        return (
            <div className={classNames('call', 'document', { 'media-title': title })} onClick={openMedia}>
                {is_video ? (
                    <VideocamIcon classes={{ root: 'call-button-root' }} />
                    ) : (
                    <CallIcon classes={{ root: 'call-button-root' }} />
                )}
                <div className='document-content'>
                    <div className='document-title'>{callTitle}</div>
                    <div className='document-action'>
                        <span className={classNames({
                            'call-outgoing': is_outgoing,
                            'call-incoming': !is_outgoing,
                            'call-incoming-missed': !is_outgoing && discard_reason && discard_reason['@type'] === 'callDiscardReasonMissed'
                        })}>&#x2794;</span>
                        {meta}
                        {durationString}
                    </div>
                </div>
            </div>
        );
    }
}

Call.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    call: PropTypes.object,
    openMedia: PropTypes.func
};

export default withTranslation()(Call);
