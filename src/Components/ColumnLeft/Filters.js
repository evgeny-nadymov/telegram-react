/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import Animator from '../../Utils/Animatior';
import { clamp, getFirstLetter, throttle } from '../../Utils/Common';
import AppStore from '../../Stores/ApplicationStore';
import CacheStore from '../../Stores/CacheStore';
import FilterStore from '../../Stores/FilterStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Filters.css';

class Filters extends React.Component {
    constructor(props) {
        super(props);

        this.filterRef = new Map();
        this.filtersRef = React.createRef();
        this.filterSelectionRef = React.createRef();

        const { isSmallWidth } = AppStore;
        const { filters, chatList } = FilterStore;

        this.state = {
            isSmallWidth,
            filters,
            chatList
        };

        this.onWindowResize = throttle(this.onWindowResize, 250);
    }

    componentDidMount() {
        this.observeResize();
        AppStore.on('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        FilterStore.on('clientUpdateChatList', this.onClientUpdateChatList);
        FilterStore.on('updateChatFilters', this.onUpdateChatFilters);
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateLanguageChange);

        this.setSelection();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.unobserveResize();
        this.observeResize();
    }

    componentWillUnmount() {
        this.unobserveResize();
        AppStore.off('clientUpdateCacheLoaded', this.onClientUpdateCacheLoaded);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        FilterStore.off('clientUpdateChatList', this.onClientUpdateChatList);
        FilterStore.off('updateChatFilters', this.onUpdateChatFilters);
        LocalizationStore.off('clientUpdateLanguageChange', this.onClientUpdateLanguageChange);
    }

    hasObserver = () => {
        return 'ResizeObserver' in window;
    };

    observeResize() {
        if (!this.hasObserver()) return;
        const filters = this.filtersRef.current;
        if (!filters) return;

        const observer = new ResizeObserver(this.onWindowResize);
        observer.observe(filters);

        this.resizeObserver = { observer, filters }
    }

    unobserveResize() {
        if (!this.hasObserver()) return;
        if (!this.resizeObserver) return;

        const { observer, filters } = this.resizeObserver;
        if (!observer) return;
        if (!filters) return;

        observer.unobserve(filters);
    }

    onClientUpdateLanguageChange = update => {
        if (!this.hasObserver()) this.setSelection(false);
    };

    onClientUpdateCacheLoaded = update => {
        const { filters } = this.state;
        if (filters) return;

        const { filters: cachedFilters } = CacheStore;
        if (!cachedFilters) return;

        this.setState({
            filters: cachedFilters
        }, () => {
            if (!this.hasObserver()) this.setSelection(false);
        });
    };

    onWindowResize = () => {
        this.setSelection(true);
    };

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = AppStore;
        this.setState({
            isSmallWidth
        }, () => {
            if (!this.hasObserver()) this.setSelection(false);
        });
    };

    setSelection = (transition = true) => {
        const { chatList, filters, isSmallWidth } = this.state;

        const scroll = this.filtersRef.current;
        const padding = 3;

        let item = null;
        let left = 9;
        if (chatList['@type'] === 'chatListMain') {
            const main = this.filterRef.get('chatListMain');
            if (main){
                item = main.firstChild;
                left = item.offsetLeft;
            }
        } else if (chatList['@type'] === 'chatListFilter') {
            for (let i = 0; i < filters.length; i++) {
                const filter = this.filterRef.get('chatListFilter_id=' + filters[i].id);
                if (filters[i].id === chatList.chat_filter_id) {
                    item = filter.firstChild;
                    left = item.offsetLeft;
                    break;
                }
            }
        }
        if (!item) return;

        const filterSelection = this.filterSelectionRef.current;
        if (filterSelection) {
            const transitionStyle = transition ? 'transition: left 0.25s ease, width 0.25s ease' : null;
            filterSelection.style.cssText = `left: ${left - padding}px; width: ${item.scrollWidth + 2 * padding}px; ${transitionStyle}`;
        }

        if (item && transition){
            const { animator } = this;

            if (animator) {
                animator.stop();
            }

            this.animator = new Animator(250, [
                {
                    from: scroll.scrollLeft,
                    to: clamp(left - scroll.offsetWidth / 2 + item.offsetWidth / 2, 0, scroll.scrollWidth - scroll.offsetWidth),
                    func: left => (scroll.scrollLeft = left)
                }
            ]);

            setTimeout(() => {
                if (!this.animator) return;

                this.animator.start();
            }, 0);


            // item.scrollIntoView();
        }
    };

    onUpdateChatFilters = update => {
        const { chatList } = this.state;
        const { filters } = FilterStore;

        this.setState({
            filters
        }, () => {
            if (chatList['@type'] === 'chatListFilter' && filters.findIndex(x => x.id === chatList.chat_filter_id) === -1) {
                this.handleMainClick();
            } else {
                if (!this.hasObserver()) this.setSelection();
            }
        });
    };

    onClientUpdateChatList = update => {
        const { chatList } = FilterStore;

        this.setState({
            chatList
        }, () => {
            if (!this.hasObserver()) this.setSelection();
        });
    };

    handleMainClick = event => {
        if (event && event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListMain'
            }
        });
    };

    handleFilterClick = (event, id) => {
        if (event && event.button !== 0) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatList',
            chatList: {
                '@type': 'chatListFilter',
                chat_filter_id: id
            }
        });
    };

    handleWheel = event => {
        if (!event.deltaY) {
            return;
        }

        event.currentTarget.scrollLeft += event.deltaY;
        event.stopPropagation();
    };

    render() {
        const { t } = this.props;
        const { filters, chatList, isSmallWidth } = this.state;

        if (!filters) return null;
        if (!filters.length) return null;

        this.filterRef = new Map();
        return (
            <div ref={this.filtersRef} className='filters' onWheel={this.handleWheel}>
                <div
                    ref={r => this.filterRef.set('chatListMain', r)}
                    className={classNames('filter', { 'item-selected': chatList['@type'] === 'chatListMain'})}
                    onMouseDown={this.handleMainClick}
                    title={isSmallWidth ? t('FilterAllChats') : null}>
                    <span>{isSmallWidth ? getFirstLetter(t('FilterAllChats')) : t('FilterAllChats')}</span>
                </div>
                {filters.map(x => (
                    <div
                        key={x.id}
                        ref={r => this.filterRef.set('chatListFilter_id=' + x.id, r)}
                        className={classNames('filter', { 'item-selected': chatList.chat_filter_id === x.id})}
                        onMouseDown={e => this.handleFilterClick(e, x.id)}
                        title={isSmallWidth ? x.title : null}>
                        <span>{isSmallWidth ? getFirstLetter(x.title) : x.title}</span>
                    </div>))}
                <div ref={this.filterSelectionRef} className='filter-selection'/>
            </div>
        );
    }
}

Filters.propTypes = {

};

export default withTranslation()(Filters);