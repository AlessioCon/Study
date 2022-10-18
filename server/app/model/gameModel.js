const mongoose = require('mongoose');
const {Schema} = mongoose ;


const gameSchema = new Schema({
    t: {type:String , required:true, alias:'title'}, //nome del gruppo
    s: {type:Boolean , required:true, alias:'state'}, //indica se è online(true) o una bozza(false)

    mat: [{
        _id:false,
        t: {type:String , alias:'title'},//titolo card
        quiz:[{
            _id:false,
            q: {type:String, alias:'question'},
            c: {type:String, alias:'comment'},
            answere:[{
                _id:false,
                t: {type:String, alias:'text'},
                c: {type:Boolean, alias:'correct'},
            }],
        }],
    }],
    block: {type:Boolean, default: false},

    game:[{
        p1:{
            _id:false,
            id: {type:String},
            res:[],//contenente la posizione delle risposte
        },
        p2:{
            _id:false,
            id: {type:String},
            res:[],//contenente la posizione delle risposte
        },
        ti: {type:String, alias:'time'},
        quest:[],
        c: {type:Number, alias:'click'},//indica se i giocatori hanno girato la ruota [0 nessunno, 1 primo giocatore, 2 primo e secondo giocatore] 
        win: {type:String} //id vincitore

    }]
});


let Games = mongoose.model('Game' , gameSchema);

module.exports = Games;