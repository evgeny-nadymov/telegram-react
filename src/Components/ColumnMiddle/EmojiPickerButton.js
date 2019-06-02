/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import Popover from '@material-ui/core/Popover';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import { Picker } from 'emoji-mart';
import ApplicationStore from '../../Stores/ApplicationStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import './EmojiPickerButton.css';

const styles = {
    iconButton: {
        margin: '8px 0px'
    }
};

class EmojiPickerButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null
        };
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
        this.setState({ anchorEl: anchorEl });
    };

    switchPopover = event => {
        this.updateAnchorEl(this.state.anchorEl ? null : event.currentTarget);
    };

    render() {
        const { classes, theme, t } = this.props;
        const { anchorEl } = this.state;

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
                <Picker
                    set='apple'
                    showPreview={false}
                    showSkinTones={false}
                    onSelect={this.props.onSelect}
                    color={theme.palette.primary.dark}
                    i18n={i18n}
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
                <IconButton className={classes.iconButton} aria-label='Emoticon' onClick={this.switchPopover}>
                    <InsertEmoticonIcon />
                </IconButton>
                <Popover
                    id='render-props-popover'
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
                    }}>
                    {this.picker}
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
