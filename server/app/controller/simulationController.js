let path = require('path');
let fs = require('fs');

let userModel = require('../model/userModel');
let simulationModel = require('../model/simulationModel');

const Validator = require('../../private_modules/validator');


async function getAllSimulation(req, res){
    try{
        let allSimulation = await simulationModel.find({s: {$nin:['bozza']}}).select('d n f time')
        if(allSimulation.length === 0) return res.json({success: false, data :[] , msg: 'non ci sono simulazioni'});

        return res.json({success: true, data: allSimulation})

    }catch(e){console.log(e)}
    
}

async function getSingleSimulation(req, res){
    try{
        let simulation = await simulationModel.findOne({n: req.params.name}).select('d n time chapter table hit reset access')
        if(!simulation) return res.json({success: false, data :[] , msg: 'simulazione non trovata'});

        //controlla il reset dei dati
        if(simulation.reset.active){
            let timeNow = Math.floor(Date.now() / 1000);
            let scad = simulation.reset.start + (60*60*24) * simulation.reset.for;

            if(timeNow > scad ){
                //cancella dati
                simulation.table = [];
                simulation.chapter.map((cap , capIndex) => {
                    cap.quiz.map((dom, domIndex) => {
                        dom.answere.map((answere , ansindex) => {
                            simulation.chapter[capIndex].quiz[domIndex].answere[ansindex].p = 0
                        })
                    })
                })
                
                //inserisci nuovo start
                simulation.reset.start = timeNow;

            }
        }
       
        await simulation.save()
        return res.json({success: true, data: simulation})

    }catch(e){console.log(e)}
    
}

async function getSaveAnswere(req, res){
    try{

        let user = await userModel.findById({_id: req.body.user}).select('simu')
        if(!user) return res.json({success: false , msg:'utente non trovato'});

        let oneSim = user.simu.find(sim => sim.simId === req.body.simId).dom;

        return res.json({success: true, ans: oneSim})

    }catch(e){console.log(e)}
    


    
}

async function createSimulation(req, res){
    try{
        let dati = req.body;
        let validator = new Validator();
    
        dati.time.o = parseInt(dati.time.o) || 0;
        dati.time.m = parseInt(dati.time.m) || 0;
        if(dati.time.m === 0 && dati.time.o === 0) dati.time.o = 1
    
        dati.d = dati.d ?? '';
        dati.n = dati.n ?? '';
        dati.s = (dati.s === false || dati.s === undefined) ? false : true; //bozza
 
        //verifica dati
        let input = {
            name: dati.n,
            description: dati.d,
            bozza: dati.s,
            timeO: dati.time.o,
            timeM: dati.time.m
        }
    
        let option = {
            name       : "type:string|length:<:32|length:>:4",
            description: "type:string|length:<:230",
            bozza      : "type:boolean",
            timeO      : "type:number|value:<:24",
            timeM      : "type:number|value:<:60"
        }
    
        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , msg:Var.msg});
    
    
        //reset dati online
        let reset = {active: false};
        if(dati.reset.active){
            reset.active = true;
            reset.for = parseInt(dati.reset.for) || 15;
            if(dati.reset.daOra || !dati.reset?.start) reset.start = Math.round(Date.now() / 1000);
        }




        //controllo dei prof che hanno accesso
        let user = []
        for(x = 0 ; x < dati.access['user'].length ; x++){
            let sinUser = dati.access['user'][x];
            
            let resUser = await userModel.findOne({user: sinUser}).select('_id');
            if(!resUser) {console.log('utente inesistente ' + x); break}
    
            //controllare se il prof inserito non è il creatore
            
            if(!new RegExp(dati.access.c).test(resUser._id)) user.push( resUser._id.toString());
        }
    
        dati.access.user = user;

        //sistema di memorizzazione file
        if(dati.file?.file){
            let pathName = path.join(__dirname, `../public/upload/simulation/${dati.access.c}/` )
            let pathCourse = path.join(pathName+dati.n.replaceAll(' ','-')) 
            let pathComplite = path.join(pathCourse+'/'+dati.file.name.replaceAll(' ','-')) 
            
            //dcrivere nome utente e nome corso
            if(!fs.existsSync(pathName)){ fs.mkdirSync(pathName)}
            if(!fs.existsSync(pathCourse)){ fs.mkdirSync(pathCourse)}
    
            fs.writeFile(pathComplite , dati.file.file ,{ flag: 'a+' } , err => {
                if(err) console.log('file non inviato '+ err)
            })
            dati.pathDati = `/public/upload/simulation/${dati.access.c}/${dati.n.replaceAll(' ','-')}/${dati.file.name.replaceAll(' ','-')}`;
        }
    
    
        //controllo db
        let allSimulation = await simulationModel.find({n: dati.n}).select('_id')
        if(Boolean(allSimulation.length)) return res.json({success: false , msg:`il nome "${dati.n}" è già in uso`})

        const simulation = new simulationModel({
            name: dati.n,
            description: dati.d,
            status: (dati.s) ? 'bozza' : 'pubblico',
            access: dati.access,
            file: dati.pathDati ?? '',
            time: dati.time,
            chapter: dati.chapter,
            reset: reset,
            table: [],
        })

        await simulation.save();
        return res.json({success:true , data:'la simulazione è stata salvata'})

    }catch(e){console.log(e); res.json({success:'errorr'})}

}

