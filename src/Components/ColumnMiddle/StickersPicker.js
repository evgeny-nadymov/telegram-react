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
import { compose } from '../../Utils/HOC';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import { withTranslation } from 'react-i18next';
import StickerSet from './StickerSet';
import StickersPickerHeader from './StickersPickerHeader';
import { debounce, throttle } from '../../Utils/Common';
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { getNeighborStickersFromSets, getStickers } from '../../Utils/Media';
import FileStore from '../../Stores/FileStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickersPicker.css';

class StickersPicker extends React.Component {
    constructor(props) {
        super(props);

        this.scrollRef = React.createRef();
        this.itemsMap = new Map();
        this.loadedSets = new Map();

        this.state = {
            recent: null,
            stickerSets: null,
            sets: [],
            headerStickers: [],
            position: 0
        };

        this.loadInViewContentOnScrollEnd = debounce(this.loadInViewContentOnScrollEnd, 100);
        this.loadInViewContentOnScroll = throttle(this.loadInViewContentOnScroll, 2000);
        this.updatePosition = throttle(this.updatePosition, 250);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { position, recent, stickerSets, sets, showPreview } = this.state;

        if (nextState.recent !== recent) {
            return true;
        }

        if (nextState.stickerSets !== stickerSets) {
            return true;
        }

        if (nextState.sets !== sets) {
            return true;
        }

        if (nextState.showPreview !== showPreview) {
            return true;
        }

        if (nextState.position !== position) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        StickerStore.on('updateInstalledStickerSets', this.onUpdateInstalledStickerSets);
        StickerStore.on('updateRecentStickers', this.onUpdateRecentStickers);
    }

    componentWillUnmount() {
        StickerStore.off('updateInstalledStickerSets', this.onUpdateInstalledStickerSets);
        StickerStore.off('updateRecentStickers', this.onUpdateRecentStickers);
    }

    stop() {

    }

    onUpdateInstalledStickerSets = update => {
        const { is_masks, sticker_set_ids } = update;
        if (!is_masks) return;

        this.filterSets();
    };

    onUpdateRecentStickers = update => {
        this.reloadRecentContent();
    };

    filterSets(sticker_set_ids) {
        const { sets, stickerSets } = this.state;
    }

    async reloadRecentContent() {
        const recent = await TdLibController.send({
            '@type': 'getRecentStickers',
            is_attached: false
        });

        this.setState({
            recent
        });
    }

    scrollTop = () => {
        this.scrollRef.current.scrollTop = 0;
    };

    loadContent = async (recent, stickerSets, sets) => {
        // console.log('[sp] loadContent', recent, stickerSets, sets);

        if (!recent) {
            recent = await TdLibController.send({
                '@type': 'getRecentStickers',
                is_attached: false
            });
        }

        if (!sets) {
            const result = await TdLibController.send({
                '@type': 'getInstalledStickerSets',
                is_masks: false
            });

            const promises = [];
            result.sets.forEach(x => {
                promises.push(
                    TdLibController.send({
                        '@type': 'getStickerSet',
                        set_id: x.id
                    })
                );
            });

            sets = await Promise.all(promises);
        }

        const slicedSets = sets.slice(0, 5);
        const headerStickers = sets.reduce((preview, set) => {
            if (set.stickers.length > 0) {
                preview.push(set.stickers[0]);
            }
            return preview;
        }, []);

        this.setState({
            recent,
            stickerSets,
            sets: slicedSets,
            fullSets: sets,
            headerStickers
        });
        this.setsLength = slicedSets.length;
    };

    loadInViewContentOnScroll = () => {
        this.loadInViewContent();
    };

    loadInViewContentOnScrollEnd = () => {
        this.loadInViewContent(400);
    };

