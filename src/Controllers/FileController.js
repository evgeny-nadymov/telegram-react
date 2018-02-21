
class FileController{
    constructor(){

    }

    getFile(chatId){
        this.emit("chat_photo_changed", {chatId: chatId});

        /*for (let i = 0; i < this.chats.length; i++){
            if (this.chats[i].id === chatId){
                this.chats[i].blob = blob;

                this.emit("chat_photo_changed",);
                break;
            }
        }*/
    }
}

const controller = new FileController();

export default controller;