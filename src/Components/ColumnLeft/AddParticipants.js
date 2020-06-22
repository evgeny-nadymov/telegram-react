/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../Utils/HOC';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import User from '../Tile/User';
import UserChip from '../Tile/UserChip';
import SearchInput from './Search/SearchInput';
import VirtualizedList from '../Additional/VirtualizedList';
import { loadUsersContent } from '../../Utils/File';
import { debounce, throttle } from '../../Utils/Common';
import { getUserFullName } from '../../Utils/User';
import CacheStore from '../../Stores/CacheStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './Contacts.css';

class UserListItem extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { userId, selected, style } = this.props;
        if (nextProps.userId !== userId) {
            return true;
        }

        if (nextProps.selected !== selected) {
            return true;
        }

        if (nextProps.style.top !== style.top) {
            return true;
        }

        return false;
    }

    render() {
        const { userId, selected, onClick, style } = this.props;

        return (
            <ListItem className='user-list-item' onClick={() => onClick(userId)} button style={style}>
                <Checkbox className='user-list-item-checkbox' checked={selected} color='primary' />
                <User userId={userId} />
            </ListItem>
        );
    }
}

class AddParticipants extends React.Component {
    constructor(props) {
        super(props);

        this.titleRef = React.createRef();
        this.searchInputRef = React.createRef();
        this.listRef = React.createRef();
        this.searchListRef = React.createRef();
        this.wrapPanelRef = React.createRef();
        this.itemsRef = new Map();

        this.state = {
            items: null,
            searchItems: null,
            selectedItems: {
                array: [],
                map: new Map()
            },
            focusedItem: null
        };

        this.handleDebounceScroll = debounce(this.handleDebounceScroll, 100, false);
        this.handleThrottleScroll = throttle(this.handleThrottleScroll, 200, false);
    }

    getUserIds() {
        return this.state.selectedItems.array;
    }

    componentDidMount() {
        const { current } = this.searchInputRef;
        if (current) {
            setTimeout(() => current.focus(), 50);
        }

        this.loadContent();
    }

    handleScroll = event => {
        this.handleDebounceScroll();
        this.handleThrottleScroll();
    };

    handleDebounceScroll() {
        this.loadRenderIdsContent();
    }

    handleThrottleScroll() {
        this.loadRenderIdsContent();
    }

    loadRenderIdsContent = () => {
        const { items, searchItems } = this.state;

        const currentItems = searchItems || items;

        const { current } = currentItems === searchItems ? this.searchListRef : this.listRef;
        if (!current) return;

        const renderIds = current.getListRenderIds();
        if (renderIds.size > 0) {
            const userIds = [];
            [...renderIds.keys()].forEach(key => {
                userIds.push(currentItems.user_ids[key]);
            });

            const store = FileStore.getStore();
            loadUsersContent(store, userIds);
        }
    };

    async loadContent() {
        let contacts = CacheStore.contacts;
        if (!contacts) {
            contacts = await TdLibController.send({
                '@type': 'getContacts'
            });
            contacts.user_ids = contacts.user_ids.sort((x, y) => getUserFullName(x).localeCompare(getUserFullName(y)));
            CacheStore.contacts = contacts;
        }

        const store = FileStore.getStore();
        loadUsersContent(store, contacts.user_ids.slice(0, 20));

        this.setState({
            items: contacts
        });
    }

    handleOpenUser = userId => {
        const { selectedItems, focusedItem } = this.state;
        const { map, array } = selectedItems;

        const newMap = new Map(map);
        let newArray;
        let newFocusedItem = null;
        let isDeleting = false;
        if (map.has(userId)) {
            newMap.delete(userId);
            newArray = array.filter(x => x !== userId);
            newFocusedItem = focusedItem === userId ? null : focusedItem;
            isDeleting = true;
        } else {
            newMap.set(userId, userId);
            newArray = array.concat([userId]);
            newFocusedItem = null;
        }

        const input = this.searchInputRef.current;
        input.focus();
        if (!isDeleting) {
            input.innerText = '';
            this.handleSearch('');
        }

        const wrapPanel = this.wrapPanelRef.current;
        const prevHeight = wrapPanel.scrollHeight;
        const prevOffsetHeight = wrapPanel.offsetHeight;

        const prevMap = new Map();
        for (let key of this.itemsRef.keys()) {
            const el = this.itemsRef.get(key);
            if (el) {
                const offset = el.getOffset();
                prevMap.set(key, offset);
            }
        }

        const prevCSSText = wrapPanel.style.cssText;
        const prevScrollTop = wrapPanel.scrollTop;
        if (isDeleting) {
            wrapPanel.style.cssText = null;
        }

        this.setState({
            focusedItem: newFocusedItem,
            selectedItems: {
                array: newArray,
                map: newMap
            }
        }, () => {
            this.animatePanel(isDeleting, prevHeight, prevOffsetHeight, prevScrollTop, prevCSSText);
            this.animateItems(prevMap);
        });
    };

