function getSupergroupStatus(supergroup){
    if (!supergroup) return null;

    const count = supergroup.member_count;

    if (!count) return null;
    if (count === 1) return '1 member';

    return `${count} members`;
}

export {
    getSupergroupStatus,
}