/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './VirtualizedList.css';

const style = {
    listWrapper: height => ({
        height,
        position: 'relative'
    }),
    item: (index, height) => ({
        height,
        left: 0,
        right: 0,
        top: height * index,
        position: 'absolute'
    })
};

export class VirtualizedList extends React.Component {
    constructor(props) {
        super(props);

        this.listRef = React.createRef();

        this.state = {
            scrollTop: 0,
            renderIds: new Map(),
            renderIdsList: [],
            viewportHeight: 0
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.source !== this.props.source) {
            this.setViewportHeight();
        }
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;

        // const { renderIds } = this.state;
        // const { renderIds: nextRenderIds } = nextState;
        //
        // if (renderIds.size === nextRenderIds.size) {
        //     renderIds.forEach((value, key) => {
        //         if (!nextRenderIds.has(key)) {
        //             return true;
        //         }
        //     });
        //
        //     return false;
        // }
        //
        // return true;
    }

    componentDidMount() {
        window.addEventListener('resize', this.setViewportHeight, true);

        const { current } = this.listRef;
        if (!current) return;
        current.addEventListener('scroll', this.setScrollPosition, true);

        this.setViewportHeight();
    }

    setViewportHeight = () => {
        const { source } = this.props;
        const { scrollTop } = this.state;
        const { current } = this.listRef;
        if (!current) return;

        const viewportHeight = parseFloat(window.getComputedStyle(current, null).getPropertyValue('height'));
        const renderIds = this.getRenderIds(source, viewportHeight, scrollTop);

        // console.log('[vl] setViewportHeight');
        this.setState({ viewportHeight, ...renderIds });
    };

    getRenderIds(source, viewportHeight, scrollTop) {
        const renderIds = new Map();
        const renderIdsList = [];
        source.forEach((item, index) => {
            if (this.isVisibleItem(index, viewportHeight, scrollTop)) {
                renderIds.set(index, index);
                renderIdsList.push(index);
            }
        });

        return { renderIds, renderIdsList };
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setViewportHeight);

        const { current } = this.listRef;
        if (!current) return;
        current.removeEventListener('scroll', this.setScrollPosition);
    }

    getListRenderIds() {
        const { renderIds } = this.state;

        return renderIds;
    }

    setScrollPosition = event => {
        const { source, rowHeight, onScroll } = this.props;
        const { viewportHeight, scrollTop } = this.state;

        if (Math.abs(event.target.scrollTop - scrollTop) >= rowHeight) {
            const renderIds = this.getRenderIds(source, viewportHeight, event.target.scrollTop);

            this.setState({
                scrollTop: event.target.scrollTop,
                ...renderIds
            });
        }

        if (onScroll) {
            onScroll(event);
        }
    };

    getListRef() {
        return this.listRef;
    }

    isVisibleItem = (index, viewportHeight, scrollTop) => {
        const { overScanCount, rowHeight } = this.props;

        const itemTop = index * rowHeight;
        const itemBottom = (index + 1) * rowHeight;

        return (
            itemTop > scrollTop - overScanCount * rowHeight &&
            itemBottom < scrollTop + viewportHeight + overScanCount * rowHeight
        );
    };

    render() {
        const { className, source, renderItem, rowHeight } = this.props;
        const { renderIds } = this.state;
        
        const items = (source || []).map((item, index) => {
            return renderIds.has(index) && renderItem({ index, style: style.item(index, rowHeight) });
        });

        // console.log('[vl] render', source, renderIds);

        return (
            <div ref={this.listRef} className={classNames('vlist', className)}>
                <div style={style.listWrapper((source || []).length * rowHeight)}>
                    {items}
                </div>
                {/* <div className='vlist-top-border'/> */}
            </div>
        );
    }
}

VirtualizedList.defaultProps = {
    source: [],
    rowHeight: 72,
    overScanCount: 5
};

VirtualizedList.propTypes = {
    renderItem: PropTypes.func,
    onScroll: PropTypes.func,
    rowHeight: PropTypes.number,
    className: PropTypes.string,
    source: PropTypes.array.isRequired,
    overScanCount: PropTypes.number.isRequired
};

export default VirtualizedList;
