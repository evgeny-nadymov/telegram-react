import React, {Component} from 'react';
import './Dialogs.css';
import DialogsHeader from './DialogsHeader';
import Header from './Header';
import DialogsList from './DialogsList';
import UpdatePanel from './UpdatePanel';

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.dialogsList = React.createRef();

        this.handleHeaderClick = this.handleHeaderClick.bind(this);
    }

    handleHeaderClick(){
        this.dialogsList.current.scrollToTop();
    }

    render(){
        
        return (
            <div className='master'>
                <DialogsHeader onClearCache={this.props.onClearCache} onClick={this.handleHeaderClick}/>
                <DialogsList ref={this.dialogsList} authState={this.props.authState} onSelectChat={this.props.onSelectChat}/>
                <UpdatePanel/>
            </div>
        );
    }
}

export default Dialogs;