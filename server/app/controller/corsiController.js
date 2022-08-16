let fs = require('fs');
let path = require('path');

const Validator = require('../../private_modules/validator');

const userModel = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const lessonModel = require('../model/lezioniModel')
const stripeController = require('./stripeController')

async function getAllCourse(req,res){
    try{
        let allCourse = await courseModel.find({s: {$nin:['true']}}).select('t id sale img sl s');
        if(!allCourse) return res.json({success:false , data:'corsi non disponibili'});

        res.json({success:true, data:allCourse});
    }catch(e){
        res.json({success:false, data:'error server'});
    }
}

async function getAllUserCourse(req,res){
    try{
        let allCourse = await courseModel.find({'access.c': req.body.id});
        if(!allCourse) return res.json({success:false , data:'l\'utente non ha corsi'});

        res.json({success:true, data:allCourse});
    }catch(e){
        res.json({success:false, data:'error server'});
    }
}

async function getOneCourse(req, res){

    try{
        let course = await courseModel.findOne({sl: req.params.slug})
        if(!course) return res.json({success:false , data:'corso non torvato'});
        res.json({success: true, data:course})

    }catch(e){console.log(e); return res.json({success:false , data:'errore db'})}
}

async function updateCourse(req , res){
    try{
        let userPermission = await accessoCorso(req.body.userOfModify, req.body._id);
        if(!userPermission) return res.json({success:false , data:'utente non autorizzato'});


        let validator = new Validator();


        let dati = req.body;
        
        dati.t = dati.t ?? '';
        dati.d = dati.d ?? 'un fantastico corso da non perdere';
        dati.sale = dati.sale ?? {};
        dati.sale.p = dati.sale.p ?? 0;
        dati.sale.o = dati.sale.o ?? 0;
        dati.sale.e = dati.sale.e || false;
        sl= dati.sl.toLowerCase().replaceAll(' ','-') ?? '';
        dati.s = dati.s ?? false;
        dati.pathDati = dati.file?.name ?? '';

        let input = {
            title: dati.t,
            description: dati.d,
            priceP: parseInt(dati.sale.p),
            priceO: parseInt(dati.sale.o),
            slug: dati.sl,
            bozza: dati.s,
        }

        let option = {
            title         : "type:string|length:<:32",
            description   : "type:string|length:<:230",
            priceP        : "type:number",
            priceO        : "type:number",
            slug          : "type:string|length:<:17",
            bozza         : "type:boolean", 
        }

        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , data:Var.msg});

        //sistema di memorizzazione file
        let filePrecedente = await courseModel.findOne({_id: req.body._id}).select('img');
        if(filePrecedente.img && dati.file?.file) await fs.unlink(path.join(__dirname , '../'+filePrecedente.img ), (err) => {if(err) console.log(err)});
        

        //sistema di memorizzazione file
        dati.pathDati = dati.img ?? '';
        if(dati.file?.file === 'not') dati.pathDati = '';

        if(dati.file?.file && dati.file?.file != 'not'){
            let pathName = path.join(__dirname, `../public/upload/course/${dati.access.creator}/` )
            let pathCourse = path.join(pathName+dati.t.replaceAll(' ','-')) 
            let pathComplite = path.join(pathCourse+'/'+dati.file.name.replaceAll(' ','-')) 
            
            //dcrivere nome utente e nome corso
            if(!fs.existsSync(pathName)){ fs.mkdirSync(pathName)}
            if(!fs.existsSync(pathCourse)){ fs.mkdirSync(pathCourse)}
    
            fs.writeFile(pathComplite , dati.file.file ,{ flag: 'a+' } , err => {
                if(err) console.log('file non inviato '+ err)
            })
            if(dati.file.file && pathComplite !== dati.img) dati.pathDati = `/public/upload/course/${dati.access.creator}/${dati.t.replaceAll(' ','-')}/${dati.file.name.replaceAll(' ','-')}`;
        }

        //controllo dei prof che hanno accesso
        let prof = []
        for(x = 0 ; x < dati.access['prof'].length ; x++){
            let sinProf = dati.access['prof'][x];

            if(!sinProf[0]) {console.log('nessun nome'); break}
            
            let resUser = await userModel.findOne({user: sinProf[0]}).select('_id');
            if(!resUser) {console.log('utente inesistente ' + x); break}

            //controllare se il prof inserito non è il creatore

            if(!new RegExp(dati.access.creator).test(resUser._id)){
                
                prof.push({
                    name: resUser._id,
                    grade: sinProf[1]
                })
            }
        }

        dati.access.prof = prof
        dati.access.c = dati.creator

        let controlTitle = courseModel.findOne({t:dati.t , _id: {$nin:[dati._id]}}).select('_id');
        if(controlTitle._id) return res.json({success: false, dati:'titolo corso già in uso'});

        let controlSlug = courseModel.findOne({sl: dati.sl}).select('_id');
        if(controlSlug._id) return res.json({success: false, dati:'slug corso già in uso'});

        //controllo corso bloccato
        let curseBlock = await courseModel.findById({_id: dati._id})
        if(!curseBlock) return res.json({success:false , msg: 'corso non trovato, impossibilità di vedere se è bloccato'})

        if(curseBlock?.block) dati.s = true;

        const course = {
            t: dati.t,
            d: dati.d,
            sale:dati.sale,
            access:  dati.access,
            chapter: dati.chapter,
            sl: dati.sl,
            s: dati.s,
            img: dati.pathDati,
            idStripe: dati.idStripe
        }
        
        
        //stripe implementation
        let idStripe = await stripeController.StripeUpdateProduct(course);
        if(!idStripe) res.json({success: false, dati:'corso non salvato per stripe'});
        
        
        


        course.idStripe = idStripe.id

