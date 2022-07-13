let fs = require('fs');
let path = require('path');

const Validator = require('../../private_modules/validator');

const userModel = require('../model/userModel');
const courseModel = require('../model/corsiModel');
const lessonModel = require('../model/lezioniModel')

async function getAllCourse(req,res){
    try{
        let allCourse = await courseModel.find({s: {$nin:['true']}}).select('t id sale img sl s');
        if(!allCourse) return res.json({success:false , data:'corsi non disponibili'});

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
        dati.d = dati.d ?? '';
        dati.sale = dati.sale ?? {};
        dati.sale.p = dati.sale.p ?? 0;
        dati.sale.o = dati.sale.o ?? 0;
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



        const course = {
            title: dati.t,
            description: dati.d,
            sale:dati.sale,
            access:  dati.access,
            chapter: dati.chapter,
            slug: dati.sl,
            s:dati.s,
            img: dati.pathDati,
        }


        await courseModel.replaceOne({_id: dati._id}, course);
        res.json({success:true, date:'corso modificato correttamente'})

    }catch(e){console.log(e) ; return res.json({success:'err'})}
    
}

async function createCourse(req, res){
    
    try{
        let validator = new Validator();


        let dati = req.body;
        
        dati.t = dati.t ?? '';
        dati.d = dati.d ?? '';
        dati.sale = dati.sale ?? {};
        dati.sale.p = dati.sale.p ?? 0;
        dati.sale.o = dati.sale.o ?? 0;
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


        let resp = await courseModel.findByIdAndDelete(req.params.id)
        if(!resp) return res.json({success: false , date:'corso non trovato'});
        res.json({success:true});

    }catch(e){console.log(e); res.json({success:'err'})}
}


async function getModifyCourse(req, res){
    try{
        let courseAll = await courseModel.find({['access.c']: req.body.id});
        let courseProf = await courseModel.find({['access.prof.n']:req.body.id});

        if(!courseAll && !courseProf) return res.json({success:false , data:'lezioni non disponibili'});

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
        
        let lessonUser = await lessonModel.find({s: {$nin:['bozza']} , $or: [{'access.c': req.body.id}, {'access.prof.n':req.body.id}]}).select('n -_id');

        return res.json({success:true, data:courseAll , lesson:lessonUser});

    }catch(e){
        res.json({success:false, data:'error server'});
    }
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
}