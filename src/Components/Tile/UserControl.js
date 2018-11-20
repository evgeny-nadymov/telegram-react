/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import UserTileControl from './UserTileControl';
import UserStatusControl from './UserStatusControl';
import { getUserFullName } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import './UserControl.css';

class UserControl extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            user: UserStore.get(this.props.userId)
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        return nextProps.userId !== this.props.userId;
    }

    handleClick = () => {
        const { userId, onSelect} = this.props;

        const user = UserStore.get(userId);
        if (!user) return;

        onSelect(user);
    };

    render() {
        const { userId } = this.props;
        const user = UserStore.get(userId);

        const fullName = getUserFullName(user);

        return (
            <div className='user' onClick={this.handleClick}>
                <div className='user-wrapper'>
                    <UserTileControl userId={userId}/>
                    <div className='dialog-inner-wrapper'>
                        <div className='dialog-row-wrapper'>
                            <div className='dialog-title'>
                                {fullName}
                            </div>
                        </div>
                        <div className='dialog-row-wrapper'>
                            <UserStatusControl userId={userId}/>
                            {/*<div className={classNames('dialog-content', {'accent-color': isAccentSubtitle})}>*/}
                                {/*{status}*/}
                            {/*</div>*/}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default UserControl;