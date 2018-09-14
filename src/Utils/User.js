import dateFormat from 'dateformat';

function getUserStatus(user){
    if (!user) return null;
    if (!user.status) return null;

    if (user.type
        && user.type['@type'] === 'userTypeBot'){
        return 'bot';
    }

    switch (user.status['@type']) {
        case 'userStatusEmpty':{
            return null;
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
            const today = now.getDate();
            if (diff > today){
                if (diff.getTime() / 1000 < 6 * 60 * 60){
                    const hours = Math.floor(diff.getTime() / 1000 / 60 / 60);
                    return `last seen ${hours === 1 ? '1 hour' : hours + ' hours'} ago`;
                }

                return `last seen today at ${dateFormat(wasOnline, 'H:MM')}`;
            }

            // yesterday
            let yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            if (diff > yesterday){
                return `last seen yesterday at ${dateFormat(wasOnline, 'H:MM')}`;
            }

            // this year
            let thisYear = new Date(now.getFullYear(), 0, 1);
            if (diff > thisYear){
                return `last seen at ${dateFormat(wasOnline, 'd MMM')}`;
            }

            return `last seen at ${dateFormat(wasOnline, 'd MMM yyyy')}`;
        }
        case 'userStatusOnline':{
            return 'online';
        }
        case 'userStatusRecently':{
            return 'recently';
        }
    }

    return null;
    // let date = new Date(chat.last_message.date * 1000);
    //
    // let yesterday = new Date();
    // yesterday.setDate(yesterday.getDate() - 1);
    // if (date > yesterday){
    //     return dateFormat(date, 'H:MM');
    // }
    //
    // let now = new Date();
    // let weekStart = now.getDate() - now.getDay() + 1;
    // let monday = new Date(now.setDate(weekStart));
    // if (date > monday){
    //     return dateFormat(date, 'ddd');
    // }
    //
    // return dateFormat(date, 'd.mm.yyyy');
}

function isOnline(user) {
    return false;
}

export {
    getUserStatus,
    isOnline
}