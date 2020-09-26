/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from '../../Utils/HOC';
import withTheme from '@material-ui/core/styles/withTheme';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '../../Assets/Icons/Smile';
import { Picker as EmojiPicker } from 'emoji-mart';
// import { NimblePicker as EmojiPicker } from 'emoji-mart';
// import data from 'emoji-mart/data/messenger.json'
import AnimationPreview from './AnimationPreview';
import StickerPreview from './StickerPreview';
import StickersPicker from './StickersPicker';
import GifsPicker from './GifsPicker';
import { isAppleDevice } from '../../Utils/Common';
import { loadStickerThumbnailContent, loadStickerSetContent, loadRecentStickersContent, loadAnimationThumbnailContent } from '../../Utils/File';
import { EMOJI_PICKER_TIMEOUT_MS } from '../../Constants';
import AnimationStore from '../../Stores/AnimationStore';
import AppStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './EmojiPickerButton.css';

class EmojiPickerButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            tab: 0
        };

        this.emojiPickerRef = React.createRef();
        this.stickersPickerRef = React.createRef();
        this.gifsPickerRef = React.createRef();
    }

    componentDidMount() {
        AppStore.on('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateChange);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.off('clientUpdateLanguageChange', this.onClientUpdateChange);
    }

    onClientUpdateChange = update => {
        const { open } = this.state;

        if (open) {
            this.removePicker = true;
        } else {
            this.picker = null;
        }
    };

    handleButtonMouseEnter = event => {
        this.buttonEnter = true;
        setTimeout(() => {
            if (!this.buttonEnter) return;

            this.updatePicker(true);
            this.loadStickerSets();
            this.loadSavedAnimations();

            if (this.state.tab === 2) {
                const gifsPicker = this.gifsPickerRef.current;
                if (gifsPicker) {
                    gifsPicker.start();
                }
            }
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    loadSavedAnimations = async () => {
        let { savedAnimations } = AnimationStore;
        if (!savedAnimations) {
            const result = await TdLibController.send({
                '@type': 'getSavedAnimations'
            });

            AnimationStore.savedAnimations = result;
            savedAnimations = result;
        }

        // load content
        const store = FileStore.getStore();
        const previewAnimations = savedAnimations.animations.slice(0, 1000);

        // console.log('[sp] loadAnimationThumbnailContent', previewAnimations);
        previewAnimations.forEach(x => {
            loadAnimationThumbnailContent(store, x);
        });
    };

    loadStickerSets = async () => {
        if (this.sets) return;

        this.recent = await TdLibController.send({
            '@type': 'getRecentStickers',
            is_attached: false
        });

        this.stickerSets = await TdLibController.send({
            '@type': 'getInstalledStickerSets',
            is_masks: false
        });

        const promises = [];
        this.stickerSets.sets.forEach(x => {
            promises.push(
                TdLibController.send({
                    '@type': 'getStickerSet',
                    set_id: x.id
                })
            );
        });

        this.sets = await Promise.all(promises);

        const node = this.stickersPickerRef.current;

        const store = FileStore.getStore();
        loadRecentStickersContent(store, this.recent);

        const previewSets = this.sets.slice(0, 5).reverse();
        previewSets.forEach(x => {
            loadStickerSetContent(store, x);
            node.loadedSets.set(x.id, x.id);
        });

        const previewStickers = this.sets.reduce((stickers, set) => {
            if (set.stickers.length > 0) {
                stickers.push(set.stickers[0]);
            }
            return stickers;
        }, []);
        previewStickers.forEach(x => {
            loadStickerThumbnailContent(store, x);
        });
    };

    handleButtonMouseLeave = () => {
        this.buttonEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    tryClosePicker = () => {
        // return;

        const { animation, sticker } = this.state;
        if (this.paperEnter || this.buttonEnter || sticker || animation) return;

        this.updatePicker(false);
    };

    handlePaperMouseEnter = () => {
        this.paperEnter = true;
    };

    handlePaperMouseLeave = () => {
        // return;

        this.paperEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    updatePicker = open => {
        this.setState({ open }, () => {
            if (!this.state.open) {
                if (this.removePicker) {
                    this.picker = null;
                    this.removePicker = false;
                }

                const gifsPicker = this.gifsPickerRef.current;
                if (gifsPicker) {
                    gifsPicker.stop();
                }
            }
        });
    };

    handleEmojiClick = () => {
        this.setState({ tab: 0 });

        const gifsPicker = this.gifsPickerRef.current;
        if (gifsPicker) {
            gifsPicker.stop();
        }

        const stickersPicker = this.stickersPickerRef.current;
        if (stickersPicker) {
            stickersPicker.stop();
        }
    };

    handleStickersClick = () => {
        const stickersPicker = this.stickersPickerRef.current;
        const { tab } = this.state;

        // console.log('[sp] handleStickersClick');

        if (tab === 1) {
            if (stickersPicker) {
                stickersPicker.scrollTop();
            }
        } else {
            setTimeout(() => {
                // console.log('[sp] handleStickersClick.loadContent');
                stickersPicker.loadContent(this.recent, this.stickerSets, this.sets);
            }, 150);

            this.setState({ tab: 1 });
        }

        const gifsPicker = this.gifsPickerRef.current;
        if (gifsPicker) {
            gifsPicker.stop();
        }
    };

    handleGifsClick = () => {
        const gifsPicker = this.gifsPickerRef.current;
        const { tab } = this.state;

        if (tab === 2) {
            if (gifsPicker) {
                gifsPicker.scrollTop();
            }
        } else {
            const { savedAnimations } = AnimationStore;

            setTimeout(() => {
                gifsPicker.loadContent(savedAnimations);
                gifsPicker.start();
            }, 150);

            this.setState({ tab: 2 });
        }

        const stickersPicker = this.stickersPickerRef.current;
        if (stickersPicker) {
            stickersPicker.stop();
        }
    };

    handleStickerSend = sticker => {
        if (!sticker) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSend',
            sticker
        });

        this.updatePicker(false);
    };

    handleStickerPreview = sticker => {
        this.setState({ sticker });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker
        });

        if (!sticker) {
            this.tryClosePicker();
        }
    };

    handleGifSend = animation => {
        if (!animation) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateAnimationSend',
            animation
        });

        this.updatePicker(false);
    };

    handleGifPreview = animation => {
        this.setState({ animation });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAnimationPreview',
            animation
        });

        if (!animation) {
            this.tryClosePicker();
        }
    };

    render() {
        const { theme, t } = this.props;
        const { open, tab, animation, sticker } = this.state;

        if (open && !this.picker) {
            const i18n = {
                search: t('Search'),
                notfound: t('NotEmojiFound'),
                skintext: t('ChooseDefaultSkinTone'),
                categories: {
                    search: t('SearchResults'),
                    recent: t('Recent'),
                    people: t('SmileysPeople'),
                    nature: t('AnimalsNature'),
                    foods: t('FoodDrink'),
                    activity: t('Activity'),
                    places: t('TravelPlaces'),
                    objects: t('Objects'),
                    symbols: t('Symbols'),
                    flags: t('Flags'),
                    custom: t('Custom')
                }
            };

            this.picker = (
                <EmojiPicker
                    ref={this.emojiPickerRef}
                    // data={data}
                    set='apple'
                    showPreview={false}
                    showSkinTones={false}
                    onSelect={this.props.onSelect}
                    color={theme.palette.primary.dark}
                    i18n={i18n}
                    native={isAppleDevice()}
                    style={{ width: 338, overflowX: 'hidden', position: 'absolute', left: 0, top: 0 }}
                />
            );

            this.stickersPicker = (
                <StickersPicker
                    ref={this.stickersPickerRef}
                    onSelect={this.handleStickerSend}
                    onPreview={this.handleStickerPreview}
                    style={{ position: 'absolute', left: 338, top: 0 }}
                />
            );

            this.gifsPicker = (
                <GifsPicker
                    ref={this.gifsPickerRef}
                    onSelect={this.handleGifSend}
                    onPreview={this.handleGifPreview}
                    style={{ width: 338, overflowX: 'hidden', position: 'absolute', left: 676, top: 0 }}
                />
            );
        }

        return (
            <>
                <link
                    rel='stylesheet'
                    type='text/css'
                    href={theme.palette.type === 'dark' ? 'emoji-mart.dark.css' : 'emoji-mart.light.css'}
                />
                <IconButton
                    className='inputbox-icon-button'
                    aria-label='Emoticon'
                    onMouseEnter={this.handleButtonMouseEnter}
                    onMouseLeave={this.handleButtonMouseLeave}>
                    <InsertEmoticonIcon />
                </IconButton>
                <div
                    className={classNames('emoji-picker-root', { 'emoji-picker-root-opened': open })}
                    onMouseEnter={this.handlePaperMouseEnter}
                    onMouseLeave={this.handlePaperMouseLeave}>
                    <div className={classNames('emoji-picker-content', { 'emoji-picker-content-stickers': tab === 1 }, { 'emoji-picker-content-gifs': tab === 2 })}>
                        {this.picker}
                        {this.stickersPicker}
                        {this.gifsPicker}
                    </div>
                    <div className='emoji-picker-header'>
                        <Button
                            color={tab === 0 ? 'primary' : 'default'}
                            className='emoji-picker-header-button'
                            onClick={this.handleEmojiClick}>
                            {t('Emoji')}
                        </Button>
                        <Button
                            color={tab === 1 ? 'primary' : 'default'}
                            className='emoji-picker-header-button'
                            onClick={this.handleStickersClick}>
                            {t('AccDescrStickers')}
                        </Button>
                        <Button
                            color={tab === 2 ? 'primary' : 'default'}
                            className='emoji-picker-header-button'
                            onClick={this.handleGifsClick}>
                            {t('AttachGif')}
                        </Button>
                    </div>
                </div>
                {Boolean(sticker) && <StickerPreview sticker={sticker} />}
                {Boolean(animation) && <AnimationPreview animation={animation} />}
            </>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withTheme
);

export default enhance(EmojiPickerButton);