    loadInViewContent = (padding = 0) => {
        // console.log('[sp] loadInViewContent');
        const scroll = this.scrollRef.current;

        const { sets } = this.state;

        const inViewItems = [];
        sets.forEach(x => {
            const item = this.itemsMap.get(x.id);
            const node = ReactDOM.findDOMNode(item);
            if (node) {
                const topBorder = scroll.scrollTop - padding;
                const bottomBorder = scroll.scrollTop + scroll.offsetHeight + padding;

                const nodeTop = node.offsetTop;
                const nodeBottom = node.offsetTop + node.clientHeight;

                if (nodeTop >= topBorder && node.offsetTop <= bottomBorder) {
                    inViewItems.push(x);
                } else if (nodeBottom >= topBorder && nodeBottom <= bottomBorder) {
                    inViewItems.push(x);
                } else if (nodeTop <= topBorder && nodeBottom >= bottomBorder) {
                    inViewItems.push(x);
                }
            }
        });

        inViewItems.forEach(x => {
            const store = FileStore.getStore();
            if (!this.loadedSets.has(x.id)) {
                this.loadedSets.set(x.id, x.id);
                loadStickerSetContent(store, x);
            }
        });
    };

    updatePosition = () => {
        const scroll = this.scrollRef.current;

        const { recent, sets } = this.state;
        let minDiff = scroll.scrollHeight;
        let position = 0;
        let startPosition = 0;
        if (recent && recent.stickers.length > 0) {
            startPosition = 1;
            const element = this.itemsMap.get('recent');
            if (element) {
                const node = ReactDOM.findDOMNode(element);
                if (node && node.offsetTop <= scroll.scrollTop) {
                    const offsetTop = node.offsetTop;
                    if (node && offsetTop <= scroll.scrollTop) {
                        const diff = Math.abs(scroll.scrollTop - offsetTop);
                        if (diff <= minDiff) {
                            minDiff = diff;
                            position = 0;
                        }
                    }
                }
            }
        }
        sets.forEach((x, pos) => {
            const element = this.itemsMap.get(x.id);
            if (element) {
                const node = ReactDOM.findDOMNode(element);
                if (node && node.offsetTop <= scroll.scrollTop) {
                    const offsetTop = node.offsetTop;
                    if (node) {
                        const diff = Math.abs(scroll.scrollTop - offsetTop);
                        if (diff <= minDiff) {
                            minDiff = diff;
                            position = startPosition + pos;
                        }
                    }
                }
            }
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSetPosition',
            position
        });
    };