//-------------------


        let respoo = await courseModel.updateOne({_id: dati._id}, course );

        res.json({success:true, date:'corso modificato correttamente'})

    }catch(e){console.log(e) ; return res.json({success:'err'})}
    
}

async function createCourse(req, res){
    
    try{
        let validator = new Validator();


        let dati = req.body;
        
        dati.t = dati.t ?? '';
        dati.d = dati.d ?? 'un fantastico corso da non perdere';
        dati.sale = dati.sale ?? {};
        dati.sale.p = dati.sale.p ?? 0;
        dati.sale.o = dati.sale.o ?? 0;
        dati.sale.e = dati.sale.e || false;
        sl= dati.sl.toLowerCase().replaceAll(' ','-') ?? '';
        dati.s = dati.s ?? false;

        let input = {
            title: dati.t,
            description: dati.d,
            priceP: parseInt(dati.sale.p),
            priceO: parseInt(dati.sale.o),
            slug: dati.sl,
            bozza: dati.s,
        }

        let option = {
            title         : "type:string|length:<:32",
            description   : "type:string|length:<:230",
            priceP        : "type:number",
            priceO        : "type:number",
            slug          : "type:string|length:<:17",
            bozza         : "type:boolean", 
        }

        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , data:Var.msg});


        //controllo dei prof che hanno accesso
        let prof = []
        for(x = 0 ; x < dati.access['prof'].length ; x++){
            let sinProf = dati.access['prof'][x];

            if(!sinProf[0]) {console.log('nessun nome'); break}
            
            let resUser = await userModel.findOne({user: sinProf[0]}).select('_id');
            if(!resUser) {console.log('utente inesistente ' + x); break}

            //controllare se il prof inserito non è il creatore
            
            if(!new RegExp(dati.access.creator).test(resUser._id)){
                prof.push({
                    name: resUser._id,
                    grade: sinProf[1]
                })
            }
        }

        //sistema di memorizzazione file
        if(dati.file?.file){
            let pathName = path.join(__dirname, `../public/upload/course/${dati.access.creator}/` )
            let pathCourse = path.join(pathName+dati.t.replaceAll(' ','-')) 
            let pathComplite = path.join(pathCourse+'/'+dati.file.name.replaceAll(' ','-')) 
            
            //srivere nome utente e nome corso
            if(!fs.existsSync(pathName)){ fs.mkdirSync(pathName)}
            if(!fs.existsSync(pathCourse)){ fs.mkdirSync(pathCourse)}
    
            fs.writeFile(pathComplite , dati.file.file ,{ flag: 'a+' } , err => {
                if(err) console.log('file non inviato '+ err);
            })
            dati.pathDati = `/public/upload/course/${dati.access.creator}/${dati.t.replaceAll(' ','-')}/${dati.file.name.replaceAll(' ','-')}`;
        }


        
        let controlTitle = courseModel.findOne({t:dati.t}).select('_id');
        if(controlTitle._id) return res.json({success: false, dati:'titolo corso già in uso'});

        let controlSlug = courseModel.findOne({sl: dati.sl}).select('_id');
        if(controlSlug._id) return res.json({success: false, dati:'slug corso già in uso'})

        const course = new courseModel({
            title: dati.t,
            description: dati.d,
            sale:dati.sale,
            access:  dati.access,
            chapter: dati.chapter,
            slug: dati.sl,
            s:dati.s,
            img: dati.pathDati,
        })


//stripe implementation
        let idStripe = await stripeController.StripeCreateProduct(course);
        if(!idStripe) res.json({success: false, dati:'corso non salvato per stripe'});


        course.idStripe = idStripe.id

//-------------------
        await course.save();  
        return res.json({success:true , data:'course is live'})


    }catch(e){console.log(e) ; return res.json({success:'err'})}
   

}

async function deleteCourse(req, res){
    
    try{
        let userPermission = await accessoCorso(req.body.userId, req.params.id);
        if(!userPermission) return res.json({success:false , data:'utente non autorizzato'});
        

        //sistema di memorizzazione file
        let filePrecedente = await courseModel.findOne({_id: req.params.id}).select('img');
        if(filePrecedente.img) await fs.unlink(path.join(__dirname , '../'+filePrecedente.img) , (err) => console.log(err));

        //cancellazione da stripe
        await stripeController.StripeDeleteProduct(req.body.idStripe);


        let resp = await courseModel.findByIdAndDelete(req.params.id)
        if(!resp) return res.json({success: false , date:'corso non trovato'});
        res.json({success:true});

    }catch(e){console.log(e); res.json({success:'err'})}
}

