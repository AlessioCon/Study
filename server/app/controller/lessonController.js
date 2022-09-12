let fs = require('fs/promises');
let path = require('path');

const Validator = require('../../private_modules/validator');

const lessonModel = require('../model/lezioniModel');
const userModel = require('../model/userModel');


async function getAll(req,res){
    try{
        let lessonAll = await lessonModel.find({['access.c']: req.body.id});
        let lessonProf = await lessonModel.find({['access.prof.n']:req.body.id ,['access.prof.g']:'modifiche'});
        if(!lessonAll && !lessonProf) return res.json({success:false , data:'lezioni non disponibili'});

        let full = [...lessonAll, ...lessonProf];

        for(let y = 0 ; y < full.length; y++ ){
            for(let x = 0 ; x < full[y].access.prof.length  ; x++){
                let userName =  await userModel.findOne({_id: full[y].access.prof[y].n}).select('user');
                if(userName) full[y].access.prof[x].n = userName.user
            }
        };

        return res.json({success:true, data:full});

    }catch(e){
        res.json({success:false, data:'error server'});
    }
}

async function getSingleLesson(req,res){
    try{
        let lesson = await lessonModel.findById({_id: req.params.id});
        if(!lesson) return res.json({success:false , msg:'lezione non trovata'});


        return res.json({success:true, lesson:lesson});

    }catch(e){
        res.json({success:false, data:'error server'});
    }
}

async function save(req, res){
    try{
        let validator = new Validator()

        let dati = req.body;

        //sistema di memorizzazione file
        if(dati.file?.file){
            let response = await fileSave(dati.file , dati.access.creator , dati.ltitle );
            if(!response) return res.json({success:false , msg:'non è stato possibile salvare i dati'});
            dati.pathDati = response;
        }


        //eccezioni dati 
        dati.time = dati.time ?? 0;
        dati.timeText = dati.timeText ?? 'ore';

        if(dati.time == 1){
            if(dati.timeText === 'ore')  dati.timeText = 'ora';
            if(dati.timeText === 'minuti')  dati.timeText = 'minuto';
        }

        dati.link = dati.link ?? '';
        dati.description = dati.description ?? '';
        dati.bozza = (dati.bozza === false || dati.bozza === undefined) ? false : true
        dati.point= (dati.point) ? parseInt(dati.point) : 0;
        
        let input = {
                ltitle: dati.ltitle,
                type: dati.type,
                link: dati.link,
                time: parseInt(dati.time),
                timeText: dati.timeText,
                description: dati.description,
                bozza: dati.bozza,
                point: dati.point
        }

        let option = {
                ltitle     : "type:string|length:<:32",
                type       : "type:boolean",
                link       : "type:string",
                time       : "type:number",
                timeText   : "type:string",
                description: "type:string|length:<:230",
                bozza      : "type:boolean",
                point      :"type:number|length:>:-1",
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

        dati.access.prof = prof
        
        //controllo Db
        let allLesson = await lessonModel.find({['access.c']: dati.access.creator})
        if(allLesson){
            let nameLesson = allLesson.find(e => e.n.toLowerCase() == dati.ltitle.toLowerCase())
            if(nameLesson) return res.json({success:false , data:'nome lezione già in uso'});
        }
        
        const lesson = new lessonModel({
            name: dati.ltitle,
            description: dati.description,
            status: (dati.bozza) ? 'bozza' : 'pubblico',
            link: dati.link,
            time: dati.time + ' ' + dati.timeText,
            access: dati.access,
            quiz: (dati.quiz) ? dati.quiz : null,
            file: dati.pathDati ?? '',
            point: dati.point
        })

        await lesson.save();
        return res.json({success:true , data:'lesson is live'})

    }catch(e){
        console.log(e);
        res.json({success:'error'})
    }
}

async function update(req,res){
    try{
        let lessonAccess = await accessLesson(req.body.userOfModify, req.body._id)
        if(!lessonAccess) return res.json({success:false , data:'utente non autorizzato'});

        let dati = req.body;

        //sistema di memorizzazione file
        if(dati.file?.file && dati.file?.file !== 'not'){
            let response = await fileSave(dati.file , dati.access.creator , dati.ltitle );
            if(!response) return res.json({success:false , msg:'non è stato possibile salvare i dati'});
            dati.pathDati = response;
        }else{
            if(dati?.f && dati.f !== ''){
                await fs.rm(dati.f);
                dati.f = '';
                dati.pathDati = '';
            }
        }


        dati.time = dati.time ?? 0;
        dati.timeText = dati.timeText ?? 'ore';

        if(dati.time == 1){
            if(dati.timeText === 'ore')  dati.timeText = 'ora';
            if(dati.timeText === 'minuti')  dati.timeText = 'minuto';
        }

        dati.link = dati.link ?? '';
        dati.description = dati.description ?? '';
        dati.bozza = (dati.bozza === false || dati.bozza === undefined) ? false : true
        dati.point= (dati.point) ? parseInt(dati.point) : 0;

        let validator = new Validator()


        let input = {
                ltitle: dati.ltitle,
                type: dati.type,
                link: (dati.link) ? dati.link : '',
                time: parseInt(dati.time),
                timeText: dati.timeText,
                description: dati.description,
                bozza: (dati.bozza) ? dati.bozza : true , 
                point: dati.point
        }
        let option = {
                ltitle     : "type:string|length:<:32",
                type       : "type:boolean",
                link       : "type:string",
                time       : "type:number",
                timeText   : "type:string",
                description: "type:string|length:<:230",
                bozza      : "type:boolean",
                point      : "type:number|length:>:-1",
        }

        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , data:Var.msg});
        

        //controllo se il nome è uguale ad un altra lezione dello stesso creatore
        let allLesson = await lessonModel.find({['access.c']: dati.access.creator});
        if(allLesson){
            let nameLesson = allLesson.find(e => e.n.toLowerCase() == dati.ltitle.toLowerCase() && ! new RegExp(dati._id).test(e._id))
            if(nameLesson) return res.json({success:false , data:'nome lezione già in uso'});
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

        const lesson = {
            n: dati.ltitle,
            d: dati.description,
            s: (dati.bozza) ? 'bozza' : 'pubblico',
            l: dati.link,
            f: dati.pathDati ?? '',
            ti: dati.time + ' ' + dati.timeText,
            access: dati.access,
            quiz: (dati.quiz) ? dati.quiz : null,
            point: dati.point
        }

        await lessonModel.replaceOne({_id: dati._id}, lesson);
        return res.json({success:true , data:'lesson is live'})

    }catch(e){
        console.log(e);
        res.json({success:'error'})
    }
}

