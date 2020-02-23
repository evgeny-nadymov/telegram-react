/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';

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

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;

        const { renderIds } = this.state;
        const { renderIds: nextRenderIds } = nextState;

        if (renderIds.size === nextRenderIds.size) {
            renderIds.forEach((value, key) => {
                if (!nextRenderIds.has(key)) {
                    return true;
                }
            });

            return false;
        }

        return true;
    }

    componentDidMount() {
        const { source } = this.props;
        const { scrollTop } = this.state;

        const { current } = this.listRef;
        if (!current) return;

        current.addEventListener('scroll', this.setScrollPosition, true);

        const viewportHeight = parseFloat(window.getComputedStyle(current, null).getPropertyValue('height'));

        const renderIds = this.getRenderIds(source, viewportHeight, scrollTop);

        this.setState({ viewportHeight, ...renderIds });
    }

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
        const { viewportHeight, scrollTop, renderIds, renderIdsList } = this.state;

        const items = (source || []).map((item, index) => {
            return renderIds.has(index) && renderItem({ index, style: style.item(index, rowHeight) });
        });

        // const items = (renderIdsList || []).map((item, index) => {
        //     return renderItem({ index: item, style: style.item(item, rowHeight) });
        // });

        return (
            <div ref={this.listRef} className={className}>
                <div style={style.listWrapper((source || []).length * rowHeight)}>{items}</div>
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
