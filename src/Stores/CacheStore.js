/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { debounce } from '../Utils/Common';
import CacheManager from '../Workers/CacheManager';
import {
    STORAGE_CACHE_KEY,
    STORAGE_CACHE_TEST_KEY,
    STORAGE_CONTACTS_KEY,
    STORAGE_CONTACTS_TEST_KEY,
    STORAGE_FILES_KEY,
    STORAGE_FILES_TEST_KEY,
    STORAGE_FILTERS_KEY,
    STORAGE_FILTERS_TEST_KEY, STORAGE_REGISTER_KEY, STORAGE_REGISTER_TEST_KEY
} from '../Constants';
import BasicGroupStore from './BasicGroupStore';
import ChatStore from './ChatStore';
import FileStore from './FileStore';
import MessageStore from './MessageStore';
import OptionStore from './OptionStore';
import SupergroupStore from './SupergroupStore';
import UserStore from './UserStore';
import TdLibController from '../Controllers/TdLibController';

class CacheStore extends EventEmitter {
    constructor() {
        super();

        this.cacheContacts = false;

        const { useTestDC } = TdLibController.parameters;
        this.cacheKey = useTestDC ? STORAGE_CACHE_TEST_KEY : STORAGE_CACHE_KEY;
        this.contactsKey = useTestDC ? STORAGE_CONTACTS_TEST_KEY : STORAGE_CONTACTS_KEY;
        this.filesKey = useTestDC ? STORAGE_FILES_TEST_KEY : STORAGE_FILES_KEY;
        this.filtersKey = useTestDC ? STORAGE_FILTERS_TEST_KEY : STORAGE_FILTERS_KEY;
        this.registerKey = useTestDC ? STORAGE_REGISTER_TEST_KEY : STORAGE_REGISTER_KEY;

        this.reset();

        this.addTdLibListener();

        this.saveInternal = debounce(this.saveInternal, 2000, {
            leading: false,
            trailing: true
        });
    }

    reset = () => {
        this.filters = null;
        this.chatIds = [];
        this.archiveChatIds = [];
        this.meChat = null;
        if (this.cacheContacts) {
            this.contacts = null;
        }

        this.cache = null;
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                const { authorization_state } = update;
                if (!authorization_state) break;

                switch (authorization_state['@type']) {
                    case 'authorizationStateClosed': {
                        this.reset();
                        this.clear();
                        break;
                    }
                    case 'authorizationStateLoggingOut':
                    case 'authorizationStateWaitCode':
                    case 'authorizationStateWaitPhoneNumber':
                    case 'authorizationStateWaitPassword':
                    case 'authorizationStateWaitRegistration': {
                        CacheManager.remove(this.cacheKey);
                        CacheManager.remove(this.filesKey);
                        if (this.cacheContacts) {
                            CacheManager.remove(this.contactsKey);
                        }
                        break;
                    }
                }

                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateDialogsReady': {
                this.clearDataUrls();
            }
            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    async load() {
        const promises = [];
        promises.push(CacheManager.load(this.cacheKey).catch(error => null));
        promises.push(CacheManager.load(this.filesKey).catch(error => null));
        promises.push(CacheManager.load(this.filtersKey).catch(error => null));
        if (this.cacheContacts) {
            promises.push(CacheManager.load(this.contactsKey).catch(error => null));
        }
        let [cache, files, filters, contacts] = await Promise.all(promises);
        // console.log('[f] cache.load', files);

        let dropCache = false;
        if (cache && cache.chats) {
            for (let i = 0; i < cache.chats.length; i++) {
                const { last_message } = cache.chats[i];
                if (last_message && last_message.sender_user_id) {
                    dropCache = true;
                    break;
                }
            }
        }
        if (dropCache) {
            cache = null;
        }

        this.cache = cache;
        if (this.cache) {
            this.cache.files = files || [];
        }

        if (this.cacheContacts) {
            if (contacts) {
                (contacts || []).forEach(x => {
                    UserStore.set(x);
                })

                this.contacts = {
                    '@type': 'users',
                    user_ids: contacts.map(x => x.id),
                    total_count: contacts.length
                };
            }
        }

        this.filters = filters;

        if (this.cache) {
            this.parseCache(this.cache);
        }

        // console.log('[cm] load', this.filters, filters);
        return this.cache;
    }

    parseCache(cache) {
        if (!cache) return;

        const { meChat, chats, archiveChats, users, basicGroups, supergroups, files, options } = cache;
        // console.log('[f] cache.parse', cache.files);

        (files || []).filter(x => Boolean(x)).forEach(({ id, url }) => {
            FileStore.setDataUrl(id, url);
        });

        (users || []).forEach(x => {
            UserStore.set(x);
        });

        (basicGroups || []).forEach(x => {
            BasicGroupStore.set(x);
        });

        (supergroups || []).forEach(x => {
            SupergroupStore.set(x);
        });

        (chats || []).concat(archiveChats || []).concat([meChat]).forEach(x => {
            if (x) {
                delete x.OutputTypingManager;

                ChatStore.set(x);
                if (x.photo) {
                    if (x.photo.small) FileStore.set(x.photo.small);
                    if (x.photo.big) FileStore.set(x.photo.big);
                }
                if (x.position) {
                    ChatStore.updateChatChatLists(x.id);
                }
                if (x.last_message) {
                    MessageStore.set(x.last_message);
                }
            }
        });

        (options || []).forEach(([id, option]) => {
            OptionStore.set(id, option);
        });
    }

