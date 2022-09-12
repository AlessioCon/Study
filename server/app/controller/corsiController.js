let fs = require('fs/promises');
let path = require('path');

const Validator = require('../../private_modules/validator');

const userModel = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const lessonModel = require('../model/lezioniModel');
const simulationModel = require('../model/simulationModel');
const stripeController = require('./stripeController');

async function getAllCourse(req,res){
    try{
        let allCourse = await courseModel.find({s: {$nin:['true']}}).select('t id sale img sl s simu');
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

        for(let y = 0 ; y < allCourse.length; y++ ){
            //nome prof da id a username
            for(let x = 0 ; x < allCourse[y].access.prof.length  ; x++){
                let userName =  await userModel.findOne({_id: allCourse[y].access.prof[x].n }).select('user');
                if(userName) allCourse[y].access.prof[x].n = userName.user;
            }

            

            //nome lista utenti che ha comprato il corso : da id a user
            for(let x = 0 ; x < allCourse[y].ven.length; x++){
                let userName =  await userModel.findOne({_id: allCourse[y].ven[x] }).select('user');
                if(userName) allCourse[y].ven[x] = userName.user;
            }
        };

        let lessonUser = await lessonModel.find({s: {$nin:['bozza']} , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n _id');
        let simulationUser = await simulationModel.find({s: {$nin:['bozza']} ,  course: true , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n _id');

        //cambio nome simulazione già inserita
        let simulationName = []
        for(let x = 0 ; x < allCourse.length; x++){
            let simu = allCourse[x].simu;

            let simul = []
            for(let y = 0; y < simu.length; y++){
                let simulation = await simulationModel.findById({_id: simu[y]}).select('n _id');
                if(simulation){ simul.push([simulation.n , simulation._id.toString()]) }
            }
            simulationName.push(simul)
        }

        res.json({success:true, data:allCourse, lesson:lessonUser, simulation: simulationUser || [] , simulatioName: simulationName});
    }catch(e){
        console.log(e)
        res.json({success:false, data:'error server'});
    }
}

async function getOneCourse(req, res){

    try{
        let course = await courseModel.findOne({sl: req.params.slug})
        if(!course) return res.json({success:false , data:'corso non torvato'});
        if(!course?.simu) course.simu = [];
        //dati necessari per le simulazioni
        simulation = [];
        for(let x = 0 ; x < course.simu.length ; x++){
            let simu = await simulationModel.findById({_id: course.simu[x]}).select('n d chapter')
            let materie = []
            simu.chapter.map(mat => {
                let capitoli = [];
                mat.li_ma.map(cap => {
                    capitoli.push([cap.t, cap.quiz.length])
                })
                materie.push([mat.ma, capitoli])
            })
            simulation.push([simu.n , materie])
        }

        res.json({success: true, data:course , simulation: simulation})

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
        if(dati.file?.file && dati.file.file != 'not'){

            let response = await fileSave(dati.file, dati.access.creator , dati.t);
            if(!response) return res.json({success:false , msg:'problema nel caricare il file'});
            dati.pathDati = response;
        }else{
            if(dati?.img && dati.img !== ''){
                await fs.rm(dati.img);
                dati.img = '';
                dati.pathDati = '';
            }
        }


        //controllo dei prof che hanno accesso
        let prof = [];
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
            idStripe: dati.idStripe,
            simu: dati.simu
        }
        
        
        //stripe implementation
        let idStripe = await stripeController.StripeUpdateProduct(course);
        if(!idStripe) res.json({success: false, dati:'corso non salvato per stripe'});
        

        course.idStripe = idStripe.id

//-------------------

        await courseModel.updateOne({_id: dati._id}, course );

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
            let response = await fileSave(dati.file, dati.access.creator , dati.t);
            if(!response) return res.json({success:false , msg:'problema nel caricare il file'});
            dati.pathDati = response;
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
            simu: dati.simu
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
        if(filePrecedente?.img && filePrecedente.img !== ''){
            try{
                await fs.rm(filePrecedente.img);
                await fs.rmdir(path.join(filePrecedente.img, '../'));
            }catch(e){console.log('non è stato possibile cancellare il file')}
        }

        

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

        let full = [...courseAll , ...courseProf]
        
        for(let y = 0 ; y < full.length; y++ ){
            //nome prof da id a username
            for(let x = 0 ; x < full[y].access.prof.length  ; x++){
                let userName =  await userModel.findOne({_id: full[y].access.prof[x].n }).select('user');
                if(userName) full[y].access.prof[x].n = userName.user;
            }

            

            //nome lista utenti che ha comprato il corso : da id a user
            for(let x = 0 ; x < full[y].ven.length; x++){
                let userName =  await userModel.findOne({_id: full[y].ven[x] }).select('user');
                if(userName) full[y].ven[x] = userName.user;
            }
        };
        

    
        let lessonUser = await lessonModel.find({s: {$nin:['bozza']} , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n _id');
        let simulationUser = await simulationModel.find({s: {$nin:['bozza']} ,  course: true , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n _id');

        //cambio nome simulazione già inserita
        let simulationName = []
        for(let x = 0 ; x < full.length; x++){
            let simu = full[x].simu;

            let simul = []
            for(let y = 0; y < simu.length; y++){
                let simulation = await simulationModel.findById({_id: simu[y]}).select('n _id');
                if(simulation){ simul.push([simulation.n , simulation._id.toString()]) }
            }
            simulationName.push(simul)
        }

        return res.json({success:true, data:full , lesson:lessonUser, simulation: simulationUser || [] , simulatioName: simulationName});

    }catch(e){
        console.log(e)
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
        else if(perCent >= 60){point = Math.round(lesson.p/2);}
        else if(perCent >= 40){point = Math.round(lesson.p/3)}

        }else{ point = lesson.p}
        

        if(!CourseBuy) return res.json({success: false , msg:'l\'utente non ha comprato il corso'});

        let materia = CourseBuy.materia.find(x => x.name === req.body.categoria);
       
        if(!materia) {
            user.CourseBuy[indexCourse].materia.push({name: req.body.categoria , lesson: []});
            materia = {name: req.body.categoria , lesson: []};
        }

        let lessonIndex = materia.lesson.findIndex(el => el.idL === req.body.idLesson);
        if(lessonIndex !== -1){
            if(materia.lesson[lessonIndex]?.p > point ) point = materia.lesson[lessonIndex].p;
            materia.lesson[lessonIndex] = {
                       idL: req.body.idLesson,
                       an : req.body?.answere,
                       p: point 
                   }
        }else{
            materia.lesson.push({
                idL: req.body.idLesson,
                an: req.body?.answere,
                p: point
            })
        }

        let materiaIndex = user.CourseBuy[indexCourse].materia.findIndex(x => x.name === req.body.categoria);
        user.CourseBuy[indexCourse].materia[materiaIndex] =  materia;

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
        if(resp.access.prof.find(el => el.n === user && (el.g === 'illimitato' || el.g === 'modifiche'))) return 'creator'

        return false;

    }catch(e){console.log(e); return {success:err, date:'errore controllo utente accesso al corso'}}
}

//memorizzazione di un file
async function fileSave(file , creator , title){
    //creator nome creatore   //title   titolo del corso    //file    nome del file
    
    let pathName = path.join(__dirname, `../public/upload/course/${creator}/`);
    let pathCourse = path.join(pathName , title.replaceAll(' ','-'));
    let pathComplite = path.join(pathCourse , file.name.replaceAll(' ','-'));

    //controllare se le cartelle esistono
    try{
        //directory id creatore
        try{ await fs.mkdir(pathName);}
        catch(err){
            if(err.code !== 'EEXIST'){ 
                console.log(`errore nel trovare la directori < ${pathName} >`);
                return false
            };
        }
        //directory id > nome_corso
        try{ await fs.mkdir(pathCourse);}
        catch(err){
            if(err.code !== 'EEXIST'){ 
                console.log(`errore nel trovare la directori < ${pathCourse} >`);
                return false
            };
        }
        //cancellare i possibili file pre-esistenti
        let AllFile = await fs.readdir(pathCourse)
        for(file of AllFile){
            try{
                let pathForFile = path.join(pathCourse , file)
                await fs.rm(pathForFile);
            }catch(e){console.log(`il file ${file} non è stato concellato`) ; return false}
        }

        //inserire il nuovo file
        await fs.writeFile(pathComplite, String(file.file) ,{flag:'w'});
        return pathComplite;
    }catch(e){console.log('problema nel caricare il file sul server') ; console.log(e);return false}
    


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