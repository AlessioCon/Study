const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        f:{ type: String, required: true, alias:'name.first'},
        l:{ type: String, required: true, alias:'name.last' },
    },
    user     : {type: String, required: true},
    date     : {type: String, required: true},
    txc      : {type: String, required: true, alias:'taxCode'},
    cell     : {
        n:  {type: Number, alias:'cell.number' },
        nv: {type: Boolean, default: false, alias:'cell.verified'}
    },
    email    : {type:String,  required: true},
    pass      : {type: String, required:true , alias: 'password'},
    address  :{
        s: {type: String, required:true, alias:'address.street'},
        c:   {type: String ,  required:true, alias:'address.city'},
        cc: {type: String , requires:true, alias:'address.country'},
        cap: {type: Number, reuired:true }
    },
    grade: [{type: String, default: 'user'}],
    idStripe: {type: String},
    idSS: {type: String , alias:'isStripeSeller'},


    /*gestione corsi*/
    CourseBuy: [{
        _id: false,
        courseId: {type:String},
        sub: {type:String},
        materia: [{
            name: {type:String},
            lesson: [
                {_id:false,
                idL: {type:String},//idLesson
                an: {type:Array},//risposte date nel caso fosse un quiz (answere)
                p: {type:Number , alias:'point'},
               }],
            _id:false
        }]
        
    }
        
    ],

})

userSchema.virtual('fullName').get(function(){
    return this.name.first + ' ' + this.name.last;
})



const User = mongoose.model('User', userSchema )

module.exports = User;