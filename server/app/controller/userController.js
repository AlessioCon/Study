const bcrypt = require('bcrypt');
const Validator = require('../../private_modules/validator');

//MODEL
const userModel = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const stripeController = require('./stripeController');
const stripe = require('stripe')(process.env.Secret_Key);

async function userNew(req, res){
    try{
        let validator = new Validator();
        req.body.email = req.body.email.toLowerCase()
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

async function getUser(req, res){
    try{
        let userDb = await userModel.findById({_id: req.body.id})
        if(!userDb) return res.json({success: false , msg: 'utente inesistente'})

        res.json({success: true , user: userDb})

    }catch(e){console.log(e)}
}

async function userLogin(req, res, next){
    let validator = new Validator();
    req.body.username = req.body.username.toLowerCase()
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
    

    if (corso) return res.json({success:true, haveCourse:true , course: corso , progress: progress.materia })
    
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

//fromIdToUser molto forse non è usata , da considerare la deprecazione
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

async function updateUser(req, res){
    try{
        let user = await userModel.findById({_id: req.body.userId});
        if(!user) return res.json({success: false, msg:'utente non trovato'});
    
        switch(req.body.update){
            case 'username':
                //validazione dato
                let validator = new Validator();
                let input ={ user  : req.body.data }
                let option = {user :"type:string|length:>:3|length:<:15"}
    
                let Var = validator.controll(input, option)
                if (Var['err']) return res.json({success:false , msg: Var['msg']});
        
    
                //controllo nome già in uso
                let usernameDb = await userModel.find({user: req.body.data});
                if(Boolean(usernameDb.length)) return res.json({success: false, msg:'nome utente già in uso'});
    
                user.user = req.body.data;
                await user.save();
    
                return res.json({success: true, msg:'user cambiato'})
                break;
            
            case 'cell':
                //validazione dato
                let validatorCell = new Validator();
                let inputCell ={ cell  : req.body.data }
                let optionCell = {cell :"type:numberOnly|length:>:9"}
    
                let VarCell = validatorCell.controll(inputCell, optionCell)
                if (VarCell['err']) return res.json({success:false , msg: VarCell['msg']});

               user.cell = {n:req.body.data, nv:false}
               await user.save();


               let uCS = await stripe.customers.retrieve(req.body.stipeId);
               await stripe.customers.update( req.body.stipeId,
                    {
                        phone: req.body.data,
                        shipping: {phone: req.body.data , name: uCS.name , address: uCS.shipping.address}
                    }
                );

                return res.json({success: true, msg:'cell cambiato'})
                break
            case 'city':
                //validazione dato
                let validatorCity = new Validator();
                let inputCity ={ City  : req.body.data }
                let optionCity = {City :"type:textOnly"}
    
                let VarCity = validatorCity.controll(inputCity, optionCity)
                if (VarCity['err']) return res.json({success:false , msg: VarCity['msg']});

                user.address.c = req.body.data;
                await user.save();

                let uCSCity = await stripe.customers.retrieve(req.body.stipeId);
                let addressCity = uCSCity.shipping.address;
                addressCity.city = req.body.data
                await stripe.customers.update( req.body.stipeId,
                        {
                            address: addressCity,
                            shipping: {phone: uCSCity.phone , name: uCSCity.name , address: addressCity}
                        }
                    );

                
                return res.json({success: true, msg:'città cambiata'})
                break
            case 'address':
                //validazione dato
                let validatorAddress= new Validator();
                let inputAddress ={ address  : req.body.data }
                let optionAddress = {address :"type:string"}
    
                let VarAddress = validatorAddress.controll(inputAddress, optionAddress)
                if (VarAddress['err']) return res.json({success:false , msg: VarAddress['msg']});

                user.address.s = req.body.data;
                await user.save();

                let uCSAddress = await stripe.customers.retrieve(req.body.stipeId);
                let addressAddress = uCSAddress.address;
                addressAddress.line1 = req.body.data
                await stripe.customers.update( req.body.stipeId,
                        {
                            address: addressAddress,
                            shipping: {phone: uCSAddress.phone , name: uCSAddress.name , address: addressAddress}
                        }
                    );

                
                return res.json({success: true, msg:'via cambiata'});
                break
            case 'cap':
                //validazione dato
                let validatorCap= new Validator();
                let inputCap ={ Cap  : req.body.data }
                let optionCap = {Cap :"type:numberOnly|length:>:5|length:<:5"}
    
                let VarCap = validatorCap.controll(inputCap, optionCap)
                if (VarCap['err']) return res.json({success:false , msg: VarCap['msg']});

                user.address.cap = req.body.data;
                await user.save();

                let uCSCap = await stripe.customers.retrieve(req.body.stipeId);
                let addressCap = uCSCap.address;
                addressCap.postal_code = req.body.data
                await stripe.customers.update( req.body.stipeId,
                        {
                            address: addressCap,
                            shipping: {phone: uCSCap.phone , name: uCSCap.name , address: addressCap}
                        }
                    );

                
                return res.json({success: true, msg:'cap modificato'});
            case 'email':
                req.body.data = req.body.data.toLowerCase();
                //validazione dato
                let validatorEmail= new Validator();
                let inputEmail ={ Email  : req.body.data}
                let optionEmail = {Email :"type:email"}
    
                let VarEmail = validatorEmail.controll(inputEmail, optionEmail)
                if (VarEmail['err']) return res.json({success:false , msg: VarEmail['msg']});

                //controllo vecchia password
                if(req.body.password){
                    let resPassE = await bcrypt.compare(req.body.password, user.pass);
                    if(!resPassE) return res.json({success: false, msg:'password sbagliata'});
                }else{return res.json({success: false, msg:'password sbagliata'});}
                

                //controllo nome già in uso
                let userEmail = await userModel.find({email: req.body.data});
                if(Boolean(userEmail.length)) return res.json({success: false, msg:'email già in uso'});

                user.email = req.body.data;
                await user.save();

                await stripe.customers.update( req.body.stipeId,
                        { email: req.body.data }
                    );

                
                return res.json({success: true, msg:'email modificata'});
            case 'password':
                //validazione dato
                let validatorPass= new Validator();
                let inputPass ={ Pass  : req.body.data }
                let optionPass = {Pass :"type:password"}
    
                let VarPass = validatorPass.controll(inputPass, optionPass)
                if (VarPass['err']) return res.json({success:false , msg: VarPass['msg']});

                //controllo vecchia password
                if(req.body.password){
                    let resPass = await bcrypt.compare(req.body.password, user.pass);
                    if(!resPass) return res.json({success: false, msg:'vecchia password sbagliata'});
                }else{return res.json({success: false, msg:'password sbagliata'});}



                /*CODIFICA PASSWORD*/
                let passCrypt = await bcrypt.hash( req.body.data, 10);
                user.pass = passCrypt;
                await user.save();
                
                return res.json({success: true, msg:'password modificata'});
            default:
                break;
        }
    }catch(e){console.log(e)}

    return res.json({success: false, msg:'errore al server'})
   
            
    



    
}

async function getUserCourse(req, res){
    try{
        let user = await userModel.findById(req.body.id).select('-_id CourseBuy');

        if(!user) return res.json({success:false , msg: 'non hai corsi acquistati'})
        let listCourse = []
        for(let x = 0 ; x < user.CourseBuy.length ; x++){
            let course = await courseModel.findById(user.CourseBuy[x].courseId).select('t sale img sl s');
            if(course) listCourse.push(course)
        }
        

        return res.json({success:true, courses: listCourse});


    }catch(e){console.log(e)}

}

async function sendMsg(req, res){
    try{
       let user =await userModel.findById({_id: req.body.id})
       if(!user) return res.json({success:false, msg: 'user non trovato'})

       if(!user?.msg) user.msg = {alert: true, posta: []};
       user.msg.alert = true;
       user.msg.posta.unshift(
           {
               tipe: req.body.type,
               msg: [...req.body.msg]
           }
       )
       if(user.msg.posta.length > 100) user.msg.posta = user.msg.posta.slice(0,100);

       await user.save();
       return res.json({success: true})
    }catch(e){console.log(e); return res.json({success:'error'})}
}
async function haveMsg(req,res){
    try{
        let user = await userModel.findById({_id: req.body.id}).select('msg');
        if(!user) return res.json({success:false});

        if(!user?.msg) user.msg = {alert: false , posta:[]}
        let alert = user?.msg?.alert || false;
        return res.json({success: true, alert: alert })

    }catch(e){console.log(e); res.json({success:'error'})}
}

async function getUserMsg(req,res){
    try{
        let user = await userModel.findById({_id: req.body.id}).select('msg');
        if(!user) return res.json({success:false});

        if(!user?.msg) user.msg = {alert: false , posta:[]};
        user.msg.alert = false;
        
        await user.save()
        return res.json({success: true, msg: user.msg.posta })

    }catch(e){console.log(e); res.json({success:'error'})}
}

async function deleteUserMsg(req,res){
    try{
        let user = await userModel.findById({_id: req.body.id}).select('msg');
        if(!user) return res.json({success:false});

        if(req.body.all){
            user.msg.posta = [];
        }else{
            user.msg.posta.splice(req.body.index, 1);
        }
        
        
        await user.save();
        return res.json({success: true})

    }catch(e){console.log(e); res.json({success:'error'})}
}

module.exports = {
    userNew,
    userLogin,
    getUser,
    updateUser,
    getUserCourse,

    haveCourse,
    payCourse,
    getUserSeller,
    fromIdToUser,

    sendMsg,
    haveMsg,
    getUserMsg,
    deleteUserMsg
}