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
import SearchInput from '../Search/SearchInput';
import MutedIcon from '../../../Assets/Icons/Mute';
import ReadIcon from '../../../Assets/Icons/ReadChats';
import ArchivedIcon from '../../../Assets/Icons/Archive';
import Chip from '../../Tile/Chip';
import ChatChip from '../../Tile/ChatChip';
import { loadChatsContent } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';
import TdLibController from '../../../Controllers/TdLibController';
import './EditFilterChats.css';

class EditFilterChats extends React.Component {

    constructor(props) {
        super(props);

        this.searchInputRef = React.createRef();
        this.wrapPanelRef = React.createRef();
        this.itemsRef = new Map();

        this.state = {
            focusedItem: null,
            searchItems: null,
            error: false
        }
    }

    handleChatChange = (chatId, search) => {
        const { mode } = this.props;

        if (search) {
            const input = this.searchInputRef.current;
            input.focus();
            input.innerText = '';
            this.handleSearch('');
        }

        this.handleChange(mode === 'include' ? 'included_chat_ids' : 'excluded_chat_ids', chatId);
    };

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { filter, mode } = this.props;
        const { filter : prevFilter } = prevProps;

        if (prevProps.filter === filter) {
            return null;
        }

        const include = mode === 'include';
        const prevItems = include ? prevProps.filter.included_chat_ids : prevProps.filter.excluded_chat_ids;
        const items = include ? filter.included_chat_ids : filter.excluded_chat_ids;

        const isDeleting =
            prevItems.length > items.length
            || prevFilter.include_contacts && !filter.include_contacts
            || prevFilter.include_non_contacts && !filter.include_non_contacts
            || prevFilter.include_groups && !filter.include_groups
            || prevFilter.include_channels && !filter.include_channels
            || prevFilter.include_bots && !filter.include_bots
            || prevFilter.exclude_read && !filter.exclude_read
            || prevFilter.exclude_muted && !filter.exclude_muted
            || prevFilter.exclude_archived && !filter.exclude_archived;

        const wrapPanel = this.wrapPanelRef.current;
        const prevHeight = wrapPanel.scrollHeight;
        const prevOffsetHeight = wrapPanel.offsetHeight;

        const prevCSSText = wrapPanel.style.cssText;
        const prevScrollTop = wrapPanel.scrollTop;
        if (isDeleting) {
            wrapPanel.style.cssText = null;
        }

        const prevMap = new Map();
        for (let key of this.itemsRef.keys()) {
            const el = this.itemsRef.get(key);
            if (el) {
                const offset = el.getOffset();
                prevMap.set(key, offset);
            }
        }

