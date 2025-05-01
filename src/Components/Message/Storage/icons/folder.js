import React, { Component } from 'react';

import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import './folder.css'


class Folder extends Component {
    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);

        this.timer = 0;
        this.delay = 200;
        this.prevent = false;

        this.state = {
            contextMenu: false,
            folderSelected: false
        };

        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        // console.log("Function", this.props.openFolder);
    }

    handleClick() {
        if (!this.state.folderSelected) {
            document.addEventListener('click', this.handleOutsideClick, false);
            
            this.setState({
                folderSelected: true,
            });
        }
        
    }
    
    handleOutsideClick(e) {
        if (this.node && (this.node.contains(e.target))) return;

        document.removeEventListener('click', this.handleOutsideClick, false);
        this.setState({
            folderSelected: false,
        });
    }

    handleDoubleClick(){
        console.log("Double Clicked", this.props.folder_name);

        document.removeEventListener('click', this.handleOutsideClick, false);
        this.setState({
            folderSelected: false,
        });

        this.props.openFolder(this.props.folder_name);
    }

    handleContextMenu = event => {
        console.log(this.props.folder_name+" Context menu");
        this.handleClick();

        if (event) {
            event.preventDefault();
            // event.stopPropagation();
        }
        
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            // if (Dialog.contextMenuId !== contextMenuId) {
            //     return;
            // }

            this.setState({
                left,
                top
            });

            this.setState({ contextMenu: true });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    handleFolderSelect = () => {
        this.setState({folderSelected: true});
    };

    render () {
        const { contextMenu, left, top } = this.state;

        return (
            <div
                // className={classNames('dialog')}
                // onMouseDown={this.handleSelect}
                onClick={this.handleClick.bind(this)}
                onDoubleClick = {this.handleDoubleClick}
                onContextMenu={this.handleContextMenu}
                // style={style}
            >
                    
                <div 
                    className={classNames({'folder-container': true, 'folderSelected': this.state.folderSelected})}
                    ref={node => { this.node = node; }}
                    // onClick={this.handleClick}
                    >
                    <img className="folder-icon" src="icons/folder.svg"></img>
                    <span className="folder-name">{this.props.folder_name}</span>
                </div>
                <Popover
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}>

                    <MenuList onClick={e => e.stopPropagation()}>
                        <MenuItem onClick={this.handleArchive}>
                            <ListItemText primary={'Share'} />
                        </MenuItem>
                        <MenuItem onClick={this.handleArchive}>
                            <ListItemText primary={'Copy to'} />
                        </MenuItem>
                        <MenuItem onClick={this.handleArchive}>
                            <ListItemText primary={'Move to'} />
                        </MenuItem>
                        <MenuItem onClick={this.handleArchive}>
                            <ListItemText primary={'Delete'} />
                        </MenuItem>
                        <MenuItem onClick={this.handleArchive}>
                            <ListItemText primary={'Rename'} />
                        </MenuItem>
                    </MenuList>
                </Popover>
            </div>
        );
    }
}

export default Folder;