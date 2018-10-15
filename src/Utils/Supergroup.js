/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SupergroupStore from '../Stores/SupergroupStore';

function getSupergroupStatus(supergroup){
    if (!supergroup) return null;


    if (supergroup.status
        && supergroup.status['@type'] === 'chatMemberStatusBanned'){
        return supergroup.is_channel ? 'channel is inaccessible' : 'group is inaccessible';
    }

    let count = supergroup.member_count;

    if (!count) {

        const fullInfo = SupergroupStore.getFullInfo(supergroup.id);
        if (fullInfo){
            count = fullInfo.member_count;
        }
    }
    if (!count){
        return null;
    }

    if (count === 1) return '1 member';

    return `${count} members`;
}

export {
    getSupergroupStatus
}