async function updateSimulation(req, res){
    try{
        let dati = req.body;
        let validator = new Validator();
    
        dati.time.o = parseInt(dati.time.o) || 0;
        dati.time.m = parseInt(dati.time.m) || 0;
        if(dati.time.m === 0 && dati.time.o === 0) dati.time.o = 1
    
        dati.d = dati.d ?? '';
        dati.n = dati.n ?? '';
        dati.s = (dati.s === false || dati.s === undefined) ? false : true; //bozza
    
        //verifica dati
        let input = {
            name: dati.n,
            description: dati.d,
            bozza: dati.s,
            timeO: dati.time.o,
            timeM: dati.time.m
        }
    
        let option = {
            name       : "type:string|length:<:32|length:>:4",
            description: "type:string|length:<:230",
            bozza      : "type:boolean",
            timeO      : "type:number|value:<:24",
            timeM      : "type:number|value:<:60"
        }
    
        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , msg:Var.msg});
    
        //reset dati online
        let reset = {active: false};
        if(dati.reset.active){
            reset.active = true;
            reset.for = parseInt(dati.reset.for) || 15;
            reset.start = dati.reset?.start || false;
            if(dati.reset.daOra || !dati.reset?.start){ reset.start = Math.round(Date.now() / 1000);}
        }
    
        //controllo dei prof che hanno accesso
        let user = []
        for(x = 0 ; x < dati.access['user'].length ; x++){
            let sinUser = dati.access['user'][x];
            
            let resUser = await userModel.findOne({user: sinUser}).select('_id');
            if(!resUser) {console.log('utente inesistente ' + x); break}
           
            //controllare se il prof inserito non è il creatore
            if(!new RegExp(dati.access.c).test(resUser._id)) user.push( resUser._id.toString());
        }
    
        dati.access.user = user;

        //sistema di memorizzazione file
        if(dati?.f  && dati.f !== ''){fs.unlinkSync(__dirname + '/..'+ dati.f) ; dati.f = ''}

        if(dati.file?.file === 'not') dati.pathDati = '';

        if(dati.file?.file && dati.file?.file !== 'not'){
            let pathName = path.join(__dirname, `../public/upload/simulation/${dati.access.c}/` )
            let pathCourse = path.join(pathName+dati.n.replaceAll(' ','-')) 
            let pathComplite = path.join(pathCourse+'/'+dati.file.name.replaceAll(' ','-')) 
            
            //dcrivere nome utente e nome corso
            if(!fs.existsSync(pathName)){ fs.mkdirSync(pathName)}
            if(!fs.existsSync(pathCourse)){ fs.mkdirSync(pathCourse)}
    
            fs.writeFile(pathComplite , dati.file.file ,{ flag: 'a+' } , err => {
                if(err) console.log('file non inviato '+ err)
            })
            if(dati.file.file && pathComplite !== dati.f) dati.pathDati = `/public/upload/simulation/${dati.access.c}/${dati.n.replaceAll(' ','-')}/${dati.file.name.replaceAll(' ','-')}`
        }
    
        //controllo db
        let allSimulation = simulationModel.findOne({n: dati.n , _id: {$nin:[dati._id]}}).select('_id');
        if(allSimulation._id) return res.json({success: false, dati:'titolo simulazione già in uso'});

         //controllo corso bloccato
         let simulationBlock = await simulationModel.findById({_id: dati._id})
         if(!simulationBlock) return res.json({success:false , msg: 'corso non trovato, impossibilità di vedere se è bloccato'})
         
         if(simulationBlock?.block) dati.s = true;

        const simulation = {
            n: dati.n,
            d: dati.d,
            s: (dati.s) ? 'bozza' : 'pubblico',
            access: dati.access,
            f: dati.pathDati ?? '',
            time: dati.time,
            chapter: dati.chapter,
            reset: reset
        }

        await simulationModel.updateOne({_id: dati._id}, simulation  )
        return res.json({success:true , data:'la simulazione è stata salvata'})

    }catch(e){console.log(e); res.json({success:'error'})}
}

