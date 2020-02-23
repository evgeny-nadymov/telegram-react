/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ChatStore from '../Stores/ChatStore';
import { orderCompare } from './Common';

export function getArchiveTitle() {
    const archive = ChatStore.chatList.get('chatListArchive');
    const chats = [];
    const chatsOrder = [];
    if (archive) {
        for (const chatId of archive.keys()) {
            const chat = ChatStore.get(chatId);
            if (chat) {
                if (chat.order !== '0') chats.push(chat);
                chatsOrder.push({ order: chat.order, id: chat.id, title: chat.title });
            }
        }
    }

    const orderedChats = chats.sort((a, b) => orderCompare(b.order, a.order));

    return orderedChats.map(x => x.title).join(', ');
}