        return { items: prevMap, panel: { isDeleting, prevHeight, prevOffsetHeight, prevScrollTop, prevCSSText } };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.filter === this.props.filter) {
            return;
        }

        this.animatePanel(snapshot.panel);
        // this.animateItems(snapshot.items);
    }

    animatePanel(snapshot) {
        if (!snapshot) return;

        const { isDeleting, prevHeight, prevOffsetHeight, prevScrollTop, prevCSSText } = snapshot;

        const wrapPanel = this.wrapPanelRef.current;

        const currentHeight = wrapPanel.scrollHeight;
        const currentOffsetHeight = wrapPanel.offsetHeight;

        const expanded = currentHeight > prevHeight;
        const collapsed = currentHeight < prevHeight;

        const maxHeight = 123;
        if (expanded) {
            if (prevHeight < maxHeight) {
                wrapPanel.style.cssText = `max-height: ${Math.min(prevHeight, maxHeight)}px;`;
                requestAnimationFrame(() => {
                    wrapPanel.style.cssText = `max-height: ${Math.min(currentHeight, maxHeight)}px;`;
                    setTimeout(() => {
                        this.searchInputRef.current.scrollIntoView({ behavior: 'auto' });
                    }, 250);
                });
            } else {
                wrapPanel.style.cssText = `max-height: ${maxHeight}px;`;
                this.searchInputRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (collapsed) {
            if (currentHeight < maxHeight) {
                wrapPanel.style.cssText = `min-height: ${Math.min(prevOffsetHeight, maxHeight)}px;`;
                requestAnimationFrame(() => {
                    wrapPanel.style.cssText = `min-height: ${Math.min(currentHeight, maxHeight)}px;`;
                });
            } else {
                wrapPanel.style.cssText = `max-height: ${maxHeight}px;`;
                wrapPanel.scrollTop = prevScrollTop;
            }
        } else {
            if (isDeleting) {
                wrapPanel.style.cssText = prevCSSText;
                wrapPanel.scrollTop = prevScrollTop;
            } else {
                this.searchInputRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    animateItems(prevOffsets) {
        if (!prevOffsets) return;

        const doubleTransform = new Map();
        for (let key of this.itemsRef.keys()) {
            const el = this.itemsRef.get(key);
            if (el) {
                const currentOffset = el.getOffset();
                const prevOffset = prevOffsets.has(key) ? prevOffsets.get(key) : null;
                if (prevOffset) {
                    if (prevOffset.left < currentOffset.left) {
                        doubleTransform.set(el, { prevOffset, currentOffset });
                    }

                    const transform = `transform: translate(${prevOffset.left - currentOffset.left}px, ${prevOffset.top - currentOffset.top}px)`;
                    el.setStyleCSSText(transform);
                }
            }
        }

        requestAnimationFrame(() => {
            for (let key of this.itemsRef.keys()) {
                const el = this.itemsRef.get(key);
                if (el) {
                    let transition = `transition: transform 0.25s ease`;
                    if (doubleTransform.has(el)) {
                        const { prevOffset, currentOffset } = doubleTransform.get(el);
                        transition = `transform: translate(${prevOffset.left - currentOffset.left - prevOffset.width}px, ${prevOffset.top - currentOffset.top}px);`
                            + 'transition: transform 0.1s ease;'
                    }

                    el.setStyleCSSText(transition);
                }
            }

            if (!doubleTransform.size) return;

            setTimeout(() => {
                for (let el of doubleTransform.keys()) {
                    const { currentOffset } = doubleTransform.get(el);
                    const transition = `transform: translate(${currentOffset.width}px, 0);`
                        + 'transition: transform 0s ease;';

                    el.setStyleCSSText(transition);
                }

                requestAnimationFrame(() => {
                    for (let el of doubleTransform.keys()) {
                        const transition = 'transition: transform 0.15s ease';

                        el.setStyleCSSText(transition);
                    }
                });

            }, 100);
        });
    }

    handleBackspace = () => {
        const { filter, mode } = this.props;
        const { focusedItem } = this.state;
        if (!filter) return;

        if (focusedItem) {
            switch (focusedItem) {
                case 'include_contacts':
                case 'include_non_contacts':
                case 'include_bots':
                case 'include_groups':
                case 'include_channels':
                case 'exclude_muted':
                case 'exclude_read':
                case 'exclude_archived': {
                    this.handleChange(focusedItem);

                    this.setState({
                        focusedItem: null
                    });
                    break;
                }
                default: {
                    this.handleChatChange(focusedItem);

                    this.setState({
                        focusedItem: null
                    });
                    break;
                }
            }
            return;
        }

        const include = mode === 'include';
        if (include) {
            const {
                include_contacts,
                include_non_contacts,
                include_bots,
                include_groups,
                include_channels,
                included_chat_ids
            } = filter;

            if (included_chat_ids.length > 0) {
                const lastItem = included_chat_ids[included_chat_ids.length - 1];
                if (!lastItem) return;

                this.setState({
                    focusedItem: lastItem
                });
            } else if (include_bots) {
                this.setState({
                    focusedItem: 'include_bots'
                });
            } else if (include_channels) {
                this.setState({
                    focusedItem: 'include_channels'
                });
            } else if (include_groups) {
                this.setState({
                    focusedItem: 'include_groups'
                });
            } else if (include_non_contacts) {
                this.setState({
                    focusedItem: 'include_non_contacts'
                });
            } else if (include_contacts) {
                this.setState({
                    focusedItem: 'include_contacts'
                });
            }
        } else {
            const {
                exclude_muted,
                exclude_read,
                exclude_archived,
                excluded_chat_ids
            } = filter;

            if (excluded_chat_ids.length > 0) {
                const lastItem = excluded_chat_ids[excluded_chat_ids.length - 1];
                if (!lastItem) return;

                this.setState({
                    focusedItem: lastItem
                });
            } else if (exclude_archived) {
                this.setState({
                    focusedItem: 'exclude_archived'
                });
            } else if (exclude_read) {
                this.setState({
                    focusedItem: 'exclude_read'
                });
            } else if (exclude_muted) {
                this.setState({
                    focusedItem: 'exclude_muted'
                });
            }
        }
    };

    handleChange = (type, value) => {
        const { onChange } = this.props;

        onChange(type, value);

        this.setState({
            focusedItem: null
        });
    };

    handleSearch = async text => {
        const query = text.trim();
        if (!query) {
            this.setState({
                searchItems: null,
                focusedItem: null
            });
            return;
        }

        const promises = [];
        promises.push(
            TdLibController.send({
                '@type': 'searchChats',
                query,
                limit: 100
            })
        );
        const [searchItems] = await Promise.all(promises);

        const store = FileStore.getStore();
        loadChatsContent(store, searchItems.chat_ids);

        this.setState({ searchItems, focusedItem: null });
    };

    render() {
        const { t, filter, chats, limit, mode, onClose, onChange, onScroll } = this.props;
        const { focusedItem, searchItems } = this.state;

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

        const include = mode === 'include';
        const items = include ? included_chat_ids : excluded_chat_ids;

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
                <div ref={this.wrapPanelRef} className='animated-wrap-panel'>
                    { include && (
                        <>
                            {include_contacts && <Chip onClick={() => this.handleChange('include_contacts')} ref={el => { this.itemsRef.set('include_contacts', el); }} selected={focusedItem === 'include_contacts'} icon={<ContactsIcon viewBox='0 0 36 36'/>} text={t('FilterContacts')}/>}
                            {include_non_contacts && <Chip onClick={() => this.handleChange('include_non_contacts')} ref={el => { this.itemsRef.set('include_non_contacts', el); }} selected={focusedItem === 'include_non_contacts'} icon={<NonContactsIcon />} text={t('FilterNonContacts')}/>}
                            {include_groups && <Chip onClick={() => this.handleChange('include_groups')} ref={el => { this.itemsRef.set('include_groups', el); }} selected={focusedItem === 'include_groups'} icon={<GroupsIcon viewBox='0 0 36 36'/>} text={t('FilterGroups')}/>}
                            {include_channels && <Chip onClick={() => this.handleChange('include_channels')} ref={el => { this.itemsRef.set('include_channels', el); }} selected={focusedItem === 'include_channels'} icon={<ChannelsIcon viewBox='0 0 36 36'/>} text={t('FilterChannels')}/>}
                            {include_bots && <Chip onClick={() => this.handleChange('include_bots')} ref={el => { this.itemsRef.set('include_bots', el); }} selected={focusedItem === 'include_bots'} icon={<BotsIcon />} text={t('FilterBots')}/>}
                        </>
                    )}
                    { !include && (
                        <>
                            {exclude_muted && <Chip onClick={() => this.handleChange('exclude_muted')} ref={el => { this.itemsRef.set('exclude_muted', el); }} selected={focusedItem === 'exclude_muted'} icon={<GroupsIcon viewBox='0 0 36 36'/>} text={t('FilterMuted')}/>}
                            {exclude_read && <Chip onClick={() => this.handleChange('exclude_read')} ref={el => { this.itemsRef.set('exclude_read', el); }} selected={focusedItem === 'exclude_read'} icon={<ChannelsIcon viewBox='0 0 36 36'/>} text={t('FilterRead')}/>}
                            {exclude_archived && <Chip onClick={() => this.handleChange('exclude_archived')} ref={el => { this.itemsRef.set('exclude_archived', el); }} selected={focusedItem === 'exclude_archived'} icon={<BotsIcon />} text={t('FilterArchived')}/>}
                        </>
                    )}
                    {items.map(x => <ChatChip selected={focusedItem === x} ref={el => { this.itemsRef.set(x, el); }} key={x} chatId={x} onClick={() => this.handleChatChange(x)}/>)}
                    <SearchInput inputRef={this.searchInputRef} hint={t('Search')} onClose={this.handleSearchClose} onChange={this.handleSearch} onBackspace={this.handleBackspace} />
                </div>
                <div className='sidebar-page-top-divider' style={{ zIndex: 1 }}/>
                <div ref={this.scrollRef} className='sidebar-page-content' style={{ marginTop: -3, position: 'relative', height: '100%' }} onScroll={onScroll}>
                    <SectionHeader>{t('FilterChatTypes')}</SectionHeader>
                    {include && (
                        <>
                            <FilterText onClick={() => this.handleChange('include_contacts')} checked={include_contacts} icon={<ContactsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterContacts')} />
                            <FilterText onClick={() => this.handleChange('include_non_contacts')} checked={include_non_contacts} icon={<NonContactsIcon className='filter-text-subtle-icon'/>} text={t('FilterNonContacts')} />
                            <FilterText onClick={() => this.handleChange('include_groups')} checked={include_groups} icon={<GroupsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterGroups')} />
                            <FilterText onClick={() => this.handleChange('include_channels')} checked={include_channels} icon={<ChannelsIcon className='filter-text-subtle-icon' viewBox='0 0 36 36'/>} text={t('FilterChannels')} />
                            <FilterText onClick={() => this.handleChange('include_bots')} checked={include_bots} icon={<BotsIcon className='filter-text-subtle-icon'/>} text={t('FilterBots')} />
                        </>
                    )}
                    {!include && (
                        <>
                            <FilterText onClick={() => this.handleChange('exclude_muted')} checked={exclude_muted} icon={<MutedIcon className='filter-text-subtle-icon'/>} text={t('FilterMuted')} />
                            <FilterText onClick={() => this.handleChange('exclude_read')} checked={exclude_read} icon={<ReadIcon className='filter-text-subtle-icon'/>} text={t('FilterRead')} />
                            <FilterText onClick={() => this.handleChange('exclude_archived')} checked={exclude_archived} icon={<ArchivedIcon className='filter-text-subtle-icon'/>} text={t('FilterArchived')} />
                        </>
                    )}
                    { chats && chats.length > 0 && (
                        <>
                            <div className='sidebar-page-section-divider' style={{ margin: '8px -8px' }}/>
                            <SectionHeader>{t('FilterChats')}</SectionHeader>
                            { (chats || []).slice(0, limit).map(x => <FilterChat type={true} onClick={() => this.handleChatChange(x)} key={x} chatId={x} checked={mode === 'include' ? included_chat_ids.includes(x) : excluded_chat_ids.includes(x)}/>) }
                        </>
                    )}
                    { searchItems && (
                        <div className='edit-filter-chats-search'>
                            { searchItems.chat_ids.map(x => <FilterChat type={true} onClick={() => this.handleChatChange(x, true)} key={x} chatId={x} checked={mode === 'include' ? included_chat_ids.includes(x) : excluded_chat_ids.includes(x)}/>) }
                        </div>
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