    async getCache(chatIds, archiveChatIds) {
        const fileMap = new Map();
        const userMap = new Map();
        const basicGroupMap = new Map();
        const supergroupMap = new Map();
        const meChat = this.meChat;
        const chats = chatIds.map(x => ChatStore.get(x));
        const chatMap = new Map(chats.map(x => [x.id, x]));
        const archiveChats = archiveChatIds.map(x => ChatStore.get(x));

        chats.concat(archiveChats).concat([meChat]).forEach(x => {
            const { photo, type, last_message } = x;
            if (photo && photo.small) {
                const { id } = photo.small;
                if (id) {
                    const blob = FileStore.getBlob(id);
                    if (blob) {
                        fileMap.set(id, blob);
                    }
                }
            }

            switch (type['@type']) {
                case 'chatTypeBasicGroup': {
                    const basicGroup = BasicGroupStore.get(type.basic_group_id);
                    if (basicGroup) {
                        basicGroupMap.set(basicGroup.id, basicGroup);
                    }
                }
                case 'chatTypePrivate':
                case 'chatTypeSecret': {
                    const user = UserStore.get(type.user_id);
                    if (user) {
                        userMap.set(user.id, user);
                    }
                }
                case 'chatTypeSupergroup': {
                    const supergroup = SupergroupStore.get(type.supergroup_id);
                    if (supergroup) {
                        supergroupMap.set(supergroup.id, supergroup);
                    }
                }
            }

            if (last_message) {
                const { sender_id } = last_message;
                switch (sender_id['@type']) {
                    case 'messageSenderUser': {
                        const user = UserStore.get(sender_id.user_id);
                        if (user) {
                            userMap.set(user.id, user);
                        }
                        break;
                    }
                    case 'messageSenderChat': {
                        const chat = ChatStore.get(sender_id.chat_id);
                        if (chat) {
                            chatMap.set(chat.id, chat);
                        }
                        break;
                    }
                }
            }
        });

        return {
            date: new Date(),
            meChat,
            chats: [...chatMap.values()],
            archiveChats,
            users: [...userMap.values()],
            basicGroups: [...basicGroupMap.values()],
            supergroups: [...supergroupMap.values()],
            files: [...fileMap.entries()],
            options: [...OptionStore.items.entries()]
        };
    }

    async save(filters, chatIds, archiveChatIds) {
        this.chatIds = chatIds;
        this.archiveChatIds = archiveChatIds;
        this.meChat = this.meChat || await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: UserStore.getMyId(),
            force: false
        });
        if (this.cacheContacts) {
            this.contacts = this.contacts || await TdLibController.send({
                '@type': 'getContacts'
            });
        }
        this.filters = filters;

        // console.log('[cm] save');
        this.saveInternal();
    }

    async saveInternal() {
        // console.log('[cm] saveInternal');
        const cache = await this.getCache(this.chatIds, this.archiveChatIds);
        const files = cache.files;
        cache.files = [];
        // console.log('[cm] save cache', cache);
        await CacheManager.save(this.cacheKey, cache);

        const promises = [];
        files.forEach(x => {
            const [id, blob] = x;
            promises.push(
                new Promise((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.readAsDataURL(blob);
                    fileReader.onload = e => {
                        resolve({ id, url: e.target.result });
                    };
                    fileReader.onerror = e => {
                        resolve(null);
                    };
                })
            );
        });
        const results = await Promise.all(promises);
        await CacheManager.save(this.filesKey, results);

        if (this.cacheContacts) {
            const contacts = this.contacts.user_ids.map(x => UserStore.get(x));
            await CacheManager.save(this.contactsKey, contacts);
        }

        if (this.filters) {
            await CacheManager.save(this.filtersKey, this.filters);
        }
    }

    clear() {
        const promises = [];
        promises.push(CacheManager.remove(this.cacheKey).catch(error => null));
        promises.push(CacheManager.remove(this.filesKey).catch(error => null));
        promises.push(CacheManager.remove(this.filtersKey).catch(error => null));
        promises.push(CacheManager.remove(this.contactsKey).catch(error => null));
        promises.push(CacheManager.remove(this.registerKey).catch(error => null));

        Promise.all(promises);
    }

    clearDataUrls() {
        if (this.cache) {
            const { files } = this.cache;

            files.forEach(({ id, url }) => {
                FileStore.deleteDataUrl(id);
            });
        }
    }
}

const store = new CacheStore();
window.cache = store;
export default store;
