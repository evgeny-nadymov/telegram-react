/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Animator from '../../Utils/Animatior';
import Sticker from './../Message/Media/Sticker';
import { StickerSourceEnum } from '../Message/Media/Sticker';
import StickerStore from '../../Stores/StickerStore';
import './StickersPickerHeader.css';

class StickersPickerHeader extends React.Component {
    constructor(props) {
        super(props);

        this.scrollRef = React.createRef();
        this.anchorRef = React.createRef();

        this.state = { position: 0 };
    }

    componentDidMount() {
        StickerStore.on('clientUpdateStickerSetPosition', this.onClientUpdateStickerSetPosition);
    }

    componentWillUnmount() {
        StickerStore.off('clientUpdateStickerSetPosition', this.onClientUpdateStickerSetPosition);
    }

    onClientUpdateStickerSetPosition = update => {
        const { position } = update;

        this.setState({ position });
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.position !== this.state.position) {
            this.scrollToPosition();
        }
    }

    scrollToPosition = () => {
        const { position } = this.state;
        const { animator, anchorRef, scrollRef } = this;

        const scroll = scrollRef.current;
        const anchor = anchorRef.current;
        const anchorNode = ReactDOM.findDOMNode(anchor);

        const scrollFrom = scroll.scrollLeft;
        const scrollTo = position * 48 - 147;

        const anchorFrom = Number(anchorNode.style.left.replace('px', ''));
        const anchorTo = position * 48;

        if (animator) {
            animator.stop();
        }

        this.animator = new Animator(0, [
            {
                from: scrollFrom,
                to: scrollTo,
                func: left => (scroll.scrollLeft = left)
            },
            {
                from:
                    Math.abs(anchorTo - anchorFrom) > 338
                        ? anchorTo - Math.sign(anchorTo - anchorFrom) * 338
                        : anchorFrom,
                to: anchorTo,
                func: left => (anchorNode.style.left = left + 'px')
            }
        ]);

        setTimeout(() => {
            if (!this.animator) return;

            this.animator.start();
        }, 0);
        // this.animator.start();
    };

    handleWheel = event => {
        const { scrollRef } = this;

        if (event.deltaX === 0) {
            const scroll = scrollRef.current;

            scroll.scrollLeft += event.deltaY;
        }
    };

    handleSelect = sticker => {
        const { stickers, onSelect } = this.props;

        onSelect(stickers.indexOf(sticker));
    };

    render() {
        const { stickers } = this.props;

        const items = stickers.map(x => (
            <Sticker
                key={x.sticker.id}
                className='stickers-picker-header-sticker'
                style={{ width: 36, height: 36 }}
                sticker={x}
                play={false}
                autoplay={false}
                blur={false}
                displaySize={32}
                preview
                source={StickerSourceEnum.PICKER_HEADER}
                openMedia={() => this.handleSelect(x)}
            />
        ));

        return (
            <div className='stickers-picker-header'>
                <div ref={this.scrollRef} className='stickers-picker-header-scroll' onWheel={this.handleWheel}>
                    <div className='stickers-picker-header-items'>{items}</div>
                    <div ref={this.anchorRef} className='stickers-picker-header-anchor' />
                </div>
            </div>
        );
    }
}

StickersPickerHeader.propTypes = {
    stickers: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default StickersPickerHeader;
