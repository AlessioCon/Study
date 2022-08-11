const mongoose = require('mongoose');
const {Schema} = mongoose 

const corsoSchema = new Schema({
    t: {type: String , required: true, alias:'title'},
    d: {type: String, alias:'description'},
    sale: {
        p: {type: Number , required: true , default: 0, alias:'sale.price'},
        o: {type: Number , default: 0, alias:'sale.outlet'},
        e: {type: Boolean , default: false , alias:'sale.end'}
    },
    //per la modifica del corso chi avra l'accesso
    access:{
        _id:false,
        prof: [{
            n: {type:String , alisa:'name'},
            g: {type:String , alisa:'grade'}
        }],
        c: {type:String, alias:'access.creator'}
    },

    //capitoli , lezioni, , quiz 
    chapter:[{
        _id: false,
        t: {type:String , alias:'title'},
        lesson: [],
        u: {type:Number  , alias:'unlock'}, //a quante stelle si potra sbloccare

    }],
    ven:{
        n: {type:Number, alias:'vendite'} ,
        ul:[{type:String, alias:'userList'}],
    },

    sl :{type:String, alias:'slug'},
    img:{type:String},
    s: {type:String, alias:'status'},
    idStripe: {type:String},
    block: {type:Boolean}, //blocco da parte del master
})

let Course = mongoose.model('Course' , corsoSchema);

module.exports = Course;