const gameModel = require('../model/gameModel');
const userModel = require('../model/userModel');
let Validator = require('../../private_modules/validator');
const fs = require('fs/promises');
const path = require('path');
const { Z_BEST_COMPRESSION } = require('zlib');



async function getAll(req , res){
    try{
        let allPack = await gameModel.find();
        return res.json({success: true, pack: allPack});
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function getAllClient(req , res){
    try{
        let allPack = await gameModel.find({s : {$nin:[false]}}).select('t _id');
        return res.json({success: true, pack: allPack});
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function gameClassifica(req , res){
    try{
        let pack = await gameModel.find().select('_id t');
        let pro = []
        for(let x = 0 ; x < pack.length ; x++){
            let userClass = await userModel
                                    .find({'game.pack': pack[x]._id.toString()})
                                    .sort({ 'game.win': -1 }).select('_id game user')
                                    .limit(100)
            let users = []
            userClass.map(z => {
               
                let packIndex = z.game.findIndex(y => y.pack === pack[x]._id.toString());
                if(packIndex === -1 || z.game[packIndex].win <= 0) return
                users.push([z.user, z.game[packIndex].win])
            })
            pro.push([pack[x].t , users])
        }
        
        return res.json({success: true, leader: pro});
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function savePack(req , res){
    try{
        let msg = 'operazione compiuta';

        let pack = req.body.pack;
        let validator = new Validator();
    
        pack.t = pack.t ?? '';
        pack.s = pack.s ?? false;
        let input = {
            title: pack.t,
            stato: pack.s
        }
        let option = {
            title : "type:string|length:<:64",
            stato : "type:boolean",
        }
        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , msg:Var.msg});

        //controllo titolo 
        let packT = await gameModel.findOne({t: pack.t})
        if(packT && packT._id.toString() !== pack._id ) return res.json({success: false, msg: 'titolo pack già in uso'});

        if(pack?._id){
            let packDb = await gameModel.findById({_id: pack._id});
            packDb.t = pack.t;
            packDb.s = pack.s;
            packDb.mat = pack.mat;

            await packDb.save();
        }else{
            const deckData = new gameModel(pack)
            packSave = await deckData.save(); 
        }


        return res.json({success:'ok' , msg:msg })
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function deletePack(req, res){
    try{
        let pack = await gameModel.findByIdAndDelete({_id:req.body.packId});
        if(! pack) return res.json({success:false, msg: 'pack non trovato'})
        return res.json({success: true, msg:'pack eliminato'});
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function findGame(req , res){
    try{ 
        let idSession = '' ; //id della sessione di gioco  

        //non farlo fiocare se non a acquistato il corso
        let player = userModel.findById({_id:req.body.idPlayer}).select('CourseBuy');
        if( !player?.CourseBuy || player?.CourseBuy?.length <= 0) return  res.json({success:false , msg:'devi comprare un corso prima di poter giocare'});
        

        //vedi se esiste una sessione di gioco già iniziata
        let pack = await gameModel.findById({_id: req.body.idPack}).select('game mat');
        if(!pack) return res.json({success:false , msg:'pack non trovato'});
        
        let sessionIndex = pack.game.findIndex(x => (x.p2.id === '' && x.p1.id !== req.body.idPlayer))

        if(sessionIndex === -1 ){
            //non ha trovato una partita già iniziata
            let time = Date.now() + (1000*60*60*24*7);

            //inserisci 9 domande casuali
            let Allmat = [...pack.mat]
            let start = Math.floor(Math.random()*(Allmat.length -1));
            let dom = []
            let maxCicle = 0
            do{
                let questIndex = Math.floor(Math.random()*(Allmat[start].quiz.length -1));
                let test = true;
                let testArray = dom.filter(x => x[0] == start)
                let max = 0
                do{
                    let idemQuestion = testArray.filter(x => x[1] == questIndex);
                    if(Boolean(idemQuestion.length)){
                        //se c'è la stessa domanda cambiala con la seguente
                        ++questIndex
                    }else{test = false}
                    ++max
                }while(test && max < 50)
                dom.push([start, questIndex])
                

                ++start
                ++maxCicle
                if(start >= Allmat.length) start = 0;

            }while(dom.length < 9 && maxCicle < 50) 


            pack.game.push({
                p1: {
                    id: req.body.idPlayer,
                    res:[],
                },
                p2: {
                    id:'',
                    res:[],
                },
                ti: time,
                quest: dom,
                c:0
            })

            let sessionRetrive = pack.game[pack.game.length - 1];
            idSession = sessionRetrive._id.toString();
        }else{
            pack.game[sessionIndex].p2.id = req.body.idPlayer;
            idSession = pack.game[sessionIndex]._id.toString();
        }

        await pack.save();
        return res.json({success: true , idSession: idSession})
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function controllGame(req , res){
    try{ 
        let pack = await gameModel.findOne({_id:req.body.idPack});
        if(!pack) return res.json({success:false, msg:'pack non trovato'});


        let game = pack.game.find(x => x._id.toString() === req.body.idGame);
        
        if(!game) return res.json({success:false, msg:'sessione di gioco non trovata o scaduta'});
        
        return res.json({success: true , game:game})
    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function findQuest(req, res){
    try{
        let pack = await gameModel.findById({_id: req.body.idPack}).select('mat');
        if(!pack) return res.json({success: false, msg: 'pack non trovato'});

        let list = []
        req.body.questList.map(x => {
            list.push(pack.mat[x[0]].quiz[x[1]])
        })
        return res.json({success: true , questions: list})

    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function saveResponse(req, res){
    try{
        let pack = await gameModel.findOne({_id:req.body.idPack});
        if(!pack) return res.json({success:false, msg:'pack non trovato'});

        

        let gameIndex = pack.game.findIndex(x => x._id.toString() === req.body.idGame);
        if(gameIndex === -1) return res.json({success:false, msg:'sessione gioco non trovata'});

        //se è il primo giocatore
        if(pack.game[gameIndex].p1.id.toString() === req.body.idPlayer){
            if(pack.game[gameIndex].c === 0){
                pack.game[gameIndex].p1.res = req.body.risp;
                pack.game[gameIndex].c = req.body.status;
            }
            if(pack.game[gameIndex].c === 3){
                pack.game[gameIndex].p1.res.splice(5);
                let newPack = req.body.risp.splice(5);
                pack.game[gameIndex].p1.res = pack.game[gameIndex].p1.res.concat(newPack);
                pack.game[gameIndex].c = 4;
            }
        }else{
            pack.game[gameIndex].p2.res = req.body.risp
            pack.game[gameIndex].c = 3
        }

        //parte la correzione
        if(pack.game[gameIndex].c === 4){
            point_p1 = 0
            point_p2 = 0

            pack.game[gameIndex].quest.map((que , queIndex) => {
                //first player
                if(pack.mat[que[0]].quiz[que[1]].answere[pack.game[gameIndex].p1.res[queIndex]]?.c === true) point_p1 +=1
                //second player
                if(pack.mat[que[0]].quiz[que[1]].answere[pack.game[gameIndex].p2.res[queIndex]]?.c === true) point_p2 +=1
            })

            //vincitore
            if(point_p1 > point_p2){
                pack.game[gameIndex].win = pack.game[gameIndex].p1.id;
            }else if(point_p1 < point_p2){
                pack.game[gameIndex].win = pack.game[gameIndex].p2.id;
            }else{
                pack.game[gameIndex].win = 'pareggio';
            }


            //aggiornamento statistiche
            let p1 = await userModel.findById({_id: pack.game[gameIndex].p1.id}).select('game');
            if(p1){
                if(p1?.game?.length === undefined) p1.game = [];
                let packIndex = p1.game.findIndex(x => x.pack === req.body.idPack)
                if(packIndex === -1){ 
                    p1.game.push({pack:req.body.idPack, n:0 , win:0 , cat:[]});
                    packIndex = 0
                }

                p1.game[packIndex].n += 1
                if(pack.game[gameIndex].win === p1._id.toString()) p1.game[packIndex].win += 1;
                //per ogni categoria
                pack.game[gameIndex].quest.map((x , index) => {
                    let name = pack.mat[x[0]].t
                    let catIndex = p1.game[packIndex].cat.findIndex(x => x.name === name)
                    if(catIndex === -1){ 
                        p1.game[packIndex].cat.push({name: name, n: 0 , c: 0})
                        catIndex = 0
                    }
                    p1.game[packIndex].cat[catIndex].n += 1;
                    if( pack.mat[x[0]].quiz[x[1]].answere[pack.game[gameIndex].p1.res[index]]?.c === true) p1.game[packIndex].cat[catIndex].c += 1;
                })
                await p1.save();
                
            }
            let p2 = await userModel.findById({_id: pack.game[gameIndex].p2.id}).select('game');
            if(p2){
                if(p2?.game?.length === undefined) p2.game = [];
                let packIndex = p2.game.findIndex(x => x.pack === req.body.idPack)
                if(packIndex === -1){ 
                    p2.game.push({pack:req.body.idPack, n:0 , win:0 , cat:[]});
                    packIndex = 0
                }

                p2.game[packIndex].n += 1
                if(pack.game[gameIndex].win === p2._id.toString()) p2.game[packIndex].win += 1;
                //per ogni categoria
                pack.game[gameIndex].quest.map((x , index) => {
                    let name = pack.mat[x[0]].t
                    let catIndex = p2.game[packIndex].cat.findIndex(x => x.name === name)
                    if(catIndex === -1){ 
                        p2.game[packIndex].cat.push({name: name, n: 0 , c: 0})
                        catIndex = 0
                    }
                    p2.game[packIndex].cat[catIndex].n += 1;
                    if( pack.mat[x[0]].quiz[x[1]].answere[pack.game[gameIndex].p2.res[index]]?.c === true) p2.game[packIndex].cat[catIndex].c += 1;
                })
                await p2.save();
            }
        }
        

        await pack.save();
        return res.json({success: true , msg:'gioco completato' ,status: pack.game[gameIndex].c});

    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function resultGame(req, res){
    try{
        let pack = await gameModel.findOne({_id:req.body.idPack});
        if(!pack) return res.json({success:false, msg:'pack non trovato'});

        let gameIndex = pack.game.findIndex(x => x._id.toString() === req.body.idGame);
        if(gameIndex === -1) return res.json({success:false, msg:'sessione gioco non trovata'});

        let domande = []
        pack.game[gameIndex].quest.map(x => {domande.push(pack.mat[x[0]].quiz[x[1]]);});

        let vincitore = 'pareggio'
        //ricerca nome utenti 
        let p1 = await userModel.findById({_id: pack.game[gameIndex].p1.id}).select('user');
        let p2 = await userModel.findById({_id: pack.game[gameIndex].p2.id}).select('user');
        let persone = [p1.user, p2.user]
        if(pack.game[gameIndex].win !== 'pareggio'){
            let winner = await userModel.findById({_id: pack.game[gameIndex].win}).select('user');
            vincitore = winner.user
        }

        
        return res.json({success:true, vincitore: vincitore , domande: domande , persone: persone});

    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function gameStarted(req, res){
    try{
        let pack = await gameModel.find();
        if(!pack?.length === 0) return res.json({success:false, msg:'pack non trovato'});
        let allSession = []

        for(let y = 0 ; y < pack.length ; y++){
            let pice = pack[y].game.filter(x => (x.p1.id === req.body.idPlayer || x.p2.id === req.body.idPlayer));
            let noScaduti = pice.filter(x => Number(x.ti) > Date.now())
            
            allSession.push({idPack: pack[y]._id.toString(), namePack: pack[y].t ,game:[...noScaduti]})


            //ellimina le sessioni scadute
            pack[y].game.map((x, index) => {
                if(Number(x.ti) < Date.now()){
                    console.log('del')
                    pack[y].game.splice(index, 1)
                }
            })
            await pack[y].save()
        }
        
        
        return res.json({success: true, allPack: allSession})

    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

async function userGameInfo(req, res){
    try{
        let user = await userModel.findById({_id: req.body.userId}).select('game')
        if(!user) return res.json({success: false , msg:'user non trovato'});

        let game = [];
        for(let x = 0 ; x < user.game.length ; x++){

            let name = await gameModel.findById({_id: user.game[x].pack}).select('t');
            game.push({
                namePack: name?.t  || 'nome non disponibile', 
                idPack: user.game[x].pack , 
                n:user.game[x].n,
                win: user.game[x].win,
                cat: user.game[x].cat
            })
        }

        return res.json({success: true , gameInfo: game})

    }catch(e){console.log(e) ; res.json({success: 'error'})}
}

//memorizzazione di un file
async function fileSave(file , creator , title , card , first){
    
    //creator nome creatore   //title   id del deck    //file    nome del file  //card = titolo card
    //first indica se è la prima carta cosi da poter cancellare le vecchie

    let pathName = path.join(__dirname, `../public/upload/deck/${creator}/`);
    let pathDeck = path.join(pathName , title);
    let pathCard = path.join(pathDeck , card.replaceAll(' ', '-'));
    let pathComplite = path.join(pathCard , file[0].replaceAll(' ','-'));

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
        //directory id > id_deck
        try{ await fs.mkdir(pathDeck);}
        catch(err){
            if(err.code !== 'EEXIST'){ 
                console.log(`errore nel trovare la directori < ${pathDeck} >`);
                return false
            };
        }
        //directory id > nome_card
        try{ await fs.mkdir(pathCard);}
        catch(err){
            if(err.code !== 'EEXIST'){ 
                console.log(`errore nel trovare la directori < ${pathCard} >`);
                return false
            };
        }

        //cancellare i possibili file pre-esistenti
        if(first){
            let AllFile = await fs.readdir(pathCard)
            for(file of AllFile){
                try{
                    let pathForFile = path.join(pathCard , file)
                    await fs.rm(pathForFile);
                }catch(e){console.log(`il file ${file} non è stato concellato`) ; return false}
            }
        }
        
        //inserire il nuovo file
        const base64Data = file[1].split('base64,')[1];
        await fs.writeFile(pathComplite, base64Data ,{encoding: 'base64'});
        return pathComplite;
    }catch(e){console.log('problema nel caricare il file sul server') ; console.log(e);return false}
    


}




module.exports= {
    getAll,
    getAllClient,

    savePack,
    deletePack,

    findGame,
    controllGame,
    findQuest,
    saveResponse,
    resultGame,
    gameStarted,
    gameClassifica,

    userGameInfo,
}