    animatePanel(isDeleting, prevHeight, prevOffsetHeight, prevScrollTop, prevCSSText) {
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

            }, 101);
        });
    }

    renderItem = ({ index, style }, items, selectedItemsMap) => {
        const userId = items[index];
        const isSelected = selectedItemsMap.has(userId);

        return <UserListItem key={userId} userId={userId} selected={isSelected} onClick={() => this.handleOpenUser(userId)} style={style} />;
    };

    handleSearch = async text => {
        const query = text.trim();
        if (!query) {
            this.setState({
                searchItems: null,
                publicItems: null,
                focusedItem: null
            });
            return;
        }

        const promises = [];
        promises.push(
            TdLibController.send({
                '@type': 'searchContacts',
                query,
                limit: 20
            })
        );
        promises.push(
            TdLibController.send({
                '@type': 'searchPublicChats',
                query
            })
        );
        const [searchItems, publicChats] = await Promise.all(promises);

        searchItems.user_ids = searchItems.user_ids.sort((x, y) =>
            getUserFullName(x).localeCompare(getUserFullName(y))
        );

        const publicItems = { '@type': 'users', user_ids: [] };
        publicChats.chat_ids.reduce((array, chatId) => {
            const chat = ChatStore.get(chatId);
            if (chat && chat.type['@type'] === 'chatTypePrivate') {
                array.push(chat.type.user_id);
            }
            return array;
        }, publicItems.user_ids);

        const store = FileStore.getStore();
        loadUsersContent(store, searchItems.user_ids);
        loadUsersContent(store, publicItems.user_ids);

        this.setState({ searchItems, publicItems, focusedItem: null });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: false
        });
    };

    handleSearchClose = event => {
        const { selectedItems, focusedItem } = this.state;
        if (!selectedItems) return;

        const { map } = selectedItems;
        if (!map.has(focusedItem)) return;

        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();

        this.setState({
            focusedItem: null
        })
    };

    handleBackspace = () => {
        const { selectedItems, focusedItem } = this.state;
        if (!selectedItems) return;

        const { array, map } = selectedItems;
        if (!array) return;
        if (!array.length) return;

        if (map.has(focusedItem)) {
            this.handleOpenUser(focusedItem);
            return;
        }

        const lastItem = array[array.length - 1];
        if (!lastItem) return;

        this.setState({
            focusedItem: lastItem
        });
    };

    render() {
        const { popup, t } = this.props;
        const { items, searchItems, publicItems, selectedItems, focusedItem } = this.state;

        const style = popup ? { minHeight: 800 } : null;

        this.itemsRef.clear();

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        { popup ? <CloseIcon/> : <ArrowBackIcon /> }
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('GroupAddMembers')}</span>
                    </div>
                </div>
                <div ref={this.wrapPanelRef} className='animated-wrap-panel'>
                    {selectedItems.array.map(x => <UserChip selected={focusedItem === x} ref={el => { this.itemsRef.set(x, el); }} key={x} userId={x} onClick={() => this.handleOpenUser(x)}/>)}
                    <SearchInput inputRef={this.searchInputRef} hint={t('SendMessageTo')} onClose={this.handleSearchClose} onChange={this.handleSearch} onBackspace={this.handleBackspace} />
                </div>
                <div className='contacts-border'/>
                <div className='contacts-content' style={style}>
                    {items && (
                        <VirtualizedList
                            ref={this.listRef}
                            className='contacts-list'
                            source={items.user_ids}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, items.user_ids, selectedItems.map)}
                            onScroll={this.handleScroll}
                        />
                    )}
                    {searchItems && publicItems && (
                        <VirtualizedList
                            ref={this.searchListRef}
                            className='contacts-list contacts-search-list'
                            source={searchItems.user_ids.concat(publicItems.user_ids)}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, searchItems.user_ids.concat(publicItems.user_ids), selectedItems.map)}
                            onScroll={this.handleScroll}
                        />
                    )}
                </div>
            </>
        );
    }
}

AddParticipants.propTypes = {
    popup: PropTypes.bool,
    onClose: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(AddParticipants);
