/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import ContactsIcon from '../../../Assets/Icons/NewPrivate';
import FilterChat from '../../Tile/FilterChat';
import FilterText from '../../Tile/FilterText';
import NonContactsIcon from '../../../Assets/Icons/NonContacts';
import GroupsIcon from '../../../Assets/Icons/NewGroup';
import ChannelsIcon from '../../../Assets/Icons/NewChannel';
import BotsIcon from '../../../Assets/Icons/Bots';
import SectionHeader from '../SectionHeader';
import MutedIcon from '../../../Assets/Icons/Mute';
import ReadIcon from '../../../Assets/Icons/ReadChats';
import ArchivedIcon from '../../../Assets/Icons/Archive';
import './EditFilterChats.css';

class EditFilterChats extends React.Component {

    render() {
        const { t, filter, chats, limit, mode, onClose, onChange, onScroll } = this.props;

        const {
            include_contacts,
            include_non_contacts,
            include_bots,
            include_groups,
            include_channels,
            included_chat_ids
        } = filter;

        const {
            exclude_muted,
            exclude_read,
            exclude_archived,
            excluded_chat_ids
        } = filter;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{mode === 'include' ? t('FilterInclude') : t('FilterExclude')}</span>
                    </div>
                </div>
                <div ref={this.scrollRef} className='sidebar-page-content' onScroll={onScroll}>
                    <SectionHeader>{t('FilterChatTypes')}</SectionHeader>
                    {mode === 'include' && (
                        <>
                            <FilterText onClick={() => onChange('include_contacts')} checked={include_contacts} icon={<ContactsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterContacts')} />
                            <FilterText onClick={() => onChange('include_non_contacts')} checked={include_non_contacts} icon={<NonContactsIcon className='filter-text-subtle-icon'/>} text={t('FilterNonContacts')} />
                            <FilterText onClick={() => onChange('include_groups')} checked={include_groups} icon={<GroupsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterGroups')} />
                            <FilterText onClick={() => onChange('include_channels')} checked={include_channels} icon={<ChannelsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterChannels')} />
                            <FilterText onClick={() => onChange('include_bots')} checked={include_bots} icon={<BotsIcon className='filter-text-subtle-icon'/>} text={t('FilterBots')} />
                        </>
                    )}
                    {mode !== 'include' && (
                        <>
                            <FilterText onClick={() => onChange('exclude_muted')} checked={exclude_muted} icon={<MutedIcon className='filter-text-subtle-icon'/>} text={t('FilterMuted')} />
                            <FilterText onClick={() => onChange('exclude_read')} checked={exclude_read} icon={<ReadIcon className='filter-text-subtle-icon'/>} text={t('FilterRead')} />
                            <FilterText onClick={() => onChange('exclude_archived')} checked={exclude_archived} icon={<ArchivedIcon className='filter-text-subtle-icon'/>} text={t('FilterArchived')} />
                        </>
                    )}
                    { chats && chats.length > 0 && (
                        <>
                            <SectionHeader>{t('FilterChats')}</SectionHeader>
                            { (chats || []).slice(0, limit).map(x => <FilterChat onClick={() => onChange(mode === 'include' ? 'included_chat_ids' : 'excluded_chat_ids', x)} key={x} chatId={x} checked={mode === 'include' ? included_chat_ids.includes(x) : excluded_chat_ids.includes(x)}/>) }
                        </>
                    )}
                </div>
            </>
        );
    }
}

EditFilterChats.propTypes = {
    filter: PropTypes.object,
    chats: PropTypes.array,
    mode: PropTypes.string,
    onChange: PropTypes.func,
    onScroll: PropTypes.func
};

export default withTranslation()(EditFilterChats);