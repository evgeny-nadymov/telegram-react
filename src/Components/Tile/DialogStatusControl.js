/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { getChatSubtitleWithoutTyping, isAccentChatSubtitleWithoutTyping } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import './DialogStatusControl.css';

const styles = theme => ({
    statusSubtitle: {
        color: theme.palette.type === 'dark' ? theme.palette.text.secondary : '#70777b'
    },
    statusAccentSubtitle: {
        color: theme.palette.primary.dark + '!important'
    }
});

class DialogStatusControl extends React.Component {
    constructor(props) {
        super(props);

        const { chatId } = this.props;

        this.state = {
            prevChatId: chatId,
            subtitle: getChatSubtitleWithoutTyping(chatId),
            isAccent: isAccentChatSubtitleWithoutTyping(chatId)
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {
            const { chatId } = props;

            return {
                prevChatId: chatId,
                subtitle: getChatSubtitleWithoutTyping(chatId),
                isAccent: isAccentChatSubtitleWithoutTyping(chatId)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId } = this.props;
        const { subtitle, isAccent } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.subtitle !== subtitle) {
            return true;
        }

        if (nextState.isAccent !== isAccent) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount() {
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup);
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    onUpdateUserStatus = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        let updateSubtitle = false;
        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        updateSubtitle = true;
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    updateSubtitle = true;
                }
                break;
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    updateSubtitle = true;
                }
                break;
            }
            case 'chatTypeSupergroup': {
                break;
            }
        }

        if (updateSubtitle) {
            this.updateSubtitle(chat);
        }
    };

    updateSubtitle = chat => {
        this.setState({
            subtitle: getChatSubtitleWithoutTyping(chat.id),
            isAccent: isAccentChatSubtitleWithoutTyping(chat.id)
        });
    };

    onUpdateUserFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (
            chat.type &&
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.updateSubtitle(chat);
        }
    };

    onUpdateBasicGroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group_id
        ) {
            this.updateSubtitle(chat);
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup_id
        ) {
            this.updateSubtitle(chat);
        }
    };

    onUpdateBasicGroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group.id
        ) {
            this.updateSubtitle(chat);
        }
    };

    onUpdateSupergroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup.id
        ) {
            this.updateSubtitle(chat);
        }
    };

    render() {
        const { classes } = this.props;
        const { subtitle, isAccent } = this.state;

        return (
            <div
                className={classNames(
                    'dialog-status',
                    isAccent ? classes.statusAccentSubtitle : classes.statusSubtitle
                )}>
                {subtitle}
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(DialogStatusControl);
