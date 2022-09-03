const mongoose = require('mongoose');
const {Schema} = mongoose ;


const cardSchema = new Schema({
    t: {type:String , required:true, alias:'title'}, //nome del gruppo
    c: {type:String, required:true, alias:'creator'}, //id creatore gruppo
    cards: [{
        _id:false,
        t: {type:String , alias:'title'},//titolo card
        b: {type:String, alias:'body'}//corpo card
    }],
    stripe: {
        _id:false,
        id: {type:String}, //id stripe
        sale: {
            p: {type: Number , required: true , default: 0, alias:'sale.price'},
            o: {type: Number , default: 0, alias:'sale.outlet'},
        },
        s: {type:Boolean, default:false , alias:'status'},// true = in vendita , false = bozza
        buyers: [{_id:false, id: {type:String,}}] //id compratori
    }
});


let Cards = mongoose.model('Card' , cardSchema);

module.exports = Course;