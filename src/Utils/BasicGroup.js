/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ChatStore from '../Stores/ChatStore';
import LStore from '../Stores/LocalizationStore';

export function getBasicGroupStatus(basicGroup, chatId) {
    if (!basicGroup) return null;

    const { status, member_count: count } = basicGroup;

    if (status) {
        if (status['@type'] === 'chatMemberStatusBanned') {
            return LStore.getString('YouWereKicked');
        } else if (status['@type'] === 'chatMemberStatusLeft') {
            // return LStore.getString('YouLeft');
        } else if (status['@type'] === 'chatMemberStatusCreator' && !status.is_member) {
            // return LStore.getString('YouLeft');
        }
    }

    if (count <= 1) {
        return LStore.formatPluralString('Members', count);
    }

    const onlineCount = ChatStore.getOnlineMemberCount(chatId);
    if (onlineCount > 1) {
        return `${LStore.formatPluralString('Members', count)}, ${LStore.formatPluralString('OnlineCount', onlineCount)}`;
    }

    return LStore.formatPluralString('Members', count);;
}
