import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";

class UserStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateUser':
                this.items.set(update.user.id, update.user);
                break;
            default:
                break;
        }
    }

    get(userId){
        return this.items.get(userId);
    }
}

const store = new UserStore();

export default store;