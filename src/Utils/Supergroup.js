/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SupergroupStore from '../Stores/SupergroupStore';
import ChatStore from '../Stores/ChatStore';
import { getSupergroupId } from './Chat';

export function getSupergroupStatus(supergroup, chatId) {
    if (!supergroup) return null;

    let { status, is_channel, member_count: count } = supergroup;

    if (status && status['@type'] === 'chatMemberStatusBanned') {
        return is_channel ? 'channel is inaccessible' : 'group is inaccessible';
    }

    if (!count) {
        const fullInfo = SupergroupStore.getFullInfo(supergroup.id);
        if (fullInfo) {
            count = fullInfo.member_count;
        }
    }

    if (!count) return '0 members';
    if (count === 1) return '1 member';

    const onlineCount = ChatStore.getOnlineMemberCount(chatId);
    if (onlineCount > 1) {
        return `${count} members, ${onlineCount} online`;
    }

    return `${count} members`;
}

export function isPublicSupergroup(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const supergroupId = getSupergroupId(chatId);
    if (!supergroupId) return false;

    const supergroup = SupergroupStore.get(supergroupId);
    if (!supergroup) return false;

    const { username } = supergroup;

    return Boolean(username);
}
