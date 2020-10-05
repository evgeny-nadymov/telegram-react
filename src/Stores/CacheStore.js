/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { debounce } from '../Utils/Common';
import CacheManager from '../Workers/CacheManager';
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

        this.reset();

        this.addTdLibListener();

        this.saveInternal = debounce(this.saveInternal, 2000);
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
                        CacheManager.remove('cache');
                        CacheManager.remove('files');
                        if (this.cacheContacts) {
                            CacheManager.remove('contacts');
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
        // console.log('[cm] getChats start');
        const promises = [];
        promises.push(CacheManager.load('cache').catch(error => null));
        promises.push(CacheManager.load('files').catch(error => null));
        promises.push(CacheManager.load('filters').catch(error => null));
        if (this.cacheContacts) {
            promises.push(CacheManager.load('contacts').catch(error => null));
        }
        const [cache, files, filters, contacts] = await Promise.all(promises);
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
        // console.log('[cache] parseCache', cache);

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
                const { sender_user_id } = last_message;
                if (sender_user_id) {
                    const user = UserStore.get(sender_user_id);
                    if (user) {
                        userMap.set(user.id, user);
                    }
                }
            }
        });

        return {
            meChat,
            chats,
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

        this.saveInternal();
    }

    async saveInternal() {
        // console.log('[cm] saveInternal', this.filters, this.chatIds, this.archiveChatIds);
        const cache = await this.getCache(this.chatIds, this.archiveChatIds);
        const files = cache.files;
        cache.files = [];
        // console.log('[cm] save cache', cache);
        await CacheManager.save('cache', cache);

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
        // console.log('[cm] save files start', files);
        const results = await Promise.all(promises);
        // console.log('[cm] save files', results);
        await CacheManager.save('files', results);

        if (this.cacheContacts) {
            const contacts = this.contacts.user_ids.map(x => UserStore.get(x));
            await CacheManager.save('contacts', contacts);
        }

        if (this.filters) {
            await CacheManager.save('filters', this.filters);
        }
    }

    clear() {
        const promises = [];
        promises.push(CacheManager.remove('cache').catch(error => null));
        promises.push(CacheManager.remove('files').catch(error => null));
        promises.push(CacheManager.remove('filters').catch(error => null));
        promises.push(CacheManager.remove('contacts').catch(error => null));
        promises.push(CacheManager.remove('register').catch(error => null));

        Promise.all(promises)
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
