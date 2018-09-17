import {EventEmitter} from 'events';

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.items = new Map();
        this.blobItems = new Map();

        this.onUpdate = this.onUpdate.bind(this);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateFile':{
                this.set(update.file);

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    }

    get(fileId){
        return this.items.get(fileId);
    }

    set(file){
        this.items.set(file.id, file);
    }

    getBlob(fileId){
        return this.blobItems.get(fileId);
    }

    setBlob(fileId, blob){
        this.blobItems.set(fileId, blob);
    }
}

const store = new FileStore();
export default store;