async function deleteLesson(req,res){
    try{
        let lessonAccess = await accessLesson(req.body.userId, req.body.lessonId)
        if(!lessonAccess) return res.json({success:false , data:'utente non autorizzato'});


        //sistema di memorizzazione file
        let filePrecedente = await lessonModel.findOne({_id: req.params.id}).select('f')
        if(filePrecedente?.f && filePrecedente.f !== ''){
            try{
                await fs.rm(filePrecedente.f);
                await fs.rmdir(path.join(filePrecedente.f, '../'));
            }catch(e){console.log('non è stato possibile cancellare il file')}
        }

        let response = await lessonModel.deleteOne({_id: req.params.id});
        if(!Boolean(response.deletedCount)) return res.json({success:false, msg:'lesson not found'})
        return res.json({success: true , msg:'lezione elliminata'})
        

    }catch(e){
        return res.json({success: 'error'});
    }
}

async function getAllUserLesson(req,res){
    try{
        let lessonAll = await lessonModel.find({['access.c']: req.body.id});
        if(!lessonAll) return res.json({success:false , data:'lezioni non disponibili'});


        for(let y = 0 ; y < lessonAll.length; y++ ){
            for(let x = 0 ; x < lessonAll[y].access.prof.length  ; x++){
                let userName =  await userModel.findOne({_id: lessonAll[y].access.prof[y].n}).select('user');
                if(userName) lessonAll[y].access.prof[x].n = userName.user
            }
        };

        return res.json({success:true, data:lessonAll});

    }catch(e){
        res.json({success:false, data:'error server'});
    }
}



//funzioni ripetitive
async function accessLesson(idUser, idlesson){
    try{
        let resp = await lessonModel.findOne({_id:idlesson}).select('access');
        if(!resp) return false;
        //controlla se è il creatore del corso
        if(resp.access.c === idUser) return 'creator';
        //controlla se è un prof
        if(resp.access.prof.find(element => (element.n === idUser && element.g === 'modifiche'))) return 'prof';
        return false;

    }catch(e){console.log(e); return {success:err, date:'errore controllo utente accesso al corso'}}
}

//memorizzazione di un file
async function fileSave(file , creator , title){
    //creator nome creatore   //title   titolo del corso    //file    nome del file
    
    let pathName = path.join(__dirname, `../public/upload/lesson/${creator}/`);
    let pathCourse = path.join(pathName , title.replaceAll(' ','-'));
    let pathComplite = path.join(pathCourse , file.name.replaceAll(' ','-'));

    //controllare se le cartelle esistono
    try{
       
        //directory id creatore
        try{await fs.mkdir(pathName, {recorsive: true})}
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
    getAll,
    save,
    update,
    deleteLesson,
    getSingleLesson,
    getAllUserLesson
}