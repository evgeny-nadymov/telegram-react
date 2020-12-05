/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */


import ChatStore from '../Stores/ChatStore';
import LStore from '../Stores/LocalizationStore';
import SupergroupStore from '../Stores/SupergroupStore';

export function getChannelStatus(supergroup, chatId) {
    if (!supergroup) return '';

    let { is_channel, member_count: count, username } = supergroup;
    if (!is_channel) return '';

    if (!count) {
        const fullInfo = SupergroupStore.getFullInfo(supergroup.id);
        if (fullInfo) {
            count = fullInfo.member_count;
        }
    }

    if (count <= 0) {
        return username
            ? LStore.getString('ChannelPublic').toLowerCase()
            : LStore.getString('ChannelPrivate').toLowerCase();
    }

    if (count <= 1) {
        return LStore.formatPluralString('Subscribers', 1);
    }

    const onlineCount = ChatStore.getOnlineMemberCount(chatId);
    if (onlineCount > 1) {
        return `${LStore.formatPluralString('Subscribers', count)}, ${LStore.formatPluralString('OnlineCount', onlineCount)}`;
    }

    return LStore.formatPluralString('Subscribers', count);
}
