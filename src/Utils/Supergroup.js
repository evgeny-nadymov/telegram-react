/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getSupergroupId } from './Chat';
import ChatStore from '../Stores/ChatStore';
import SupergroupStore from '../Stores/SupergroupStore';
import LStore from '../Stores/LocalizationStore';

export function getSupergroupStatus(supergroup, chatId) {
    if (!supergroup) return null;

    let { status, member_count: count, username, has_location } = supergroup;

    if (status) {
        if (status['@type'] === 'chatMemberStatusBanned') {
            return LStore.getString('YouWereKicked');
        } else if (status['@type'] === 'chatMemberStatusLeft') {
            // return LStore.getString('YouLeft');
        } else if (status['@type'] === 'chatMemberStatusCreator' && !status.is_member) {
            // return LStore.getString('YouLeft');
        }
    }

    if (!count) {
        const fullInfo = SupergroupStore.getFullInfo(supergroup.id);
        if (fullInfo) {
            count = fullInfo.member_count;
        }
    }

    if (count <= 0) {
        if (has_location){
            return LStore.getString('MegaLocation').toLowerCase();
        }

        return username
            ? LStore.getString('MegaPublic').toLowerCase()
            : LStore.getString('MegaPrivate').toLowerCase();
    }

    if (count <= 1) {
        return LStore.formatPluralString('Members', count);
    }

    const onlineCount = ChatStore.getOnlineMemberCount(chatId);
    if (onlineCount > 1) {
        return `${LStore.formatPluralString('Members', count)}, ${LStore.formatPluralString('OnlineCount', onlineCount)}`;
    }

    return LStore.formatPluralString('Members', count);
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
