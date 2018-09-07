import {EventEmitter} from 'events';

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.blobItems = new Map();

        this.setMaxListeners(Infinity);
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