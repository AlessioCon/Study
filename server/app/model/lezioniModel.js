const mongoose = require('mongoose');
const { Schema } = mongoose;

const lezioneModel = new Schema({
    n:  {type:String , alias:'name' , required:true},
    d:  {type:String, alias:'description'},
    s:  {type:String, alias: 'status'},
    l:  {type:String , alias:'link' },
    ti: {type:String, alias:'time'},
    f:  {type:String, alias: 'file'}, //contiene solo l'indirizzo del file caricato

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

    access:{
        _id:false,
        prof: [{
            _id:false,
            n: {type:String , alias:'name'},
            g: {type:String , alias:'grade'}
        }],
        c: {type:String, alias:'access.creator'}
    },

    p:{type:Number, alias:'point'} //numero di punti gudagnati per aver risposto correttamente

})




const Lezione = mongoose.model('lesson', lezioneModel )

module.exports = Lezione;