    handleScroll = async () => {
        this.scrolling = true;
        const now = new Date();
        this.lastScrollTime = now;
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            if (now !== this.lastScrollTime) return;

            this.scrolling = false;
        }, 250);

        // console.log('[sp] handleScroll');
        //this.loadInViewContentOnScroll();
        this.loadInViewContentOnScrollEnd();
        this.updatePosition();

        const scroll = this.scrollRef.current;

        if (this.loadingChunk) return;

        let loadChunk = false;
        if (scroll.scrollTop + scroll.offsetHeight >= scroll.scrollHeight - 400) {
            loadChunk = true;
        }

        if (!loadChunk) {
            return false;
        }

        const { sets, stickerSets } = this.state;
        if (stickerSets.sets.length === sets.length) return;

        this.loadingChunk = true;
        const promises = [];
        stickerSets.sets.slice(this.setsLength, this.setsLength + 5).forEach(x => {
            promises.push(
                TdLibController.send({
                    '@type': 'getStickerSet',
                    set_id: x.id
                })
            );
        });

        const result = await Promise.all(promises).finally(() => {
            this.loadingChunk = false;
        });

        this.setsLength += result.length;
        this.setState({ sets: sets.concat(result) });
    };

    loadPreviewContent = stickerId => {
        const { recent, sets } = this.state;

        const sticker = getStickers([recent].concat(sets)).find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        const stickersPerRow = 5;
        const preloadStickers = getNeighborStickersFromSets(sticker, sets, stickersPerRow);
        preloadStickers.forEach(x => {
            loadStickerContent(store, x, null);
        });
    };

    handleMouseEnter = event => {
        const stickerId = Number(event.currentTarget.dataset.stickerId);
        if (!stickerId) return;

        if (!this.mouseDown) return;

        if (this.mouseDownStickerId !== stickerId) {
            this.mouseDownStickerId = null;
        }
        this.setState({ previewStickerId: stickerId });
        this.loadPreviewContent(stickerId);

        const { onPreview } = this.props;
        const { recent, sets } = this.state;

        const sticker = getStickers([recent].concat(sets)).find(x => x.sticker.id === stickerId);
        onPreview(sticker);
    };

    handleMouseDown = event => {
        const stickerId = Number(event.currentTarget.dataset.stickerId);
        if (!stickerId) return;

        this.mouseDownStickerId = stickerId;
        const now = Date.now();

        this.setState({ previewStickerId: stickerId, timestamp: now, showPreview: false, cancelSend: false });
        setTimeout(() => {
            const { timestamp } = this.state;
            if (timestamp === now) {
                this.setState({ showPreview: true, cancelSend: true }, () => {
                    const { onPreview } = this.props;
                    const { recent, sets } = this.state;

                    const sticker = getStickers([recent].concat(sets)).find(x => x.sticker.id === stickerId);
                    onPreview(sticker);
                });
            }
        }, 500);

        this.loadPreviewContent(stickerId);

        this.mouseDown = true;
        document.addEventListener('mouseup', this.handleMouseUp);

        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    handleMouseUp = () => {
        this.setState({ previewStickerId: 0, timestamp: 0, showPreview: false });

        const { onPreview } = this.props;

        onPreview(null);

        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    handleStickerSelect = sticker => {
        const { onSelect } = this.props;
        const { cancelSend } = this.state;

        if (cancelSend) return;

        onSelect(sticker);
    };

    handleSelectSet = async position => {
        const { sets, stickerSets } = this.state;
        const { scrollRef } = this;

        if (position === -1) {
            const scroll = scrollRef.current;
            scroll.scrollTop = 0;
        } else if (position < sets.length) {
            const element = this.itemsMap.get(sets[position].id);
            if (element) {
                const node = ReactDOM.findDOMNode(element);
                if (node) {
                    const scroll = scrollRef.current;
                    scroll.scrollTop = node.offsetTop;
                }
            }
        } else if (position < stickerSets.sets.length) {
            if (this.loadingChunk) return;
            if (stickerSets.sets.length === sets.length) return;

            this.loadingChunk = true;
            const promises = [];
            stickerSets.sets.slice(this.setsLength, position + 1).forEach(x => {
                promises.push(
                    TdLibController.send({
                        '@type': 'getStickerSet',
                        set_id: x.id
                    })
                );
            });

            const result = await Promise.all(promises).finally(() => (this.loadingChunk = false));

            this.setsLength += result.length;
            let concatSets = sets.concat(result);
            this.setState({ sets: concatSets }, () => {
                if (position < concatSets.length) {
                    this.handleSelectSet(position);
                }
            });
        }
    };

    handleDeleteRecent = () => {
        TdLibController.send({
            '@type': 'clearRecentStickers',
            is_attached: false
        });
    };

    handleDeleteStickerSet = id => {
        TdLibController.send({
            '@type': 'changeStickerSet',
            set_id: id,
            is_installed: false
        });
    };

    render() {
        const { t, style } = this.props;
        const { recent, stickerSets, sets, headerStickers } = this.state;
        // console.log('[sp] render', recent, stickerSets, sets);
        // if (!stickerSets) return null;
        //
        // if (!sets) return null;
        // if (!sets.length) return null;

        this.itemsMap.clear();
        const items = sets.map(x => (
            <StickerSet
                key={x.id}
                ref={el => this.itemsMap.set(x.id, el)}
                info={x}
                onSelect={this.handleStickerSelect}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
            />
        ));

        const recentInfo =
            recent && recent.stickers.length > 0
                ? {
                      stickers: recent.stickers,
                      title: t('RecentStickers')
                  }
                : null;

        return (
            <div className='stickers-picker' style={style}>
                <StickersPickerHeader
                    recent={recentInfo}
                    stickers={headerStickers}
                    onSelect={this.handleSelectSet} />
                <div ref={this.scrollRef} className={classNames('stickers-picker-scroll', 'scrollbars-hidden')} onScroll={this.handleScroll}>
                    {Boolean(recentInfo) && (
                        <StickerSet
                            ref={el => this.itemsMap.set('recent', el)}
                            info={recentInfo}
                            onSelect={this.handleStickerSelect}
                            onMouseDown={this.handleMouseDown}
                            onMouseEnter={this.handleMouseEnter}
                            onDeleteClick={this.handleDeleteRecent}
                        />
                    )}
                    {items}
                </div>
            </div>
        );
    }
}

StickersPicker.propTypes = {
    onSelect: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(StickersPicker);