async function getModifySimulation (req, res){

    try{
        let simulations = await simulationModel.find({$or: [{'access.c': req.body.id} , {'access.user': req.body.id}]});
        if(!simulations) return res.json({success:false, msg: 'simulazioni non trovate'});

        for(let x = 0 ; x < simulations.length; x++){
            for(let y = 0 ; y < simulations[x].access.user.length ; y++){
                let user = await userModel.findOne({_id: simulations[x].access.user[y]}).select('-_id user')
                if(user) simulations[x].access.user[y] = user.user
            }
        }

        return res.json({success:true , simulations: simulations})

    }catch(e){console.log(e)}

}

async function deleteSimulation(req, res){
    try{
        let simulation = await simulationModel.findById({_id: req.body.simId}).select('access f');
        if(!simulation) res.json({success: false , msg: 'simulazione non trovata'})


        if(simulation.access.c !== req.body.userId){
            if(simulation.access.user.find(x => x ===  req.body.userId)) return res.json({success: false , msg: 'utente non autorizzato'})
        }
        

        //sistema di memorizzazione file
        let filePrecedente = simulation.f || undefined;
        if(filePrecedente) await fs.unlink(path.join(__dirname , '../'+filePrecedente) , (err) => console.log(err));


        let resp = await simulationModel.findByIdAndDelete(req.params.id);
        if(!resp) return res.json({success: false , date:'corso non trovato per X'});
        res.json({success:true});

    }catch(e){console.log(e); res.json({success:'err'})}
}

async function deletePublicDate(req, res){
    try{
        let simulation = await simulationModel.findById({_id: req.body.simId})
        if(!simulation) return res.json({success: false , msg: 'simulazione non trovata'});
    
        //controllo autorizzazione utente
        if(simulation.access.c !== req.body.userId){
            if(!simulation.access.user.find(x => x ===  req.body.userId)) return res.json({success: false , msg:'utente non autorizzato'})
        }
    
    
        simulation.table = []
        simulation.chapter.map((cap , capIndex) => {
            cap.quiz.map((dom, domIndex) => {
                dom.answere.map((answere , ansindex) => {
                    simulation.chapter[capIndex].quiz[domIndex].answere[ansindex].p = 0
                })
            })
        })
    
        await simulation.save();
        return res.json({success: true , msg: 'dati simulazione cancellati correttamente'});
    }catch(e){console.log(e) ; return res.json({success: 'error'})}
}

async function getAllUserSimulation(req,res){
    try{
        let allSimulation = await simulationModel.find({'access.c': req.body.id});
        if(!allSimulation) return res.json({success:false , data:'l\'utente non ha corsi'});

        for(let x = 0 ; x < allSimulation.length; x++){
            for(let y = 0 ; y < allSimulation[x].access.user.length ; y++){
                let user = await userModel.findOne({_id: allSimulation[x].access.user[y]}).select('-_id user')
                if(user) allSimulation[x].access.user[y] = user.user
            }
        }

        res.json({success:true, simulations: allSimulation});
    }catch(e){
        res.json({success:false, data:'error server'});
    }
}

