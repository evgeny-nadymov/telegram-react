/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import { Picker as EmojiPicker } from 'emoji-mart';
import StickersPicker from './StickersPicker';
import { EMOJI_PICKER_TIMEOUT_MS, STICKER_PREVIEW_DISPLAY_SIZE } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './EmojiPickerButton.css';
import { loadStickerSetContent } from '../../Utils/File';
import StickerPreview from './StickerPreview';

const styles = theme => ({
    iconButton: {
        margin: '8px 0px'
    },
    headerButton: {
        borderRadius: 0,
        flex: '50%'
    },
    pickerRoot: {
        width: 338,
        overflowX: 'hidden',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[8],
        position: 'absolute',
        bottom: 80,
        display: 'none'
    },
    pickerRootOpened: {
        display: 'block'
    }
});

class EmojiPickerButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            open: false,
            tab: 0
        };

        this.stickersPickerRef = React.createRef();
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.on('clientUpdateLanguageChange', this.onClientUpdateChange);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateThemeChange', this.onClientUpdateChange);
        LocalizationStore.removeListener('clientUpdateLanguageChange', this.onClientUpdateChange);
    }

    onClientUpdateChange = update => {
        this.picker = null;
    };

    handleButtonMouseEnter = event => {
        this.buttonEnter = true;
        setTimeout(() => {
            if (!this.buttonEnter) return;

            this.updatePicker(true);
            this.loadStickerSets();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    loadStickerSets = async () => {
        if (this.sets) return;

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

        const store = FileStore.getStore();
        const previewSets = this.sets.slice(0, 5).reverse();
        previewSets.forEach(x => {
            loadStickerSetContent(store, x);
        });
    };

    handleButtonMouseLeave = () => {
        this.buttonEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    tryClosePicker = () => {
        const { sticker } = this.state;
        if (this.paperEnter || this.buttonEnter || sticker) return;

        this.updatePicker(false);
    };

    handlePaperMouseEnter = () => {
        this.paperEnter = true;
    };

    handlePaperMouseLeave = () => {
        this.paperEnter = false;
        setTimeout(() => {
            this.tryClosePicker();
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    updatePicker = open => {
        this.setState({ open });
    };

    switchPicker = () => {
        this.updatePicker(!this.state.open);
    };

    handleEmojiClick = () => {
        this.setState({ tab: 0 });
    };

    handleStickersClick = () => {
        this.stickersPickerRef.current.loadContent(this.stickerSets, this.sets);

        this.setState({ tab: 1 });
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

        if (!sticker) {
            this.tryClosePicker();
        }
    };

    render() {
        const { classes, theme, t } = this.props;
        const { open, tab, sticker } = this.state;

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
                    set='apple'
                    showPreview={false}
                    showSkinTones={false}
                    onSelect={this.props.onSelect}
                    color={theme.palette.primary.dark}
                    i18n={i18n}
                    style={{ width: 338, overflowX: 'hidden' }}
                />
            );

            this.stickersPicker = (
                <StickersPicker
                    ref={this.stickersPickerRef}
                    onSelect={this.handleStickerSend}
                    onPreview={this.handleStickerPreview}
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
                    className={classes.iconButton}
                    aria-label='Emoticon'
                    onClick={this.switchPicker}
                    onMouseEnter={this.handleButtonMouseEnter}
                    onMouseLeave={this.handleButtonMouseLeave}>
                    <InsertEmoticonIcon />
                </IconButton>
                <div
                    className={classNames(classes.pickerRoot, { [classes.pickerRootOpened]: open })}
                    onMouseEnter={this.handlePaperMouseEnter}
                    onMouseLeave={this.handlePaperMouseLeave}>
                    <div className='emoji-picker-header'>
                        <Button
                            color={tab === 0 ? 'primary' : 'default'}
                            className={classes.headerButton}
                            onClick={this.handleEmojiClick}>
                            {t('Emoji')}
                        </Button>
                        <Button
                            color={tab === 1 ? 'primary' : 'default'}
                            className={classes.headerButton}
                            onClick={this.handleStickersClick}>
                            {t('Stickers')}
                        </Button>
                    </div>
                    <div className={classNames('emoji-picker-content', { 'emoji-picker-content-stickers': tab === 1 })}>
                        {this.picker}
                        {this.stickersPicker}
                    </div>
                    <StickerPreview sticker={sticker} />
                </div>
            </>
        );
    }
}

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(EmojiPickerButton);
