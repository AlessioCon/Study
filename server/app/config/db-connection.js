const mongoose = require('mongoose');
const { EventEmitter } = require('events');

require('dotenv').config();

class DbConnect extends EventEmitter {
    static mongo;
    #uri

    constructor(){
        super();
        this.#uri = `mongodb+srv://${process.env.DB_username}:${process.env.DB_password}@node-a.ctug1.mongodb.net/?retryWrites=true&w=majority`;
    }

    async connection(){

        await mongoose.connect(this.#uri, {dbName: process.env.DB_name ,/*ssl: true*/} , (err, db) => {
            if (err) throw err; 
            DbConnect.#setInstance(db);

            this.emit('DBConnect');
        })
    }

    static #setInstance(db){ DbConnect.mongo = db;}

}

module.exports = DbConnect;
