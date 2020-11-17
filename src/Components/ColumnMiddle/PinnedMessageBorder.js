/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './PinnedMessageBorder.css';

class PinnedMessageBorder extends React.Component {

    drawRect = (x, y, width, height, radius) => {
        return `M${x},${y + radius}a${radius},${radius},0,0,1,${width},0v${height - 2 * radius}a${radius},${radius},0,0,1,${-width},0Z`;
    };

    getClipPath = (id, barHeight, count) => {
        const radius = 1;

        let d = '';
        if (count === 3) {
            d = this.drawRect(0, 0, 2, barHeight, radius)
                + this.drawRect(0, 11, 2, barHeight + 1, radius)
                + this.drawRect(0, 23, 2, barHeight, radius);
        } else {
            for (let i = 0; i < count; i++) {
                d += this.drawRect(0, (barHeight + 2) * i, 2, barHeight, radius);
            }
        }

        return (
            <clipPath id={id}>
                <path d={d}/>
            </clipPath>
        );
    };

    getBarHeight = (count, index) => {
        let barHeight = 32;
        if (count === 1) {
            barHeight = 32;
        } else if (count === 2) {
            barHeight = 15;
        } else if (count === 3) {
            barHeight = 9;
        } else if (count === 4) {
            barHeight = 7;
        } else if (count > 3) {
            barHeight = 7;
        }

        return barHeight;
    };

    getMarkHeight = (count, index) => {
        let barHeight = 32;
        if (count === 1) {
            barHeight = 32;
        } else if (count === 2) {
            barHeight = 15;
        } else if (count === 3) {
            barHeight = index === 1 ? 10 : 9;
        } else if (count === 4) {
            barHeight = 7;
        } else if (count > 3) {
            barHeight = 7;
        }

        return barHeight;
    };

    getMarkTranslateY = (index, barHeight, count) => {
        if (count === 1) {
            return 0;
        } else if (count === 2) {
            return index === 0 ? 0 : barHeight + 2;
        }

        if (count === 3) {
            if (index === 0) {
                return 0;
            } else if (index === 1) {
                return 11;
            }

            return 23;
        } else {
            return (barHeight + 2) * index;
        }
    };

    getTrackTranslateY = (index, count, barHeight, trackHeight) => {
        if (count <= 4) {
            return 0;
        }

        if (index <= 1) {
            return 0;
        } else if (index >= count - 2) {
            return trackHeight - 32;
        }

        return (barHeight + 4) / 2 + (index - 2) * (barHeight + 2);
    };

    getTrackHeight = (count, barHeight) => {
        return count <= 3 ? 32 : barHeight * count + 2 * (count - 1);
    };

    render() {
        const { count, index } = this.props;
        if (count === 1) {
            return (
                <div className='pinned-message-border'>
                    <div className='pinned-message-border-wrapper-1'/>
                </div>);
        }

        const barHeight = this.getBarHeight(count, index);
        const markHeight = this.getMarkHeight(count, index);
        const trackHeight = this.getTrackHeight(count, barHeight);

        const clipPathId = `clipPath_${count}`;
        const clipPath = this.getClipPath(clipPathId, barHeight, count);

        const markTranslateY = this.getMarkTranslateY(index, barHeight, count);
        const trackTranslateY = this.getTrackTranslateY(index, count, barHeight, trackHeight);

        return (
            <div className={classNames('pinned-message-border', { 'pinned-message-border-mask': count > 4 })}>
                <div className='pinned-message-border-wrapper' style={{ clipPath: `url(#${clipPathId})`, width: 2, height: trackHeight, transform: `translateY(-${trackTranslateY}px)` }}>
                    <svg height='0' width='0'>
                        <defs>{clipPath}</defs>
                    </svg>
                    <div className='pinned-message-border-mark' style={{ height: markHeight, transform: `translateY(${markTranslateY}px)` }}/>
                </div>
            </div>
        );
    }
}

PinnedMessageBorder.propTypes = {
    count: PropTypes.number,
    index: PropTypes.number
};

export default PinnedMessageBorder;