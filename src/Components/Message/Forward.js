/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import Tooltip from '@material-ui/core/Tooltip';
import { getForwardTitle, isForwardOriginHidden } from '../../Utils/Message';
import { openUser, openChat } from '../../Actions/Client';
import './Forward.css';

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

                openChat(chat_id, message_id);
                break;
            }
        }
    };

    render() {
        const { t, forwardInfo } = this.props;
        const { arrowRef } = this.state;

        const title = getForwardTitle(forwardInfo, t);
        const tooltip = isForwardOriginHidden(forwardInfo) ? (
            <>
                {t('HidAccount')}
                <span className='forward-arrow' ref={this.handleArrowRef} />
            </>
        ) : (
            ''
        );

        return (
            <div className={classNames('message-author', 'forward')}>
                <div>{t('ForwardedMessage')}</div>
                <div className='forward-subtitle'>
                    {t('From') + ' '}
                    {/*<Tooltip*/}
                    {/*    title={tooltip}*/}
                    {/*    classes={{ popper: 'forward-arrow-popper', tooltip: 'forward-tooltip' }}*/}
                    {/*    PopperProps={{*/}
                    {/*        popperOptions: {*/}
                    {/*            modifiers: {*/}
                    {/*                arrow: {*/}
                    {/*                    enabled: Boolean(arrowRef),*/}
                    {/*                    element: arrowRef*/}
                    {/*                }*/}
                    {/*            }*/}
                    {/*        }*/}
                    {/*    }}*/}
                    {/*    placement='top'>*/}
                        <a onClick={this.openForward}>{title}</a>
                    {/*</Tooltip>*/}
                </div>
            </div>
        );
    }
}

Forward.propTypes = {
    forwardInfo: PropTypes.object.isRequired
};

export default withTranslation()(Forward);
