import dateFormat from 'dateformat';

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
            return 'within a month';
        }
        case 'userStatusLastWeek':{
            return 'within a week';
        }
        case 'userStatusOffline':{
            let {was_online} = user.status;
            if (!was_online) return 'offline';

            const now = new Date();
            const wasOnline = new Date(was_online * 1000);
            if (wasOnline > now){
                return 'offline';
            }

            let diff = new Date(now - wasOnline);

            // within minute
            if (diff.getTime() / 1000 < 60){
                return 'last seen just now';
            }

            // within hour
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
            return 'recently';
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

export {
    getUserStatus,
    isAccentUserSubtitle
}