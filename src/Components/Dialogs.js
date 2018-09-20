import React, {Component} from 'react';
import './Dialogs.css';
import DialogsHeader from './DialogsHeader';
import Header from './Header';
import DialogsList from './DialogsList';

class Dialogs extends Component{
    render(){
        return (
            <div className='master'>
                <DialogsHeader onClearCache={this.props.onClearCache}/>
                <DialogsList authState={this.props.authState} onSelectChat={this.props.onSelectChat}/>
            </div>
        );
    }
}

export default Dialogs;