async function getModifyCourse(req, res){
    try{
        let courseAll = await courseModel.find({['access.c']: req.body.id});
        let courseProf = await courseModel.find({['access.prof.n']:req.body.id});

        if(!courseAll && !courseProf) return res.json({success:false , data:'corsi non disponibili'});

        for(let y = 0 ; y < courseProf.length; y++ ){
            let course = courseProf[y]
            for(let x = 0 ; x < course.access.prof.length  ; x++){
                let idUser = course.access.prof[x].n;
                let userName =  await userModel.findOne({_id: idUser}).select('user');
                if(userName) course.access.prof[x].n = userName.user;
                if(course.access.prof[x].n === req.body.id) course.validation = course.access.prof[x].g;
            }

            courseAll.push(course);

        };
        
        let lessonUser = await lessonModel.find({s: {$nin:['bozza']} , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n _id');

        return res.json({success:true, data:courseAll , lesson:lessonUser});

    }catch(e){
        res.json({success:false, data:'error server'});
    }
}


async function findLesson(req, res){
try{

    let lesson = await lessonModel.findById({_id: req.body.lezione})
    if(!lesson) return res.json({success: false });

    return  res.json({success:true , lesson: lesson })

}catch(e){if(e) console.log(e)}

   

   
}

async function answersControl(req, res){
    try{
        let lesson = await lessonModel.findById({_id: req.body.idLesson});
        if(!lesson) return res.json({success: false, msg:'corso non trovato'});
        
        let corrette = [];
        
        for(let x = 0 ; x < lesson.quiz.length; x++){
            let answere = lesson.quiz[x].answere;
        
           answere.map((risposte , index) => {
            if(risposte?.c)corrette[x] = index;
           })
        }
    
        return res.json({success: true , data: corrette})

    }catch(e){if(e) console.log(e)}
    
}

async function saveProgress(req, res){

    try{
        let user = await userModel.findById({_id: req.body.idUser});
        if(!user) return res.json({success: false , msg:'user non trovato'});
        let indexCourse;
        let CourseBuy = user?.CourseBuy.find((e , index) => {
            if(e.courseId === req.body.idCourse){
                indexCourse = index;
                return e
            }});

        let lesson = await lessonModel.findById({_id: req.body.idLesson}).select('p quiz')
        //controllo se è un quiz

        let point = 0
        if(Boolean(lesson?.quiz?.length)){
 
        let question = lesson.quiz.length;
        let trueAnswere = 0;
       
        lesson.quiz.map((dom , domIndex) =>{
            let risposta = dom.answere[req.body.answere[domIndex]]
            if(Boolean(risposta?.c)) trueAnswere++
        })
       
        let perCent = parseInt(100*trueAnswere/question);
        if(perCent >= 80){point = lesson.p}
        else if(perCent >= 60){point = parseInt(lesson.p/2);}
        else if(perCent >= 40){point = Math.round(lesson.p/3)}

        }else{ point = lesson.p}
        

        if(!CourseBuy) return res.json({success: false , msg:'l\'utente non ha comprato il corso'});

        let AllLesson = CourseBuy.lesson || [];
        
        let lessonIndex = AllLesson.findIndex(el => el.idL == req.body.idLesson )
        

        if(lessonIndex !== -1){
            if(AllLesson[lessonIndex].p > point ) point = AllLesson[lessonIndex].p
            AllLesson[lessonIndex] = {
                    _id: false,
                    idL: req.body.idLesson,
                    an : req.body?.answere,
                    p: point 
                }
        }else{
            AllLesson.push({
                _id: false,
                idL: req.body.idLesson,
                an: req.body?.answere,
                p: point
            })
        }

        user.CourseBuy[indexCourse].lesson = AllLesson;
        await user.save();
        return res.json({success:true})

    }catch(e){if(e) console.log(e)}
    

}




//funzioni ripetitive
async function accessoCorso(user, idCourse){
    try{
        let resp = await courseModel.findOne({$or:[{'access.prof.n': user}, {'access.c':user}] , _id:idCourse}).select('access -_id');
        if(!resp) return false;
        //controlla se è il creatore del corso
        if(resp.access.c === user) return 'creator';
        //controlla se è un prof
        if(resp.access.prof.find(element => {element.n === user && element.g === 'illimitato'})) return 'creator';
        return false;

    }catch(e){console.log(e); return {success:err, date:'errore controllo utente accesso al corso'}}
}


module.exports = {
    getAllCourse,
    getOneCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getModifyCourse,   //corsi creati dall'utente

    findLesson,
    answersControl,
    saveProgress,
    getAllUserCourse

}