const userModel   = require('../model/userModel')
const courseModel = require('../model/corsiModel')

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

        //se era già un venditore altrimenti...
        if(userSeller.grade.find(e => e === 'sellerBlock')){
            let newGrade = userSeller.grade.filter(e => e !== 'sellerBlock');
            newGrade.push('seller')
            userSeller.grade = newGrade;
            await userSeller.save();
            return res.json({success: false, msg:'l\'utente '+ userSeller.user + ' è di nuovo un venditore'});
        }else{
            let isSeller = userSeller.grade.find(e => {if(e === 'seller' || e === 'sellerPending') return true});
            if(isSeller) return res.json({success: false, msg: 'l\'utente è gia un venditore'});
    
            //collegamento a stripe
            let response = await stripeController.stripeNewConnect(userSeller);
            if(!response?.success) return res.json({success: false , msg: 'errore in stripe'});
    
            userSeller.idSS = response.id;
            if(!userSeller.grade.find(x => x === 'sellerPending')) userSeller.grade.push('sellerPending');
    
            await userSeller.save();
            res.json({saccess: true , msg:'adesso '+ req.body.userSeller + ' è un venditore'})
        }

        
        
    }catch(e){console.log(e)}
}

async function allSeller(req, res){
    try{
        let master = await masterRetrive(req.body.idMaster)
        if(master.success === false) return res.json({success: false , msg: master.msg})
    
    
        //trova tutti i venditori
        let allSellers = await userModel.find({grade: {$in: ['seller' , 'sellerBlock']}}).select('_id user name grade')
        if(!Boolean(allSellers)) res.json({success: true , sellers:[]})
    
    
        list = []
        //trova tutti i corsi dei venditori
        for(let x = 0 ; x < allSellers.length ; x++){
            let item = allSellers[x]
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
        res.json({saccess: true , msg:'adesso '+ req.body.userSeller + ' non è un venditore'})
        
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
    blockCourse
}