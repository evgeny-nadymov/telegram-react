/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import UserTile from './UserTile';
import CloseIcon from '../../Assets/Icons/Close';
import { getUserShortName } from '../../Utils/User';
import './UserChip.css';

class UserChip extends React.Component {
    constructor(props) {
        super(props);

        this.divRef = React.createRef();
    }

    getOffset() {
        return { left: this.divRef.current.offsetLeft, top: this.divRef.current.offsetTop }
    }

    setStyleCSSText(text) {
        const div = this.divRef.current;
        if (!div) return;

        div.style.cssText = text;
    }

    render() {
        const { userId, selected, onClick } = this.props;

        return (
            <div ref={this.divRef} className={classNames('user-chip', { 'item-selected': selected })} onClick={onClick}>
                <UserTile userId={userId} small={true}/>
                <div className='user-chip-delete'>
                    <CloseIcon className='user-chip-delete-icon'/>
                </div>
                <div className='user-chip-name'>{getUserShortName(userId)}</div>
            </div>
        )
    }
}

UserChip.propTypes = {
    userId: PropTypes.number,
    selected: PropTypes.bool,
    onClick: PropTypes.func
};

export default UserChip;