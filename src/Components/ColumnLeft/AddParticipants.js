/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
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
        this.lastItemRef = React.createRef();
        this.itemsRef = new Map();

        this.state = {
            items: null,
            searchItems: null,
            selectedItems: {
                array: [],
                map: new Map()
            }
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
        const { selectedItems } = this.state;
        const { map, array } = selectedItems;

        const newMap = new Map(map);
        let newArray;
        let isDeleting = false;
        if (map.has(userId)) {
            newMap.delete(userId);
            newArray = array.filter(x => x !== userId);
            isDeleting = true;
        } else {
            newMap.set(userId, userId);
            newArray = array.concat([userId]);
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
        if (isDeleting) {
            wrapPanel.style.cssText = null;
        }

        this.setState({
            selectedItems: {
                array: newArray,
                map: newMap
            }
        }, () => {
            const currentHeight = wrapPanel.scrollHeight;
            const currentOffsetHeight = wrapPanel.offsetHeight;

            const expanded = currentHeight > prevHeight;
            const collapsed = currentHeight < prevHeight;
            // console.log('[wrap]', prevHeight, prevOffsetHeight, currentHeight, currentOffsetHeight, expanded, collapsed);

            const maxHeight = 123;
            if (expanded) {
                if (prevHeight < maxHeight) {
                    // console.log('[wrap] animate expand', Math.min(prevHeight, maxHeight), Math.min(currentHeight, maxHeight));
                    wrapPanel.style.cssText = `max-height: ${Math.min(prevHeight, maxHeight)}px;`;
                    // console.log('[wrap] animate expand', wrapPanel.style.cssText);
                    requestAnimationFrame(() => {
                        wrapPanel.style.cssText = `max-height: ${Math.min(currentHeight, maxHeight)}px;`;
                        setTimeout(() => {
                            this.lastItemRef.current.scrollIntoView({ behavior: 'auto' });
                        }, 250);
                        // console.log('[wrap] animate expand', wrapPanel.style.cssText);
                    });
                } else {
                    // console.log('[wrap] expand', prevHeight, maxHeight);
                    wrapPanel.style.cssText = `max-height: ${maxHeight}px;`;
                    //wrapPanel.scrollTop = wrapPanel.scrollHeight;
                    this.lastItemRef.current.scrollIntoView({ behavior: 'smooth' });
                    // console.log('[wrap] expand', wrapPanel.style.cssText);
                }
            } else if (collapsed) {
                if (currentHeight < maxHeight) {
                    // console.log('[wrap] animate collapse', Math.min(prevHeight, maxHeight), Math.min(currentHeight, maxHeight));
                    wrapPanel.style.cssText = `min-height: ${Math.min(prevOffsetHeight, maxHeight)}px;`;
                    // console.log('[wrap] animate collapse', wrapPanel.style.cssText);
                    requestAnimationFrame(() => {
                        wrapPanel.style.cssText = `min-height: ${Math.min(currentHeight, maxHeight)}px;`;
                        // console.log('[wrap] animate collapse', wrapPanel.style.cssText);
                    });
                } else {
                    // console.log('[wrap] collapse', prevHeight, maxHeight);
                    wrapPanel.style.cssText = `max-height: ${maxHeight}px;`;
                    // console.log('[wrap] collapse', wrapPanel.style.cssText);
                }
            } else {
                if (isDeleting) {
                    wrapPanel.style.cssText = prevCSSText;
                } else {
                    this.lastItemRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }

            for (let key of this.itemsRef.keys()) {
                const el = this.itemsRef.get(key);
                if (el) {
                    const currentOffset = el.getOffset();
                    const prevOffset = prevMap.has(key) ? prevMap.get(key) : null;
                    if (prevOffset) {
                        const text = `transform: translate(${prevOffset.left - currentOffset.left}px, ${prevOffset.top - currentOffset.top}px)`;
                        el.setStyleCSSText(text);
                    }
                }
            }

            requestAnimationFrame(() => {
                for (let key of this.itemsRef.keys()) {
                    const el = this.itemsRef.get(key);
                    if (el) {
                        const transition = `transition: transform 0.25s ease`;

                        el.setStyleCSSText(transition);
                    }
                }
            });
        });
    };

    renderItem = ({ index, style }, items, selectedItemsMap) => {
        const userId = items.user_ids[index];
        const isSelected = selectedItemsMap.has(userId);

        return <UserListItem key={userId} userId={userId} selected={isSelected} onClick={() => this.handleOpenUser(userId)} style={style} />;
    };

    handleSearch = async text => {
        const query = text.trim();
        if (!query) {
            this.setState({
                searchItems: null
            });
            return;
        }

        const searchItems = await TdLibController.send({
            '@type': 'searchContacts',
            query,
            limit: 1000
        });
        searchItems.user_ids = searchItems.user_ids.sort((x, y) =>
            getUserFullName(x).localeCompare(getUserFullName(y))
        );

        const store = FileStore.getStore();
        loadUsersContent(store, searchItems.user_ids.slice(0, 20));

        this.setState({ searchItems });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: false
        });
    };

    render() {
        const { popup } = this.props;
        const { items, searchItems, selectedItems } = this.state;

        const style = popup ? { minHeight: 800 } : null;

        this.itemsRef.clear();

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        { popup ? <CloseIcon/> : <ArrowBackIcon /> }
                    </IconButton>
                    <SearchInput inputRef={this.searchInputRef} onChange={this.handleSearch} />
                </div>
                <div ref={this.wrapPanelRef} className='animated-wrap-panel'>
                    {selectedItems.array.map(x => <UserChip ref={el => { this.itemsRef.set(x, el); }} key={x} userId={x} onClick={() => this.handleOpenUser(x)}/>)}
                    <div ref={this.lastItemRef}/>
                </div>
                {/*<div className='contacts-border'/>*/}
                <div className='contacts-content' style={style}>
                    {items && (
                        <VirtualizedList
                            ref={this.listRef}
                            className='contacts-list'
                            source={items.user_ids}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, items, selectedItems.map)}
                            onScroll={this.handleScroll}
                        />
                    )}
                    {searchItems && (
                        <VirtualizedList
                            ref={this.searchListRef}
                            className='contacts-list contacts-search-list'
                            source={searchItems.user_ids}
                            rowHeight={72}
                            overScanCount={20}
                            renderItem={x => this.renderItem(x, searchItems, selectedItems.map)}
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

export default AddParticipants;