async function correctionSimulation(req, res){

    let user = req.body.userId; let sim = req.body.simId ; let risp = req.body.resp;

    let answere = await simulationModel.findById({_id: sim}).select('_id chapter table hit');
    if(!answere) return res.json({success: false, msg:"simulazione non trovata"});

    let userDb = await userModel.findById({_id: user}).select('user simu');
    if(!userDb) return res.json({success: false, msg:"utente non trovata"});

    if(req.body.mod){ answere.hit.h = (answere?.hit?.h || 0) + 1
    }else{ answere.hit.e = (answere?.hit?.e || 0) + 1}

    let total = (answere.hit.e || 0) + (answere.hit.h || 0)
    let totalUserPoint = 0 //punti totali fatti dall'utente


    let correction = {} ;
    let percentuale = {}; //percentuale di risposte corrette per materia della simulazione per l'utente
    let Allpercent = {}; //percentuale quante volte gli utenti hanno risposto con quella domanda
    for(let x = 0 ; x < answere.chapter.length ; x++){
        let categoria = answere.chapter[x]
        correction[categoria.ma] = [];
        Allpercent[categoria.ma] = [];
        percentuale[categoria.ma] = [categoria.quiz.length , 0]

        for(let dom = 0 ; dom < categoria.quiz.length; dom++){
            let domanda = categoria.quiz[dom];
            Allpercent[categoria.ma].push([])
            let rGiusta = domanda.answere.findIndex(ris => ris?.c)

            domanda.answere.map((y,yindex) => {
                Allpercent[categoria.ma][dom].push(y.p || 0)

                if( risp[categoria.ma]?.[dom] !== null &&  
                    risp[categoria.ma]?.[dom] !== undefined &&  
                    yindex === risp[categoria.ma][dom]
                ){

                    Allpercent[categoria.ma][dom][yindex] += 1
                }
            })
            

            //correzione
            if(risp[categoria.ma]?.[dom] === undefined || risp[categoria.ma]?.[dom] === null ){
                correction[categoria.ma].push(0)
            }
            else if(rGiusta === risp[categoria.ma][dom]){
                correction[categoria.ma].push(1)
                percentuale[categoria.ma][1] += 1
                totalUserPoint += 1

            }else if(risp[categoria.ma][dom] === -1 || risp[categoria.ma][dom] !== rGiusta){
                //l'utente ha risposto male o l'utente non ha voluto rispondere
                correction[categoria.ma].push(0)
            }


            //modifica punteggio risposte per il db
            if (typeof risp[categoria.ma]?.[dom] === 'number' && risp[categoria.ma][dom] !== -1){
                answere.chapter[x].quiz[dom].answere[risp[categoria.ma][dom]].p += 1
            }
        }
    }


    //calcolo percentuale totaledi risposte date da tutti gli utenti
    perCent= {}
    for( cat in Allpercent){
        perCent[cat] = []
        Allpercent[cat].map((x, index) => {
            perCent[cat].push(x.map(punti => Number((100*punti / total).toFixed(2))))

            let nonfatte = perCent[cat][index].reduce((x,y) => x+y)
            perCent[cat][index].push( Number((100 - nonfatte).toFixed(2)))
        })
     
    }

    //salvataggio punteggio user in Simulazione
    let userPointIndex = answere.table?.findIndex(user => user.user = userDb.user);
    let [ore , min , sec] = req.body.time;
    let d = new Date()
    let objPoint = {
        u: userDb.user,
        p: totalUserPoint,
        t: `${ore}:${min}:${sec}`,
        mod:req.body.mod,
        d:`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`
    }

    
    if(userPointIndex !== -1 && userPointIndex !== undefined ){
        if(totalUserPoint > answere.table[userPointIndex].p){
            answere.table[userPointIndex] = objPoint;
        }
    }else{ answere.table.push(objPoint)}

    
    //salvataggio punteggio user Privato
    if(!userDb?.simu) userDb.simu = [];
    let indexSimUser = userDb.simu.findIndex(x => x.simId)
    if(indexSimUser === -1){
        let objpercent = [];
        for(let mat in percentuale){
            let p = Number((percentuale[mat][1]*100 / percentuale[mat][0]).toFixed(2))
            objpercent.push({
                n : mat,
                num: p
            })
        }
        userDb.simu.push(
            {
                simId: sim,
                hit: 1,
                stat: objpercent
            }
        )
    }else{
        userDb.simu[indexSimUser].hit += 1
        //cambio percentuale materia
        userDb.simu[indexSimUser].stat.map((x, index) => {
            let p = (x.num + Number((percentuale[x.n][1]*100 / percentuale[x.n][0]).toFixed(2)));
            let pCent = Number((p /  userDb.simu[indexSimUser].hit).toFixed(2));

            userDb.simu[indexSimUser].stat[index].num = pCent;
        })
    }

    await userDb.save()
    await answere.save()
    return res.json({success: true , correction: correction , percentualeUser: percentuale , p: perCent})



}

