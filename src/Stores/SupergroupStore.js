import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class SupergroupStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();
        this.fullInfoItems = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateSupergroup':
                this.set(update.supergroup);

                this.emit(update['@type'], update);
                break;
            case 'updateSupergroupFullInfo':
                this.setFullInfo(update.supergroup_id, update.supergroup_full_info);

                this.emit(update['@type'], update);
                break;
            default:
                break;
        }
    }

    get(id){
        return this.items.get(id);
    }

    set(supergroup){
        this.items.set(supergroup.id, supergroup);
    }

    getFullInfo(id){
        return this.fullInfoItems.get(id);
    }

    setFullInfo(id, fullInfo){
        this.fullInfoItems.set(id, fullInfo);
    }
}

const store = new SupergroupStore();

export default store;