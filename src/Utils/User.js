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
            return 'offline';
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