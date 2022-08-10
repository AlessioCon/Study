let passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const userModel = require('../model/userModel')



var strategy = new localStrategy(async function verify(username, password, cb) {
        try{
           let userFull =  await userModel.findOne({email: username});
           if(!userFull) return cb(null, false);
           let user = {_id: userFull._id, user: userFull.user, grade: userFull.grade}
           return cb(null, user);
        }catch(e){ cb(e)}
        
        
});

passport.serializeUser((user, done) =>{
    console.log('prova =' +user)
     done(null , user._id);
})

passport.deserializeUser(async (id, done) => {
    try{
        let userFull =  await userModel.findOne({_id: id});
        if(!userFull) return done(null, false); 
        done(null, userFull)
    }catch(e){done(e)}
   
})




passport.use('local-login',strategy)


module.exports = passport
