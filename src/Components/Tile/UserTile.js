/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import DeletedAccountIcon from '../../Assets/Icons/DeletedAccount';
import { getUserLetters, isDeletedUser } from '../../Utils/User';
import { getSrc, loadUserContent } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import UserStore from '../../Stores/UserStore';
import './UserTile.css';

class UserTile extends Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { userId, firstName, lastName, t } = props;

        if (state.prevUserId !== userId) {
            const user = UserStore.get(userId);
            const file = user && user.profile_photo ? user.profile_photo.small : null;

            const fileId = file ? file.id : -1;
            const src = getSrc(file);
            const loaded = state.src === src && src !== '' || fileId === -1;
            const letters = getUserLetters(userId, firstName, lastName, t);

            return {
                prevUserId: userId,

                fileId,
                src,
                loaded,
                letters
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { userId } = this.props;
        const { fileId, src, loaded, letters } = this.state;

        if (nextProps.userId !== userId) {
            return true;
        }

        if (nextState.fileId !== fileId) {
            return true;
        }

        if (nextState.src !== src) {
            return true;
        }

        if (nextState.loaded !== loaded) {
            return true;
        }

        if (nextState.letters !== letters) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        UserStore.on('updateUser', this.onUpdateUser);
        FileStore.on('clientUpdateUserBlob', this.onClientUpdateUserBlob);
    }

    componentWillUnmount() {
        UserStore.off('updateUser', this.onUpdateUser);
        FileStore.off('clientUpdateUserBlob', this.onClientUpdateUserBlob);
    }

    onClientUpdateUserBlob = update => {
        const { userId } = this.props;
        const { fileId, loaded } = this.state;

        if (userId !== update.userId) return;
        if (fileId !== update.fileId) return;

        if (!loaded) {
            const user = UserStore.get(userId);
            if (!user) {
                return null;
            }

            const file = user && user.profile_photo ? user.profile_photo.small : null;
            const src = getSrc(file);

            this.setState({ src });
        }
    };

    onUpdateUser = update => {
        const { userId, firstName, lastName, t } = this.props;
        const { user } = update;

        if (!user) return;
        if (userId !== user.id) return;

        const file = user && user.profile_photo ? user.profile_photo.small : null;

        const fileId = file ? file.id : -1;
        const src = getSrc(file);
        const loaded = this.state.src === src && src !== '' || fileId === -1;
        const letters = getUserLetters(userId, firstName, lastName, t);

        this.setState({
            src,
            fileId,
            loaded,
            letters
        });

        if (file) {
            const store = FileStore.getStore();
            loadUserContent(store, userId);
        }
    };

    handleSelect = event => {
        const { userId, onSelect } = this.props;
        if (!onSelect) return;

        event.stopPropagation();
        onSelect(userId);
    };

    handleLoad = () => {
        this.setState({ loaded: true });
    };

    render() {
        const { className, userId, fistName, lastName, onSelect, small, dialog, poll } = this.props;
        const { fileId, src, loaded, letters } = this.state;

        const user = UserStore.get(userId);
        if (!user && !(fistName || lastName)) return null;

        if (isDeletedUser(userId)) {
            return (
                <div
                    className={classNames(
                        className,
                        'user-tile',
                        'tile_color_0',
                        { pointer: onSelect },
                        { 'tile-dialog': dialog },
                        { 'tile-small': small },
                        { 'tile-poll': poll }
                    )}
                    onClick={this.handleSelect}>
                    <div className='tile-photo'>
                        <div className='tile-saved-messages'>
                            <DeletedAccountIcon fontSize='default' />
                        </div>
                    </div>
                </div>
            );
        }

        const tileLoaded = src && loaded;
        const tileColor = `tile_color_${(Math.abs(userId) % 7) + 1}`;

        return (
            <div
                className={classNames(
                    className,
                    'user-tile',
                    { [tileColor]: !tileLoaded },
                    { pointer: onSelect },
                    { 'tile-dialog': dialog },
                    { 'tile-small': small },
                    { 'tile-poll': poll }
                )}
                onClick={this.handleSelect}>
                {!tileLoaded && (
                    <div className='tile-photo'>
                        <span className='tile-text'>{letters}</span>
                    </div>
                )}
                {src && <img className='tile-photo' src={src} onLoad={this.handleLoad} draggable={false} alt='' />}
            </div>
        );
    }
}

UserTile.propTypes = {
    userId: PropTypes.number.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    onSelect: PropTypes.func,
    small: PropTypes.bool
};

export default withTranslation()(UserTile);
