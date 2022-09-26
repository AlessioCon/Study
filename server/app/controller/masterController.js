const userModel   = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const simulationModel = require('../model/simulationModel');
const cardModel = require('../model/cardsModel');

const stripeController = require('../controller/stripeController')


async function isMaster(req, res){
    try{
        let master = await masterRetrive(req.body.id)
        if(master.success === false) return res.json({success: false , msg: master.msg})
        

        res.json({success: true , user: master.user})
    }catch(e){console.log(e)}
}
async function newSeller(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})

        let userSeller = await userModel.findOne({user: req.body.userSeller});
        if(!Boolean(userSeller)) return res.json({success: false , msg:'utente non trovato'});

 
        //se è stato un venditore bloccato
        if(userSeller.grade.find(e => e === 'sellerBlock')){
            let newGrade = userSeller.grade.filter(e => e !== 'sellerBlock')
            newGrade.push('seller')
            if(!newGrade.find(x => x === 'seller'))  newGrade.push(req.body.type);
            userSeller.grade = newGrade;
            await userSeller.save();
            return res.json({success: false, msg:'l\'utente '+ userSeller.user + ' è di nuovo un venditore'});
        }


        if(!userSeller?.idSS){
            //collegamento a stripe
            let response = await stripeController.stripeNewConnect(userSeller);
            if(!response?.success) return res.json({success: false , msg: 'errore in stripe'});


            userSeller.idSS = response.id;
            userSeller.grade.push('sellerPending', req.body.type);

            await userSeller.save();
            return res.json({saccess: true , msg:'adesso '+ userSeller.user + ' è un venditore'})


        }else{
            if(!userSeller.grade.find(e => e === req.body.type)){

                userSeller.grade.push(req.body.type);
                await userSeller.save()
                return res.json({saccess: true , msg: 'l\'utente "' +userSeller.user + '" è stato abilitata'})
            }else{
                return res.json({saccess: true , msg: userSeller.user + ' è già abilitato'})
            }
        }

        
        
    }catch(e){console.log(e)}
}
async function allSeller(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})
    
    
        //trova tutti i venditori
        let allSellers = await userModel.find({grade: {$in: ['seller' , 'sellerBlock']}}).select('_id user name grade')
        let allSellersCourse = [];
        allSellers.map(sel => {
            if(sel.grade.find(x => x === 'course')) allSellersCourse.push(sel);
        })
        if(!Boolean(allSellersCourse.length)) res.json({success: true , sellers:[]})
    
        let list = []
        //trova tutti i corsi dei venditori
        for(let x = 0 ; x < allSellersCourse.length ; x++){
            let item = allSellersCourse[x]
            let allCourse = await courseModel.find({'access.c': item._id}).select('_id idStripe');
            let courses = 0;
            let amount = 0;
            if(Boolean(allCourse)){ 
                for(let y = 0 ; y < allCourse.length ; y++){
                    courses++
                    let total = await stripeController.amountProduct(allCourse[y].idStripe);
                    if(total.success)  amount +=  Number(total.amount);
                }
            }
    
            let seller = {
                _id: item._id,
                nome:`${item.name.f} ${item.name.l}`,
                user: item.user,
                active_course: courses,
                amount: amount ,
                grade: item.grade
            }
    
            list.push(seller)
              
        }

        res.json({success: true , list: list})

    }catch(e){console.log(e), res.json({success: 'error' , msg:'errore server'})}
}
async function blockSeller(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})

        let userSeller = await userModel.findById({_id: req.body.idSeller});
        if(!Boolean(userSeller)) return res.json({success: false , msg:'utente non trovato'});

        if(userSeller.grade.find(e => e === 'sellerBlock')) return res.json({success:false, msg:'l\'utente non è un venditore'})

        let sellerBlock = userSeller.grade.filter(e => e !== 'seller');
        sellerBlock.push('sellerBlock')

        userSeller.grade = sellerBlock
        await userSeller.save();
        res.json({saccess: true , msg:'adesso '+ userSeller.user + ' non è un venditore'})
        
    }catch(e){console.log(e)}
}

