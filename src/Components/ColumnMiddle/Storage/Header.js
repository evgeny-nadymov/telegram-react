/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import './Header.css';

import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {

        };

        // this.test = this.test.bind(this);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render() {

        return (
            <>
                <div className='header-details'>
                    <img 
                        className="backButton"
                        src="./icons/backButton.svg"
                        onClick={this.props.goBackPath}
                    ></img>
                    <h3>Storage</h3>

                    <div className="operations">
                        <Button onClick={()=>this.props.addFolder()}><AddIcon /></Button>
                    </div>
                </div>
            </>
        );
    }
}

export default withTranslation()(Header);
