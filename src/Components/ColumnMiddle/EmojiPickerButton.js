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
import { EMOJI_PICKER_TIMEOUT_MS } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './EmojiPickerButton.css';

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
        this.popoverRef = React.createRef();
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

            this.updateAnchorEl(true);
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    handleButtonMouseLeave = () => {
        this.buttonEnter = false;
        setTimeout(() => {
            if (this.paperEnter || this.buttonEnter) return;

            this.updateAnchorEl(false);
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    handlePaperMouseEnter = () => {
        this.paperEnter = true;
    };

    handlePaperMouseLeave = () => {
        this.paperEnter = false;
        setTimeout(() => {
            if (this.paperEnter || this.buttonEnter) return;

            this.updateAnchorEl(false);
        }, EMOJI_PICKER_TIMEOUT_MS);
    };

    updateAnchorEl = open => {
        this.setState({ open });
    };

    switchPopover = () => {
        this.updateAnchorEl(!this.state.open);
    };

    handleEmojiClick = () => {
        this.setState({ tab: 0 });
    };

    handleStickersClick = () => {
        this.stickersPickerRef.current.loadContent();

        this.setState({ tab: 1 });
    };

    handleStickerSend = sticker => {
        if (!sticker) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSend',
            sticker
        });

        this.updateAnchorEl(null);
    };

    render() {
        const { classes, theme, t } = this.props;
        const { open, tab } = this.state;

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

            this.stickersPicker = <StickersPicker ref={this.stickersPickerRef} onSelect={this.handleStickerSend} />;
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
                    onClick={this.switchPopover}
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
                            EMOJI
                        </Button>
                        <Button
                            color={tab === 1 ? 'primary' : 'default'}
                            className={classes.headerButton}
                            onClick={this.handleStickersClick}>
                            STICKERS
                        </Button>
                    </div>
                    <div className={classNames('emoji-picker-content', { 'emoji-picker-content-stickers': tab === 1 })}>
                        {this.picker}
                        {this.stickersPicker}
                    </div>
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
