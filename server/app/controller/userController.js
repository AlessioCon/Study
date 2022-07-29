const bcrypt = require('bcrypt');
const Validator = require('../../private_modules/validator');

//MODEL
const userModel = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const stripeController = require('./stripeController');

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

        


        /*Stripe creazione utente (customer )*/

        let coustomer = await stripeController.stripeNewCustomer(req.body);
        if(!coustomer.success) return res.json({success:false , msg: 'errore durante la registrazione (Stripe)'});

        //---------



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
            idStripe: coustomer.id,
        })


        await user.save();
        return res.json({success:true, msg:""});
    }catch(err){
        console.log(err)
        return res.json({success:'error', msg:err})
    }
    
   
    
}

async function userSeller(req, res){


    try{
        let user = await userModel.findById({_id: req.body.id})
        if(!user) return res.json({success: false , msg: 'user not found'});

        let userSeller = user.grade.find(x => {if(x === 'seller' || x === 'sellerPending') return x});
        if(userSeller) return res.json({success: false , msg: 'l\'utente è già venditore'})
        
    
        let response = await stripeController.stripeNewConnect(user);
        if(!response?.success) return res.json({success: false , msg: 'errore in stripe'});

        user.idSS = response.id;
        if(!user.grade.find(x => x === 'sellerPending')) user.grade.push('sellerPending');

        await user.save();
        return res.json({success: true});

    }catch(e){if(e) console.log(e)}
    
}

async function getUser(req, res){
    try{
        let userDb = await userModel.findById({_id: req.body.id})
        if(!userDb) return res.json({success: false , msg: 'utente inesistente'})

        res.json({success: true , user: userDb})

    }catch(e){console.log(e)}
}

//user in uso
//--email   ale@gmail.com   ales@gmail.com
//--pass    Pa23d%eu        Pa23d%eust


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

async function haveCourse(req, res){

    let user = await userModel.findOne({_id: req.params.id , 'CourseBuy.courseId': req.params.idCourse});
    if(!user) return res.json({success:true , haveCourse:false});

    let progress = user.CourseBuy.find((e) => e.courseId === req.params.idCourse) //progressi fatti dall'utente
    let corso = await courseModel.findById({_id:req.params.idCourse})
    

    if (corso) return res.json({success:true, haveCourse:true , course: corso , progress: progress.lesson })
    
    res.json({success:true , haveCourse:false})
} 
//compra e regala corso
async function payCourse(req , res){
    
    try{
        let idCourse = req.body.idCourse
        let idUser = req.body?.idUser
        let idSub = req.body.subId

        //se è un regalo trova l'utente da regalare il corso e avvia la normale procedura
        if(idSub === 'regalo'){
            let idUserRegalo = await userModel.findOne({user: req.body.user}).select('_id');
            if(!idUserRegalo) return res.json({success:false, msg: 'utente non trovato per regalare il corso' })
            idUser = idUserRegalo._id;
        }


        //vedere se non esiste già un corso comprato
        let userCourse = await userModel.findOne({_id:idUser , 'CourseBuy.courseId': idCourse})
        if(userCourse) return res.json({success: false, msg:'corso già posseduto'});

        if(!idSub === 'regalo') await courseModel.updateOne({_id: idCourse} , {$inc: {'ven.n': +1}})
        await courseModel.updateOne({_id: idCourse} , {$push: {'ven.ul': idUser}})
        

        await userModel.updateOne({_id:idUser}, {$push: {CourseBuy: {courseId: idCourse , sub: idSub}}})
        
        return res.json({success: true})
    }catch(e){console.log(e)}
}

async function getUserSeller(req, res){
    try{
        let user = await userModel.findById({_id: req.body.id}).select('idSS')

        //vedere se deve verificare il suo conto
        if(!user || !user?.idSS) return res.json('utente non abilitato per essere un venditore');

        let sellerS = await stripeController.getSeller(user.idSS)
        if(!sellerS.success) return res.json('utente Stripe non abilitato per essere un venditore');

        return res.json({seller: sellerS.user });

    }catch(e){if(e) console.log(e)}
}

async function fromIdToUser(req, res){
    try{
        let list = req.body.listId;
  
        let listUser = []
        for(let x = 0 ; x < list.length ; x++){
            let user = await userModel.findById({_id: list[x]}).select('-_id user');
            if(user) listUser.push(user);
        }

        return res.json({success: true , userList: listUser })
    }catch(e){console.log(e); res.json({success: false, msg:'error server'})}
}


module.exports = {
    userNew,
    userLogin,
    getUser,

    haveCourse,
    payCourse,
    userSeller,
    getUserSeller,
    fromIdToUser
}