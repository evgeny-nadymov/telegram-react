/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from 'recompose';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import UnreadSeparator from './UnreadSeparator';
import Photo from './Media/Photo';
import { openMedia } from '../../Utils/Message';
import { getServiceMessageContent } from '../../Utils/ServiceMessage';
import MessageStore from '../../Stores/MessageStore';
import './ServiceMessage.css';

const chatPhotoStyle = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    margin: '0 auto 5px'
};

const styles = theme => ({
    '@keyframes highlighted': {
        from: { backgroundColor: theme.palette.primary.main + '22' },
        to: { backgroundColor: 'transparent' }
    },
    messageHighlighted: {
        animation: '$highlighted 4s ease-out'
    },
    serviceMessageContent: {
        color: theme.palette.text.secondary
    }
});

class ServiceMessage extends React.Component {
    constructor(props) {
        super(props);

        if (process.env.NODE_ENV !== 'production') {
            const { chatId, messageId } = this.props;
            this.state = {
                message: MessageStore.get(chatId, messageId),
                highlighted: false
            };
        } else {
            this.state = {
                highlighted: false
            };
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, sendingState, showUnreadSeparator, theme } = this.props;
        const { highlighted } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.messageId !== messageId) {
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
    }

    onClientUpdateMessageHighlighted = update => {
        const { chatId, messageId } = this.props;
        const { selected, highlighted } = this.state;

        if (selected) return;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (highlighted) {
                this.setState({ highlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true });
                    }, 0);
                });
            } else {
                this.setState({ highlighted: true });
            }
        } else if (highlighted) {
            this.setState({ highlighted: false });
        }
    };

    handleAnimationEnd = () => {
        this.setState({ highlighted: false });
    };

    openMedia = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { chatId, messageId } = this.props;

        openMedia(chatId, messageId);
    };

    render() {
        const { classes, chatId, messageId, showUnreadSeparator } = this.props;
        const { highlighted } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty service message]</div>;

        const { content } = message;
        if (!content) return <div>[empty service message]</div>;

        const { photo } = content;

        const text = getServiceMessageContent(message, true);

        const messageClassName = classNames('service-message', { [classes.messageHighlighted]: highlighted });

        return (
            <div className={messageClassName} onAnimationEnd={this.handleAnimationEnd}>
                {showUnreadSeparator && <UnreadSeparator />}
                <div className='service-message-wrapper'>
                    <div className={classNames('service-message-content', classes.serviceMessageContent)}>
                        <div>{text}</div>
                    </div>
                </div>
                {photo && (
                    <Photo
                        chatId={chatId}
                        messageId={messageId}
                        photo={photo}
                        style={chatPhotoStyle}
                        openMedia={this.openMedia}
                    />
                )}
            </div>
        );
    }
}

const enhance = compose(
    withSaveRef(),
    withStyles(styles, { withTheme: true }),
    withTranslation(),
    withRestoreRef()
);

export default enhance(ServiceMessage);
