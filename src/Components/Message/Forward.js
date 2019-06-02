/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Tooltip from '@material-ui/core/Tooltip';
import { getForwardTitle, isForwardOriginHidden } from '../../Utils/Message';
import { openUser, openChat } from '../../Actions/Client';
import './Forward.css';

function arrowGenerator(color) {
    return {
        '&[x-placement*="bottom"] $arrow': {
            top: 0,
            left: 0,
            marginTop: '-0.95em',
            width: '3em',
            height: '1em',
            '&::before': {
                borderWidth: '0 1em 1em 1em',
                borderColor: `transparent transparent ${color} transparent`
            }
        },
        '&[x-placement*="top"] $arrow': {
            bottom: 0,
            left: 0,
            marginBottom: '-0.95em',
            width: '3em',
            height: '1em',
            '&::before': {
                borderWidth: '1em 1em 0 1em',
                borderColor: `${color} transparent transparent transparent`
            }
        },
        '&[x-placement*="right"] $arrow': {
            left: 0,
            marginLeft: '-0.95em',
            height: '3em',
            width: '1em',
            '&::before': {
                borderWidth: '1em 1em 1em 0',
                borderColor: `transparent ${color} transparent transparent`
            }
        },
        '&[x-placement*="left"] $arrow': {
            right: 0,
            marginRight: '-0.95em',
            height: '3em',
            width: '1em',
            '&::before': {
                borderWidth: '1em 0 1em 1em',
                borderColor: `transparent transparent transparent ${color}`
            }
        }
    };
}

const styles = theme => ({
    forwardColor: {
        color: theme.palette.primary.main
    },
    arrowPopper: arrowGenerator(theme.palette.grey[700]),
    arrow: {
        position: 'absolute',
        fontSize: 6,
        width: '3em',
        height: '3em',
        '&::before': {
            content: '""',
            margin: 'auto',
            display: 'block',
            width: 0,
            height: 0,
            borderStyle: 'solid'
        }
    },
    tooltip: {
        margin: '6px 0 26px 0'
    }
});

class Forward extends React.Component {
    state = {
        arrowRef: null
    };

    handleArrowRef = node => {
        this.setState({
            arrowRef: node
        });
    };

    openForward = event => {
        event.stopPropagation();

        const { forwardInfo } = this.props;
        if (!forwardInfo) return null;

        const { origin } = forwardInfo;

        switch (origin['@type']) {
            case 'messageForwardOriginUser': {
                const { sender_user_id } = origin;

                openUser(sender_user_id, true);
                break;
            }
            case 'messageForwardOriginHiddenUser': {
                break;
            }
            case 'messageForwardOriginChannel': {
                const { chat_id, message_id } = origin;

                openChat(chat_id, message_id, true);
                break;
            }
        }
    };

    render() {
        const { t, classes, forwardInfo } = this.props;
        const { arrowRef } = this.state;

        const title = getForwardTitle(forwardInfo, t);
        const tooltip = isForwardOriginHidden(forwardInfo) ? (
            <>
                {t('HidAccount')}
                <span className={classes.arrow} ref={this.handleArrowRef} />
            </>
        ) : (
            ''
        );

        return (
            <div className={classNames('message-author', classes.forwardColor, 'forward')}>
                {`${t('ForwardedMessage')}\n${t('From')} `}
                <Tooltip
                    title={tooltip}
                    classes={{ popper: classes.arrowPopper, tooltip: classes.tooltip }}
                    PopperProps={{
                        popperOptions: {
                            modifiers: {
                                arrow: {
                                    enabled: Boolean(arrowRef),
                                    element: arrowRef
                                }
                            }
                        }
                    }}
                    placement='top'>
                    <a onClick={this.openForward}>{title}</a>
                </Tooltip>
            </div>
        );
    }
}

Forward.propTypes = {
    forwardInfo: PropTypes.object.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Forward);
