import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";

class BasicGroupStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateBasicGroup':
                this.items.set(update.basic_group.id, update.basic_group);
                break;
            default:
                break;
        }
    }

    get(groupId){
        return this.items.get(groupId);
    }
}

const store = new BasicGroupStore();

export default store;