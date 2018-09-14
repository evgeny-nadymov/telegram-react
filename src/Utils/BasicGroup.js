function getBasicGroupStatus(basicGroup){
    if (!basicGroup) return null;

    const count = basicGroup.member_count;

    if (!count) return '0 members';
    if (count === 1) return '1 member';

    return `${count} members`;
}

export {
    getBasicGroupStatus,
}