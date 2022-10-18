let path = require('path');
let fs = require('fs/promises');

let userModel = require('../model/userModel');
let simulationModel = require('../model/simulationModel');

const Validator = require('../../private_modules/validator');


async function getAllSimulation(req, res){
    try{
        let allSimulation = await simulationModel.find({s: {$nin:['bozza']}, course: {$nin:[true]}}).select('d n f time')
        if(allSimulation.length === 0) return res.json({success: false, data :[] , msg: 'non ci sono simulazioni'});

        return res.json({success: true, data: allSimulation})

    }catch(e){console.log(e); return res.json({success:'error'})}
    
}

async function getSingleSimulation(req, res){
    try{
        let simulation = await simulationModel.findOne({n: req.params.name})
        if(!simulation) return res.json({success: false, data :[] , msg: 'simulazione non trovata'});

        //controlla il reset dei dati
        if(simulation.reset.active){
            let timeNow = Math.floor(Date.now() / 1000);
            let scad = simulation.reset.start + (60*60*24) * simulation.reset.for;

            if(timeNow > scad ){
                //cancella dati
                simulation.table = [];
                simulation.chapter.map((cap , capIndex) => {
                    cap?.li_ma.map((subCap, subCapIndex) => {
                        subCap.quiz.map((dom, domIndex) => {
                            dom.answere.map((answere , ansindex) => {
                                simulation.chapter[capIndex].li_ma[subCapIndex].quiz[domIndex].answere[ansindex].p = 0
                            })
                        })
                        
                    })
                })
                
                //inserisci nuovo start
                simulation.reset.start = timeNow;

            }
        }
        //se la simulazione viene avviata e non solo vista
        if(req.body.start){
            if(simulation.course){
                let user = await userModel.findById({_id:req.body.userId}).select('simu');
                let index = user.simu.findIndex(x => x === simulation._id.toString())
                if(user.simu.findIndex(x => x.simId === simulation._id.toString()) === -1) return res.json({success:false, msg:'permesso negato'})
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
        if(!user?.simu) return res.json({success: false , msg:'prima volta'})

        let oneSim = user.simu.find(sim => sim.simId === req.body.simId)?.dom;
        return res.json({success: true, ans: oneSim})

    }catch(e){console.log(e)}
    


    
}

async function createSimulation(req, res){
    try{
        let dati = req.body;

        if(/[^a-z-]/g.test(dati.pack.toLowerCase())){ return res.json({success:false , msg:'formato raccolta non valido'})}
        dati.pack = dati.pack.toLowerCase();



        let validator = new Validator();
    
        dati.time= parseInt(dati.time) || 30;
       
 
    
        dati.d = dati.d ?? '';
        dati.n = dati.n ?? '';
        dati.s = (dati.s === false || dati.s === undefined) ? false : true; //bozza
        dati.course = dati.course || false
 
        //verifica dati
        let input = {
            name: dati.n,
            description: dati.d,
            bozza: dati.s,
            time: dati.time,
            course: dati.course
        }
    
        let option = {
            name       : "type:string|length:<:32|length:>:4",
            description: "type:string|length:<:230",
            bozza      : "type:boolean",
            time       : "type:number|value:>:0", 
            course     : "type:boolean"
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
    
    
        //controllo db
        let allSimulation = await simulationModel.find({n: dati.n}).select('_id')
        if(Boolean(allSimulation.length)) return res.json({success: false , msg:`il nome "${dati.n}" è già in uso`})

        const simulation = new simulationModel({
            name: dati.n,
            pack: dati.pack,
            description: dati.d,
            status: (dati.s) ? 'bozza' : 'pubblico',
            access: dati.access,
            file: '',
            time: dati.time,
            chapter: dati.chapter,
            reset: reset,
            table: [],
            hit: {h:0 , e:0},
            course: dati.course
        })

        let simulationId = await simulation.save();

        //sistema di memorizzazione file
        if(dati.file?.file){
            let response = await fileSave(dati.file, dati.access.c , simulationId._id.toString());
            if(!response) return res.json({success:false , msg:'problema nel caricare il file'});
            dati.pathDati = response;
            simulationId.file = dati.pathDati || '';
            await simulation.save();
        }
       


        return res.json({success:true , data:'la simulazione è stata salvata'})

    }catch(e){console.log(e); res.json({success:'errorr'})}

}

async function updateSimulation(req, res){
    try{
        let dati = req.body;

        if(/[^a-z-]/g.test(dati.pack.toLowerCase())){ return res.json({success:false , msg:'formato raccolta non valido'})}
        dati.pack = dati.pack.toLowerCase();


        let validator = new Validator();
    
        dati.time = parseInt(dati.time) || 30;
    
        dati.d = dati.d ?? '';
        dati.n = dati.n ?? '';
        dati.s = (dati.s === false || dati.s === undefined) ? false : true; //bozza
        dati.course = dati.course || false;
    
        //verifica dati
        let input = {
            name: dati.n,
            description: dati.d,
            bozza: dati.s,
            time: dati.time,
            course: dati.course
         
        }
    
        let option = {
            name       : "type:string|length:<:32|length:>:4",
            description: "type:string|length:<:230",
            bozza      : "type:boolean",
            time       : "type:number|value:>:0",
            course     : "type:boolean"
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
        if(dati.file?.file && dati.file.file != 'not'){

            let response = await fileSave(dati.file, dati.access.c , dati._id);
            if(!response) return res.json({success:false , msg:'problema nel caricare il file'});
            dati.pathDati = response;
        }else{
            if(dati?.f && dati.f !== ''){
                await fs.rm(dati.f);
                dati.f = '';
                dati.pathDati = '';
            }
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
            pack: dati.pack,
            d: dati.d,
            s: (dati.s) ? 'bozza' : 'pubblico',
            access: dati.access,
            f: dati.pathDati ?? '',
            time: dati.time,
            chapter: dati.chapter,
            reset: reset,
            course: dati.course
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
        let filePrecedente = await simulationModel.findOne({_id: req.params.id}).select('f');
        if(filePrecedente?.f && filePrecedente.f !== ''){
            try{
                await fs.rm(filePrecedente.f);
                await fs.rmdir(path.join(filePrecedente.f, '../'));
            }catch(e){console.log('non è stato possibile cancellare il file')}
        }

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
        simulation.chapter?.map((cap , capIndex) => {
            cap.quiz?.map((dom, domIndex) => {
                dom.answere?.map((answere , ansindex) => {
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
try{
    let user = req.body.userId; let sim = req.body.simId ; let risp = req.body.resp;

    let answere = await simulationModel.findById({_id: sim}).select('_id chapter table hit');
    if(!answere) return res.json({success: false, msg:"simulazione non trovata"});

    let userDb = await userModel.findById({_id: user}).select('user simu');
    if(!userDb) return res.json({success: false, msg:"utente non trovata"});

    if(req.body.mod){ answere.hit.h = (answere?.hit?.h || 0) + 1
    }else{ answere.hit.e = (answere?.hit?.e || 0) + 1}

    let total = (answere.hit.e || 0) + (answere.hit.h || 0)
    let totalUserPoint = 0 //punti totali fatti dall'utente


//controllo aggiornamenti (creatore ha aggiunto e l'utente aveva già dei dati)
    let simUserIndex = userDb.simu.findIndex(x=> x.simId === sim);
    if(simUserIndex !== -1){
        //controllo materie
        answere.chapter.map((mat) => {
            let materiaIndex = userDb.simu[simUserIndex].stat.findIndex(x => x.mat === mat.ma)
            if(materiaIndex !== -1){
                mat.li_ma.map((cap) => {

                    if(userDb.simu[simUserIndex].stat[materiaIndex].cap.findIndex(z => z.n === cap.t) === -1){
                        userDb.simu[simUserIndex].stat[materiaIndex].cap.push({
                           n: cap.t
                        })
                        
                    }

                })
            }else{
                userDb.simu[simUserIndex].stat.push({
                    mat: mat.ma,
                    cap: mat.li_ma.map(y => {return {n: y.t}})
                })
            }
        })
    }

    let correction = {} ;
    let percentuale = {}; //percentuale di risposte corrette per materia della simulazione per l'utente
    let Allpercent = {}; //percentuale quante volte gli utenti hanno risposto con quella domanda
    for(let x = 0 ; x < answere.chapter.length ; x++){
        let categoria = answere.chapter[x]
        correction[categoria.ma] = [];
        Allpercent[categoria.ma] = [];
        percentuale[categoria.ma] = [];

        for(let sub = 0 ; sub < categoria.li_ma.length; sub++){

            let subCat = categoria.li_ma[sub];
            correction[categoria.ma].push({name: subCat.t , domande: []})
            Allpercent[categoria.ma].push({name: subCat.t , domande: []})
            percentuale[categoria.ma].push({name: subCat.t , point: [subCat.quiz.length , 0]})
            let indexCategoria = sub//risp[categoria.ma]?.findIndex(x => x.name === subCat.t)
            
            for(let dom = 0 ; dom < subCat.quiz.length; dom++){
                let domanda = subCat.quiz[dom];
                let rGiusta = domanda.answere.findIndex(ris => ris?.c);
                Allpercent[categoria.ma]?.[indexCategoria]?.domande.push([]);
                
                //aggiornamento delle risposte date da tutti gli utenti
                domanda.answere.map((y,yindex) => {
                    Allpercent[categoria.ma]?.[indexCategoria]?.domande[dom].push(y.p || 0)
                   
                    if( risp[categoria.ma]?.[indexCategoria]?.dom?.[dom] !== null &&  
                        risp[categoria.ma]?.[indexCategoria]?.dom?.[dom] !== undefined &&  
                        yindex === risp[categoria.ma]?.[indexCategoria]?.dom?.[dom]
                    ){
                        //per il client 
                        Allpercent[categoria.ma][indexCategoria].domande[dom][yindex] += 1;
                        //per il db 
                       (answere.chapter[x].li_ma[sub].quiz[dom].answere[yindex]?.p !== undefined) 
                           ? answere.chapter[x].li_ma[sub].quiz[dom].answere[yindex].p += 1 
                           : answere.chapter[x].li_ma[sub].quiz[dom].answere[yindex].p = 0
                    }
                })
                
                //correzione
                if(risp[categoria.ma]?.[indexCategoria]?.dom?.[dom] === undefined || 
                   risp[categoria.ma]?.[indexCategoria]?.dom?.[dom] === null ){
                    //risposta non trovata
                    correction[categoria.ma][indexCategoria].domande.push(0)
                }
                else if(rGiusta === risp[categoria.ma]?.[indexCategoria]?.dom[dom]){
                    //l'utente ha risposto correttamente
                    
                    correction[categoria.ma][indexCategoria].domande.push(1);
                    totalUserPoint += 1;
                    percentuale[categoria.ma][indexCategoria].point[1] += 1;
    
                }else if(risp[categoria.ma]?.[indexCategoria]?.dom[dom] === -1 || 
                         risp[categoria.ma]?.[indexCategoria]?.dom[dom] !== rGiusta)
                {
                    //l'utente ha risposto male o l'utente non ha voluto rispondere
                    correction[categoria.ma][indexCategoria].domande.push(0)
                }

            }


        }

        ////calcolo percentuale totale di risposte date da tutti gli utenti
        perCent= {}
        for( cat in Allpercent){
            perCent[cat] = [] //push({name: Allpercent[cat].name , domande: []})

            Allpercent[cat].map((cap, capIndex) => {
                perCent[cat].push({name: cap.name, domande:[]});

                Allpercent[cat][capIndex].domande.map((x, index) => {
                    perCent[cat][capIndex].domande.push(x.map(punti => Number((100*punti / total).toFixed(2))))

                    let nonfatte = perCent[cat][capIndex].domande[index].reduce((x,y) => x+y)
                    perCent[cat][capIndex].domande[index].push( Number((100 - nonfatte).toFixed(2)))
                })


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
            if(totalUserPoint > answere.table[userPointIndex].p){ answere.table[userPointIndex] = objPoint;}
        }else{ answere.table.push(objPoint)}

    }


    if(!userDb?.simu) userDb.simu = [];
        let simulationUser = userDb.simu.findIndex(x => x.simId === sim)
        
        if(simulationUser !== -1 ){
            
            userDb.simu[simulationUser].hit += 1
            let simulation = userDb.simu[simulationUser]
            
            simulation.stat.map((mat, matIndex) => {
                
                if(percentuale?.[mat.mat]){

                    mat.cap.map((cap, capIndex) => {

                        let realIndexcap = percentuale[mat.mat].findIndex(x => x.name === cap.name)
                        
                        if(realIndexcap !== -1){
                           let breveCap = percentuale[mat.mat][realIndexcap].point;
                           //se il capitolo è nuovo l'utente non ha punti quindi si inizia da qui la raccolta
                           if(!cap?.num){
                                userDb.simu[simulationUser].stat[matIndex].cap[capIndex].num = Number((100*breveCap[1]/breveCap[0]).toFixed(2))
                           }else{
                                let oldPoint = cap.num;
                                let newPoint = Number((100 * breveCap[1] / breveCap[0]).toFixed(2))
                                userDb.simu[simulationUser].stat[matIndex].cap[capIndex].num = Number(((oldPoint+newPoint)/2).toFixed(2))
                           }                       
                        }
                    })
                }
                
            })
        }else{
            //inizzializato
            let lastIndex = userDb.simu.length
            userDb.simu.push({
                simId: sim,
                stat: [],
                dom:  [],
                hit: 1 
            })
            let allMaterie = []
            answere.chapter.map((mat, matIndex) => {
                
                let capitoli = []
                mat.li_ma.map((cap, capIndex) => {

                    let p = Number((100 * percentuale[mat.ma][capIndex].point[1] / cap.quiz.length).toFixed(2))
                    capitoli.push({n:cap.t, num: p})
                })

                allMaterie.push({
                    mat: mat.ma,
                    cap: capitoli
                })
                
            })
           
            userDb.simu[lastIndex].stat = allMaterie;
        }

    await userDb.save();
    await answere.save();
    return res.json({success: true , correction: correction , percentualeUser: percentuale , p: perCent})
}catch(e){console.log(e); res.json({success:'error'})}
    



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
    
        if(!user?.simu) user.simu = []
        let index = user.simu.findIndex(x => x.simId === req.body.simId);
       
        if(index === -1){ 
            user.simu.push({
                simId: req.body.simId,
                stat: [],
                hit: 0,
                dom: [{mat: req.body.materia, cap:[{n:req.body.capitolo , a:[req.body.indexDom]}]}]
            })
        }else{

            let matIndex = user.simu[index].dom.findIndex(mat => mat.mat === req.body.materia);
            if(matIndex === -1){
                //se la materia non esiste
                user.simu[index].dom.push({ 
                    mat: req.body.materia,
                    cap: [{n: req.body.capitolo , a: [req.body.indexDom]}]
                })
            }else{
                let capIndex = user.simu[index].dom[matIndex].cap.findIndex(cap => cap.n === req.body.capitolo);
                if(capIndex === -1){
                    //se il capitolo non esiste
                    user.simu[index].dom[matIndex].cap.push({n: req.body.capitolo , a:[req.body.indexDom]})
                }else{
                    let domIndex = user.simu[index].dom[matIndex].cap[capIndex].a.findIndex(x => x === req.body.indexDom)
                    if(domIndex === -1 ){
                        //salva domanda perchè non c'è
                        user.simu[index].dom[matIndex].cap[capIndex].a.push(req.body.indexDom)
             
                    }else{
                        //domanda esistente
                        user.simu[index].dom[matIndex].cap[capIndex].a.splice(domIndex, 1);
                        msg = 'domanda cancellata';
                        cancell = true;
                    }
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
        let macroStatistiche = []
        if(Boolean(user?.simu.length)){
            for(let sim = 0 ; sim < user.simu.length ; sim++){

                let simu = {
                    n: 'simulazione cancellata!',
                    hit: user.simu[sim].hit,
                    simId: user.simu[sim].simId,
                }

                let simulation = await simulationModel.findById({_id: user.simu[sim].simId}).select('n pack');

                if(simulation){ 
                    simu.n = simulation.n;
                    if(user.simu[sim]?.stat){
                       
                        let indexPack = macroStatistiche.findIndex(x => x.pack === simulation.pack);
                        if(indexPack === -1) indexPack = macroStatistiche.push({ pack: simulation.pack , materie:[]}) - 1
    
                        user.simu[sim].stat.forEach(materia => {
                            console.log()
                            let indexMateria = macroStatistiche[indexPack].materie.findIndex(x => x.materia === materia.mat);
                            if(indexMateria === -1 ) indexMateria = macroStatistiche[indexPack].materie.push({ materia: materia.mat , capitoli:[]}) - 1
    
 
                            materia.cap.forEach(capitolo => {
                                let indexCapitolo = macroStatistiche[indexPack].materie[indexMateria].capitoli.findIndex(x => x.capitolo === capitolo.n);
                                if(indexCapitolo === -1 ){
                                    
                                    macroStatistiche[indexPack].materie[indexMateria].capitoli.push({ capitolo: capitolo.n , num: capitolo.num})                      
                                }else{
                                    let percentuale = (macroStatistiche[indexPack].materie[indexMateria].capitoli[indexCapitolo].num +  capitolo.num)/2

                                    macroStatistiche[indexPack].materie[indexMateria].capitoli[indexCapitolo].num =  Number.parseInt(percentuale)
                                }
                                
                            })
                        })
                    }

                }
                
                simulations.push(simu)
            }
        }


        return res.json({success: true , simulations: simulations , macro: macroStatistiche})

    }catch(e){console.log(e); return res.json({success: 'error'})}
}


//memorizzazione di un file
async function fileSave(file , creator , title){
    //creator nome creatore   //title   titolo del corso    //file    nome del file
    
    let pathName = path.join(__dirname, `../public/upload/simulation/${creator}/`);
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
        const base64Data = file.file.split('base64,')[1];
        await fs.writeFile(pathComplite, base64Data ,{encoding: 'base64'});
        return pathComplite;
    }catch(e){console.log('problema nel caricare il file sul server') ; console.log(e);return false}

}


async function getUserSimulationInfo(req, res){
    try{

        let user = await userModel.findById({_id: req.body.userId}).select('simu');
        if(!user) return res.json({success:false , msg:'utente non trovato'})

        let userSim = user.simu.find(x => x.simId === req.body.simId);

        let simulation = await simulationModel.findById({_id: req.body.simId}).select('n chapter');
        //if(!simulation) return res.json({success:false , msg:'simulazine non trovata'})

        let date = {}
        let materieSave = []
        if(Boolean(simulation)){
            userSim.dom.map((mat) => {
                let simMateria = simulation.chapter.find(mate => mate.ma === mat.mat)
                if(!simMateria) return ; 
               
                let capitoli = []
                mat.cap.map((cap) => {
                    let simCap = simMateria.li_ma.find(capi => capi.t === cap.n)
                    if(!simCap) return;
                    let domande = []
    
                    cap.a.map((x) => {
                        domande.push(simCap.quiz[x])
                    })
                    if(!Boolean(domande.length)) return;
                    capitoli.push({n: cap.n, dom: domande})
                })
                if(!Boolean(capitoli.length)) return;
                materieSave.push({mat: mat.mat, cap: capitoli})
            })
        }else{
            materieSave = false
        }
        
        
        date.saveDom = materieSave
        date.name = simulation?.n || 'simulazione cancellata';

        return res.json({success: true , userDate: userSim , simulation: date })

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