const mongoose = require('mongoose');
const { Schema } = mongoose;


let simulationModel = new Schema({
    n:  {type:String , alias:'name' , required:true},
    d:  {type:String, alias:'description'},
    s:  {type:String, alias: 'status'},
    f:  {type:String, alias: 'file'}, //contiene solo l'indirizzo del file caricato
    block: {type:Boolean}, //blocco da parte del master

    reset:{
        _id:false,
        for: {type:Number},
        start: {type:Number},
        active: {type:Boolean}
    },

    time: {
        _id:false,
        m: {type:Number, max:60 , alias:'time.minuti'},
        o: {type:Number, max:24 , alias:'time.ore'},
        }, //quanto dura un quiz
    hit: {
        _id:false,                         //
        e: {type:Number, alias:'hit.easy', dafault: 0},//quante volte è stata fatta la simulazione in modalita easy e hard
        h: {type:Number, alias:'hit.hard', dafault: 0},//
    },                                     //

    chapter:[
        {
            ma: {type:String, alias:'materia'},
            quiz:[{
                _id:false,
                q: {type:String, alias:'question'},
                c: {type:String, alias:'comment'},
                answere:[{
                    _id:false,
                    t: {type:String, alias:'text'},
                    c: {type:Boolean, alias:'correct'},
                    p: {type:Number, alias:'point' , dafault: 0}, //quante volte è stata scelta la domanda
                }],
            }],
            _id:false,
        }
    ],

    access:{
        _id:false,
        user: [],
        c: {type:String, alias:'access.creator'}
    },

    table:[
        {
            _id:false,
            u: {type:String , alias:'user'},
            p: {type:Number, alias:'totalPoint'},
            t: {type:String, alias:'time'},
            mod: {type: Boolean}, // se è true la modalita e con il tempo 
            d: {type:String , alias:'data'} //data di quando è stato fatta la simulazione
        }
    ]


});


const Simulation = mongoose.model('simulation', simulationModel)
module.exports = Simulation;