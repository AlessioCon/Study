const bcrypt = require('bcrypt');
const Validator = require('../../private_modules/validator');

//MODEL
const userModel = require('../model/userModel');

async function userNew(req, res){
    try{
        let validator = new Validator();
        let input ={
            name    :req.body.name ,
            surname :req.body.surname ,
            user    :req.body.username ,
            date    :req.body.date ,
            txc     :req.body.txc ,
            number  :req.body.cell ,
            email   :req.body.email ,
            password:req.body.password ,
            street  :req.body.street ,
            city    :req.body.city ,
            country :req.body.country ,
            cap     :req.body.cap ,
        }

        let option = {
            name    :"type:textOnly|length:>:3|length:<:11",
            surname :"type:textOnly|length:>:3|length:<:11",
            user    :"type:string|length:>:3|length:<:15",
            date    :"type:birth",
            txc     :"type:txc|length:=:16",
            number  :"type:numberOnly|length:>:9",
            email   :"type:email",
            password:"type:password|length:>:8",
            street  :"type:string",
            city    :"type:string",
            country :"type:string",
            cap     :"type:numberOnly|length:=:5",
        }

        let Var = validator.controll(input, option)
        if (! Var['err'] ==  false ) return res.json({success:false , msg: Var['msg']});
        

        /*CONTROLLO DATA DI NASCITA*/
        //          ------anno -----------------   -----mese---   --------giorno--------
        let dateS = req.body.date.split('-');
        let date = dateS.reverse().join('/');
        

        /*RICERCA STESSA EMAIL*/
        let idemEmail = await userModel.exists({email: req.body.email})
        if (idemEmail) return res.json({success:false , msg: 'email già in uso'});


        /*RICERCA STESSO NOME UTENTE*/
        let idemUser = await userModel.exists({user: req.body.user})
        if (idemUser) return res.send({success:false , msg: 'username già in uso'});

        /*CODIFICA PASSWORD*/
        let passCrypt = await bcrypt.hash( req.body.password, 10);

        
        const user = new userModel({
            name:  {first : req.body.name.toLowerCase() , 
                    last: req.body.surname.toLowerCase()},
            user:  req.body.username,
            date:  date,
            txc :  req.body.txc,
            cell: { number: req.body.cell},
            email: req.body.email,
            password: passCrypt,
            address: {street: req.body.street, 
                      city: req.body.city, 
                      country: req.body.country,
                      cap: req.body.cap},
            grade: ['user'],
        })


        await user.save();
        return res.json({success:true, msg:""});
    }catch(err){
        console.log(err)
        return res.json({success:'error', msg:err})
    }
    
   
    
}

async function userLogin(req, res, next){
    let validator = new Validator();
    let input={ username: req.body.username}
    let option={ username: 'type:email'}

    let resVal = validator.controll(input, option);
    if(resVal['err'] != false) return res.json({success: false , msg: resVal['msg']});
   
    try{
        let resUser = await userModel.findOne({email: req.body.username});
        if(resUser == null) return res.json({success: false , msg: 'email non trovata' });

        let resPass = await bcrypt.compare(req.body.password, resUser['pass']);
        if(resPass != true) return res.json({success: false , msg: 'password sbagliata' });
       
        return next();

    }catch(err){ return res.send(err)} 
 }
 
module.exports = {
    userNew,
    userLogin
}