async function blockCourse(req, res){
    try{
        let course = await courseModel.findById({_id:req.body.idCorso})
        if(!course) return res.json({success: false, msg: 'corso non trovato'})

        if(course?.block){ course.block = false ; course.s = false
        }else{course.block = true ; course.s = true}

        let responseStripe = await stripeController.stripeBlockProduct(req.body.idStripe)
        if(!responseStripe.success) return res.json({success: false, msg: responseStripe.msg})
      

        await course.save();
        res.json({success: true, msg: 'modifica al corso effettuata'})

    }catch(e){console.log(e)}
}
async function deliteUserCourse(req, res){
    try{
        let user = await userModel.findById({_id:req.body.userId}).select('simu CourseBuy')
        if(!user) res.json({success:false, msg:'utente non trovato'})

        let indexOfCourse = user.CourseBuy.findIndex(x => x.courseId === req.body.courseId);
        if(indexOfCourse === -1) res.json({success:false, msg:'corso non trovato per l\'elliminazione'});
        user.CourseBuy.splice(indexOfCourse,1);

        //controllare se il corso aveva delle simulazioni incluse
        let course = await courseModel.findById({_id:req.body.courseId}).select('simu ven')
        if(!course) res.json({success:false, msg:'utente non trovato per ricerca pacchetti simulazione'})

        course.simu.map(x => {
           let indexSimu =  user.simu.findIndex(sim => sim.simId === x);
           if(indexSimu !== -1){
            user.simu.splice(indexSimu, 1)
           }
        })
        //trova e cancella l'utente dalla lista dei venduti
        let newVen =  course.ven.filter(x => x !== req.body.userId )
        course.ven = newVen;

        await course.save();
        await user.save();
        return res.json({success:true})


    }catch(e){console.log(e), res.json({success:false, msg:'errore nel server'})}
   
}



async function newCreatorSimulator(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})

        let user = await userModel.findOne({user: req.body.user});
        if(!Boolean(user)) return res.json({success: false , msg:'utente non trovato'});

        //se era già un venditore altrimenti...
        if(user.grade.find(e => e === 'simulationBlock')){
            let newGrade = user.grade.filter(e => e !== 'simulationBlock');
            newGrade.push('simulation')
            user.grade = newGrade;
            await user.save();
            return res.json({success: false, msg:'l\'utente '+ user.user + ' è di nuovo un creatore di simulazioni'});
        }else{
            let usergrade = user.grade.find(e => e === 'simulation' );
            if(usergrade) return res.json({success: false, msg: 'l\'utente è gia un creatore di simulazioni'});

            user.grade.push('simulation');
            await user.save();
            res.json({saccess: true , msg:'adesso '+ user.user + ' è un creatore di simulazioni'})
        }

    }catch(e){console.log(e)}
}
async function allCreatorSimulator(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})
    
    
        //trova tutti i venditori
        let allCreator = await userModel.find({grade: {$in: ['simulation' , 'simulationBlock']}}).select('_id user name grade')
        if(!Boolean(allCreator)) res.json({success: true , sellers:[]})
    
    
        list = []
        //trova tutti i corsi dei venditori
        for(let x = 0 ; x < allCreator.length ; x++){
            let item = allCreator[x]
            let allSimulation = await simulationModel.find({'access.c': item._id}).select('_id');
            let simulation = allSimulation.length;
    
            let user = {
                _id: item._id,
                nome:`${item.name.f} ${item.name.l}`,
                user: item.user,
                active_simulation: simulation,
                grade: item.grade
            }
    
            list.push(user)
              
        }
        
        res.json({success: true , list: list})

    }catch(e){console.log(e), res.json({success: 'error' , msg:'errore server'})}
}
async function blockCreatorSimulator(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})

        let userSim = await userModel.findById({_id: req.body.idUser});
        if(!Boolean(userSim)) return res.json({success: false , msg:'utente non trovato'});

        if(userSim.grade.find(e => e === 'simulationBlock')) return res.json({success:false, msg:'l\'utente non è un creatore di simulazioni'})

        let gradeFilter = userSim.grade.filter(e => e !== 'simulation');
        gradeFilter.push('simulationBlock')

        userSim.grade = gradeFilter
        await userSim.save();
        res.json({saccess: true , msg:'adesso '+ userSim.user + ' non è un creatore di simulazioni'})
        
    }catch(e){console.log(e)}
}
async function blockSimulation(req, res){
    try{
        let simulation = await simulationModel.findById({_id:req.body.idSimulation})
        if(!simulation) return res.json({success: false, msg: 'simulazione non trovata'})

        if(simulation?.block){ simulation.block = false ; simulation.s = false
        }else{simulation.block = true ; simulation.s = true}

        await simulation.save();
        res.json({success: true, msg: 'modifica alla simulazione effettuata'})

    }catch(e){console.log(e)}
}

