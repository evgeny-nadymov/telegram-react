/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import dateFormat from 'dateformat';
import UserStore from '../Stores/UserStore';
import { getLetters } from './Common';
import { getUserPhoto } from './File';
import FileController from '../Controllers/FileController';

function getUserStatus(user){
    if (!user) return null;
    if (!user.status) return null;

    if (user.id === 777000){
        return 'service notifications';
    }

    if (user.type
        && user.type['@type'] === 'userTypeBot'){
        return 'bot';
    }

    switch (user.status['@type']) {
        case 'userStatusEmpty':{
            return 'last seen a long time ago';
        }
        case 'userStatusLastMonth':{
            return 'last seen within a month';
        }
        case 'userStatusLastWeek':{
            return 'last seen within a week';
        }
        case 'userStatusOffline':{
            let {was_online} = user.status;
            if (!was_online) return 'offline';

            const now = new Date();
            const wasOnline = new Date(was_online * 1000);
            if (wasOnline > now){
                return 'last seen just now';
            }

            let diff = new Date(now - wasOnline);

            // within a minute
            if (diff.getTime() / 1000 < 60){
                return 'last seen just now';
            }

            // within an hour
            if (diff.getTime() / 1000 < 60 * 60){
                const minutes = Math.floor(diff.getTime() / 1000 / 60);
                return `last seen ${minutes === 1 ? '1 minute' : minutes + ' minutes'} ago`;
            }

            // today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (wasOnline > today){
                // up to 6 hours ago
                if (diff.getTime() / 1000 < 6 * 60 * 60){
                    const hours = Math.floor(diff.getTime() / 1000 / 60 / 60);
                    return `last seen ${hours === 1 ? '1 hour' : hours + ' hours'} ago`;
                }

                // other
                return `last seen today at ${dateFormat(wasOnline, 'H:MM')}`;
            }

            // yesterday
            let yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            today.setHours(0, 0, 0, 0);
            if (wasOnline > yesterday){
                return `last seen yesterday at ${dateFormat(wasOnline, 'H:MM')}`;
            }

            return `last seen ${dateFormat(wasOnline, 'dd.mm.yyyy')}`;
        }
        case 'userStatusOnline':{
            return 'online';
        }
        case 'userStatusRecently':{
            return 'last seen recently';
        }
    }

    return null;
}

function isAccentUserSubtitle(user) {
    if (user
        && user.status
        && user.status['@type'] === 'userStatusOnline'
        && user.type
        && user.type['@type'] !== 'userTypeBot'){
        return true;
    }

    return false;
}

function getUserFullName(user) {
    if (!user) return null;
    if (!user.type) return null;

    switch (user.type['@type']) {
        case 'userTypeBot':
        case 'userTypeRegular': {
            if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
            if (user.first_name) return user.first_name;
            if (user.last_name) return user.last_name;
        }
        case 'userTypeDeleted':
        case 'userTypeUnknown': {
            return 'Deleted account';
        }
    }

    return null;
}

function isUserBlocked(userId){
    const fullInfo = UserStore.getFullInfo(userId);
    if (fullInfo){
        return fullInfo.is_blocked;
    }

    return false;
}

function getUserLetters(user){
    if (!user) return null;

    let title = getUserFullName(user);
    let letters = getLetters(title);
    if (letters && letters.length > 0){
        return letters;
    }

    return user.first_name ? user.first_name.charAt(0) : (user.last_name ? user.last_name.charAt(0) : '');
}

function getUserStatusOrder(user) {
    if (!user) return 0;
    if (!user.status) return 0;
    if (user.type['@type'] === 'userTypeBot') return 0;

    switch (user.status['@type']) {
        case 'userStatusEmpty': {
            return 0;
        }
        case 'userStatusLastMonth': {
            return 10;
        }
        case 'userStatusLastWeek': {
            return 100;
        }
        case 'userStatusOffline': {
            return user.status.was_online;
        }
        case 'userStatusOnline': {
            return user.status.expires;
        }
        case 'userStatusRecently': {
            return 1000;
        }
    }
}

export {
    getUserStatus,
    isAccentUserSubtitle,
    getUserFullName,
    isUserBlocked,
    getUserLetters,
    getUserStatusOrder
}