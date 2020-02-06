/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import RepeatIcon from '@material-ui/icons/Repeat';
import RepeatOneIcon from '@material-ui/icons/RepeatOne';
import PlayerStore, { RepeatEnum } from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';

class RepeatButton extends React.Component {
    constructor(props) {
        super(props);

        const { repeat } = PlayerStore;

        this.state = {
            repeat
        };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaRepeat', this.onClientUpdateMediaRepeat);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaRepeat', this.onClientUpdateMediaRepeat);
    }

    onClientUpdateMediaRepeat = update => {
        const { repeat } = update;

        this.setState({ repeat });
    };

    handleRepeat = () => {
        const { repeat } = this.state;

        let nextRepeat = repeat;
        switch (repeat) {
            case RepeatEnum.NONE: {
                nextRepeat = RepeatEnum.REPEAT;
                break;
            }
            case RepeatEnum.REPEAT: {
                nextRepeat = RepeatEnum.REPEAT_ONE;
                break;
            }
            case RepeatEnum.REPEAT_ONE: {
                nextRepeat = RepeatEnum.NONE;
                break;
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaRepeat',
            repeat: nextRepeat
        });
    };

    getIcon = repeat => {
        switch (repeat) {
            case RepeatEnum.NONE: {
                return <RepeatIcon fontSize='small' />;
            }
            case RepeatEnum.REPEAT: {
                return <RepeatIcon fontSize='small' />;
            }
            case RepeatEnum.REPEAT_ONE: {
                return <RepeatOneIcon fontSize='small' />;
            }
            default: {
                return <RepeatIcon fontSize='small' />;
            }
        }
    };

    render() {
        const { repeat } = this.state;

        return (
            <IconButton
                className='header-player-button'
                color={repeat === RepeatEnum.NONE ? 'default' : 'primary'}
                onClick={this.handleRepeat}>
                {this.getIcon(repeat)}
            </IconButton>
        );
    }
}

export default RepeatButton;