async function allCreatorCards(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})
    
        //trova tutti i venditori
        let allSellers = await userModel.find({grade: {$in: ['seller' , 'sellerBlock']}}).select('_id user name grade idStripe')
        let allSellersCard = [];
        allSellers.map(sel => {
            if(sel.grade.find(x => x === 'card')) allSellersCard.push(sel);
        })
        if(!Boolean(allSellersCard.length)) res.json({success: true , sellers:[]})

        let list = []
        //trova tutti i corsi dei venditori
        for(let x = 0 ; x < allSellersCard.length ; x++){
            let item = allSellersCard[x]
            let allCard = await cardModel.find({c: item._id , 'stripe.s': {$in: [true , false]}}).select('_id stripe');
            let allAmount = await stripeController.amountProductPI(item.idStripe)

            let seller = {
                _id: item._id,
                nome:`${item.name.f} ${item.name.l}`,
                user: item.user,
                active_card: allCard.length,
                amount: allAmount.amount ,
                grade: item.grade
            }

            list.push(seller)
            
        }


        return res.json({success: true , list: list})

    }catch(e){console.log(e), res.json({success: 'error' , msg:'errore server'})}
}
async function blockDeck(req, res){
    try{
        let deck = await cardModel.findById({_id:req.body.idDeck})
        if(!deck) return res.json({success: false, msg: 'deck non trovato'})

        if(deck?.block){ deck.block = false ; deck.s = true
        }else{deck.block = true ; deck.s = false}

        await deck.save();
        res.json({success: true, msg: 'modifica deck effettuata'})

    }catch(e){console.log(e)}
}

async function sendMsgGlobal(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})
  
        let allUser = await userModel.find({_id: {$nin: [req.body.idMaster]}}).select('_id');
        if(!allUser) return res.json({success: false , msg:'utenti non trovati'});


        for (let x = 0 ; x < allUser.length; x++){
            let user = await userModel.findById({_id: allUser[x]._id.toString()})
            if(!user) continue;

            if(!user?.msg) user.msg = {alert: true, posta: []};
            user.msg.alert = true;
            user.msg.posta.unshift(
                {
                    tipe: req.body.msg.type,
                    msg: [...req.body.msg.body]
                }
            )
            if(user.msg.posta.length > 100) user.msg.posta = user.msg.posta.slice(0,100);
     
            await user.save();
        }


        return res.json({success: true , msg: 'messaggio inviato correttamente'})
    }catch(e){console.log(e); return res.json({success:'error'})}
}





async function masterRetrive(id){
    let user = await userModel.findById({_id: id});
    if(!Boolean(user)) return {success:false , msg:'utente insesistente'};
    if(!Boolean(user?.grade?.find(e => e === 'master'))) return {success:false , msg:'non sei il master'}

    return {success:true , user: user}
}


module.exports = {
    isMaster,
    newSeller,
    allSeller,
    blockSeller,
    blockCourse,
    deliteUserCourse,

    newCreatorSimulator,
    allCreatorSimulator,
    blockCreatorSimulator,
    blockSimulation,

    allCreatorCards,
    blockDeck,
    sendMsgGlobal
}