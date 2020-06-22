/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getChatOrder } from './Chat';

export function getFilterSubtitle(t, filterId, chats) {
    if (!chats) return ' ';

    let count = 0;
    for (let i = 0; i < chats.chat_ids.length; i++) {
        if (getChatOrder(chats.chat_ids[i], { '@type': 'chatListFilter', chat_filter_id: filterId }) !== '0') {
            count++;
        }
    }

    if (!count) {
        return t('FilterNoChats');
    }

    return count === 1 ? '1 chat' : `${count} chats`;
}