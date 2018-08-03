import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";

class OptionStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateOption':
                this.items.set(update.name, update.value);
                break;
            default:
                break;
        }
    }

    get(name){
        return this.items.get(name);
    }
}

const store = new OptionStore();

export default store;