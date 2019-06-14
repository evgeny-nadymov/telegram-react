/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Animator from '../../Utils/Animatior';
import Sticker from './../Message/Media/Sticker';
import { accentStyles, borderStyle } from '../Theme';
import { ANIMATION_DURATION_500MS } from '../../Constants';
import StickerStore from '../../Stores/StickerStore';
import './StickersPickerHeader.css';

const styles = theme => ({
    ...borderStyle(theme),
    ...accentStyles(theme)
});

class StickersPickerHeader extends React.Component {
    constructor(props) {
        super(props);

        this.state = { position: 0 };

        this.scrollRef = React.createRef();
        this.anchorRef = React.createRef();
    }

    componentDidMount() {
        StickerStore.on('clientUpdateStickerSetPosition', this.onClientUpdateStickerSetPosition);
    }

    componentWillUnmount() {
        StickerStore.removeListener('clientUpdateStickerSetPosition', this.onClientUpdateStickerSetPosition);
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
        const scrollTo = position * 44 - 147;

        const anchorFrom = Number(anchorNode.style.left.replace('px', ''));
        const anchorTo = position * 44;

        if (animator) {
            animator.stop();
        }
        this.animator = new Animator(ANIMATION_DURATION_500MS, [
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
        this.animator.start();
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
        const { classes, stickers } = this.props;

        const items = stickers.map(x => (
            <Sticker
                key={x.sticker.id}
                className='stickers-picker-header-sticker'
                preview
                sticker={x}
                displaySize={32}
                blur={false}
                openMedia={() => this.handleSelect(x)}
            />
        ));

        return (
            <div className={classNames('stickers-picker-header', classes.borderColor)}>
                <div ref={this.scrollRef} className='stickers-picker-header-scroll' onWheel={this.handleWheel}>
                    <div className='stickers-picker-header-items'>{items}</div>
                    <div
                        ref={this.anchorRef}
                        className={classNames('stickers-picker-header-anchor', classes.accentBackgroundDark)}
                    />
                </div>
            </div>
        );
    }
}

StickersPickerHeader.propTypes = {
    stickers: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default withStyles(styles)(StickersPickerHeader);
