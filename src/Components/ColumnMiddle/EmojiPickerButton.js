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
import Popover from '@material-ui/core/Popover';
import { Picker as EmojiPicker } from 'emoji-mart';
import StickersPicker from './StickersPicker';
import ApplicationStore from '../../Stores/ApplicationStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './EmojiPickerButton.css';

const styles = {
    iconButton: {
        margin: '8px 0px'
    },
    headerButton: {
        borderRadius: 0,
        flex: '50%'
    }
};

class EmojiPickerButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
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

    updateAnchorEl = anchorEl => {
        this.setState({ anchorEl: anchorEl, tab: anchorEl === null ? 0 : this.state.tab });
    };

    switchPopover = event => {
        this.updateAnchorEl(this.state.anchorEl ? null : event.currentTarget);
    };

    handleMouseOut = event => {
        //console.log('Popover.handleMouseOut', event.target, event.currentTarget);
    };

    handleMouseLeave = event => {
        //console.log('Popover.handleMouseLeave', event);
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
        const { anchorEl, tab } = this.state;

        const open = Boolean(anchorEl);

        if (!this.picker) {
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
                    onMouseEnter={this.switchPopover}
                    onClick={this.switchPopover}>
                    <InsertEmoticonIcon />
                </IconButton>
                <Popover
                    id='render-props-popover'
                    ref={this.popoverRef}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={() => this.updateAnchorEl(null)}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    transitionDuration={0}>
                    <div
                        style={{ width: 338, overflowX: 'hidden', background: 'transparent' }}
                        onMouseLeave={this.switchPopover}>
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
                        <div
                            className={classNames('emoji-picker-content', {
                                'emoji-picker-content-stickers': tab === 1
                            })}>
                            {this.picker}
                            <StickersPicker ref={this.stickersPickerRef} onSelect={this.handleStickerSend} />
                        </div>
                    </div>
                </Popover>
            </>
        );
    }
}

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(EmojiPickerButton);
