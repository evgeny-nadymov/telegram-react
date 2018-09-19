import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class ApplicationStore extends EventEmitter{
    constructor(){
        super();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateAuthorizationState':{
                this.authorizationState = update.authorization_state;

                this.emit(update['@type'], update);
                break;
            }
            case 'updateConnectionState':{
                this.connectionState = update.state;

                this.emit(update['@type'], update);
                break;
            }
            // case 'updateUserFullInfo':
            //     this.setFullInfo(update.user_id, update.user_full_info);
            //
            //     this.emit(update['@type'], update);
            //     break;
            // case 'updateUserStatus':{
            //     let user = this.get(update.user_id);
            //     if (user){
            //         this.assign(user, { status : update.status });
            //     }
            //
            //     this.emit(update['@type'], update);
            //     break;
            // }
            default:
                break;
        }
    }

    assign(source1, source2){
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }
}

const store = new ApplicationStore();

export default store;