import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";

class SupergroupStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateSupergroup':
                this.items.set(update.supergroup.id, update.supergroup);
                break;
            default:
                break;
        }
    }

    get(chatId){
        return this.items.get(chatId);
    }
}

const store = new SupergroupStore();

export default store;