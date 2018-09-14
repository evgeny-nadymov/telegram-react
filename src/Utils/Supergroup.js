import SupergroupStore from '../Stores/SupergroupStore';

function getSupergroupStatus(supergroup){
    if (!supergroup) return null;

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
    getSupergroupStatus,
}