async function saveAnswereSimulation(req, res){
    try{
        let simulation = await simulationModel.findById({_id: req.body.simId}).select('chapter')
        if(!simulation) return res.json({success: false, msg: 'simulazione non trovata'})
    
        let user = await userModel.findById({_id: req.body.userId}).select('simu');
        if(!user) return res.json({success: false, msg: 'utente non trovato'});
    
        if(!user?.simu) user.simu = [];
        
        let msg = 'domanda salvata';
        let cancell = false;
    
        let index = user.simu.findIndex(x => x.simId === req.body.simId);
        if(index === -1){
            user.simu.push({
                simId: req.body.simId,
                stat: simulation.chapter.map(x => {return {n: x.ma , num: 0} } ),
                hit: 0,
                dom: [{
                    n: simulation.chapter[req.body.indexMat].ma ,
                    a:[indexDom]
                }]
            })
        }else{
            let matIndex = user.simu[index].dom.findIndex(x => x.n === simulation.chapter[req.body.indexMat].ma);
    
            if(matIndex === -1){
                user.simu[index].dom.push(
                    {
                        n: simulation.chapter[req.body.indexMat].ma,
                        a: [req.body.indexDom]
                    }
                ) 
    
                
            }else{
                //se non è stata già salvata salvala altrimenti cancellala
                if(user.simu[index].dom[matIndex].a.findIndex(x => x === Number(req.body.indexDom)) === -1){
                    user.simu[index].dom[matIndex].a.push(req.body.indexDom);
                }else{
                    user.simu[index].dom[matIndex].a.splice(req.body.indexDom , 1);
                    msg = 'la domanda è stata cancellata'
                    cancell = true
                }
            }
        }
    
    
        await user.save();
        return res.json({success: true , msg: msg , cancell: cancell })

    }catch(e){console.log(e)}

}

async function getUserSimulations(req , res){
    try{
        let user = await userModel.findById({_id: req.body.id}).select('simu')
        if(!user) return res.json({success: false, msg: 'utente non trovato'})

        let simulations = []
        if(Boolean(user?.simu.length)){
            for(let sim = 0 ; sim < user.simu.length ; sim++){

                let simu = {
                    n: 'simulazione cancellata!',
                    hit: user.simu[sim].hit,
                    simId: user.simu[sim].simId
                }

                let simulation = await simulationModel.findById({_id: user.simu[sim].simId}).select('n');
                if(simulation) simu.n = simulation.n;
                
                simulations.push(simu)
            }
        }

        return res.json({success: true , simulations: simulations})

    }catch(e){console.log(e); return res.json({success: 'error'})}
}

async function getUserSimulationInfo(req, res){
    try{

        let user = await userModel.findById({_id: req.body.userId}).select('simu');
        if(!user) return res.json({success:false , msg:'utente non trovato'})

        let userSim = user.simu.find(x => x.simId === req.body.simId);

        let simulation = await simulationModel.findById({_id: req.body.simId}).select('n chapter');
        if(!simulation) return res.json({success:false , msg:'simulazine non trovata'})

        let date = {}
    
        let answers = []
        userSim?.dom.map((mat) => {
            let answere = {n: mat.n , list: []}
            let chapter = simulation.chapter.find(x => x.ma === mat.n)
            mat.a?.map((dom) => {
                answere.list.push(chapter.quiz[dom])
            })
            answers.push(answere)
            
        })
        date.saveDom = answers
        date.name = simulation.n

        return res.json({success: true, simulation: date , userDate: userSim })

    }catch(e){console.log(e); return res.json({success:'error'})}
    
}










module.exports = {
    getAllSimulation,
    getSingleSimulation,

    deletePublicDate,

    createSimulation,
    updateSimulation,
    getModifySimulation,
    deleteSimulation,
    getAllUserSimulation,

    correctionSimulation,
    saveAnswereSimulation,
    getSaveAnswere,
    getUserSimulations,
    getUserSimulationInfo,
}