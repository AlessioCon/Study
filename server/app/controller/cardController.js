const cardModel = require('../model/cardsModel');
let Validator = require('../../private_modules/validator');
const fs = require('fs/promises');
const { Buffer } = require('buffer')
const path = require('path');

const stripeController = require('../controller/stripeController');


async function getDeckUser(req,res){

    try{
        let decksUser = await cardModel.find({$or: [{c: req.body.userId}, {'stripe.buyers':req.body.userId}]});
        return res.json({success:true, decks:decksUser || []});

    }catch(e){console.error(e); return res.json({success:'error'})}
}

async function getDeckSeller(req,res){

    try{
        let deckShop = await cardModel
                                .find({c: {$nin: [req.body.userId]} , s:true , 'stripe.buyers': {$nin: [req.body.userId]}})
                                .limit(req.body.from + 10)
                                .skip(req.body.from);
        let deckShopF = []//formattazione dei dati
        
        deckShop.map((deck)=> {
            deckShopF.push({
                t: deck.t,
                price:deck.stripe.sale.p,
                outlet:deck.stripe.sale.o ,
                _id: deck._id,
                nCard: deck.cards.length,
                cards: deck.cards.slice(0,2),
                idStripe: deck.stripe.id
            })
        })
        return res.json({success:true, decks: deckShopF || []});

    }catch(e){console.error(e); return res.json({success:'error'})}
}

async function getDeckForMaster(req, res){
    try{
        let deck = await cardModel.find({c: req.body.id , 'stripe.id': {$nin:[undefined]}});
        if(!Boolean(deck.length)) return res.json({success:false, msg: 'nessun deck creato'});
        
        let alldeck = []
        for(let x = 0 ; x < deck.length; x++){
            alldeck.push({
                t: deck[x].t,
                block: deck[x].block,
                s: deck[x].s,
                nBuy: deck[x].stripe?.buyers?.length || 0,
                price: deck[x]?.stripe?.sale?.p || 0.5,
                outlet: deck[x]?.stripe?.sale?.o || 0,
                _id: deck[x]._id
            });
        }

        return res.json({success:true, deck: alldeck})


    }catch(e){console.log(e) ;return res.json({success:'error', msg: 'errore server'})}
}

async function saveDeck(req,res){
    try{
      
        let deckDb = false;
        let deck = req.body.deck;
        let msg , id, stripeId; //id è per i nuovi deck , viene salvato l'id e portato al client idem stirpeId

        if(req.body.deck?._id){
            deckDb = await cardModel.findById({_id:req.body.deck?._id});
            if(!deckDb) return res.json({success: false, msg: 'deck non trovato'})
        }
            
        let validator = new Validator();
    
        deck.t = deck.t ?? '';
        let input = {
            title: deck.t,
            stato: deck.s
        }
        let option = {
            title : "type:string|length:<:64",
            stato : "type:boolean",
        }
        //primo controllo dei dati
        let Var = validator.controll(input, option);
        if(Var.err) return res.json({success:false , data:Var.msg});

        //controllo per ogni carta del deck
        deck.cards.map((x, index)=> {
            if(! /^#+([a-zA-Z0-9]{6,6})$/.test(x.cc)) deck.cards[index].cc = '#ffffff';
            let validator = new Validator();

            let input = {
                title: x.t,
                body: x.b,
                retro: x.bb
            }

            let option = {
                title         : "type:string|length:<:65",
                body          : "type:string|length:<:1000",
                retro         : "type:string|length:<:1000"
            }

            let Var = validator.controll(input, option);
            if(Var.err) return res.json({success:false , msg:Var.msg});
        })


        if(deck.stripe && deck.s){
            let response = await cardModel.find({_id: {$nin:[deck._id]} , t: deck.t}).select('t');
            if(Boolean(response.length))  return res.json({success: false, msg: 'titolo deck già in uso'})
        }


        //controllo blocco
        if(deck.block) deck.s = false;
       
        //se è già stato creato
        if(deckDb){
            deckDb.t = deck.t ;
            deckDb.s = deck.s;
            deckDb.cards =  deck.cards;
            
            await deckDb.save();
            msg = 'operazione compiuta';
        }else{
            const deckData = new cardModel({
                c:req.body.userId,
                t: deck.t,
                s: deck.s,
                cards: deck.cards
            })
           
            deckDb = await deckData.save(); 
            id = deckDb._id.toString();
            msg =  'operazione compiuta'
        }


        //se il corso si dovra vendere o è già in vendita
        if(req.body.sell || deckDb.stripe.id){
            info = {
                title: deck.t,
                price: Number(deck.stripe.sale.p) || 1,
                outlet: Number(deck.stripe.sale.o) || 0,
                status: deck.s,
                idStripe: deckDb?.stripe?.id
            }
            let stripe = await  stripeController.sellDeck(info);
            if(stripe.change){
                //se è stato cambiato il prezzo del prodotto va cambiato anche l'id
                let allStripeDb = {
                    id: stripe.id,
                    sale: {
                        p: deck.stripe.sale.p,
                        o: deck.stripe.sale.o,
                    },
                    buyers: []
                }

                if(!deckDb?.stripe){
                    deckDb.stripe = allStripeDb;
                }else{
                    allStripeDb.buyers = deck.stripe.buyers || [];
                    deckDb.stripe = allStripeDb;
                }
                await deckDb.save();
            }
            if(stripe.id) stripeId = stripe.id;
        }

       
        //sistema di memorizzazione file
        try{
            for(let x = 0 ; x < deck.cards.length ; x++){
                if(deck.cards[x]?.fileFront && deck.cards[x]?.fileFront?.[2] !== false){
                    let responsef = await fileSave(deck.cards[x].fileFront, deck.c , deckDb._id.toString() , deck.cards[x].t, true);
                    if(!responsef) return res.json({success:false , msg:'problema nel caricare il file'});
                    
                    deckDb.cards[x].fimg = responsef;    
                }

                if(deck.cards[x]?.fileBack && deck.cards[x]?.fileBack?.[2] !== false){
                    
                    let responseb = await fileSave(deck.cards[x].fileBack, deck.c , deckDb._id.toString() , deck.cards[x].t , false);
                    if(!responseb) return res.json({success:false , msg:'problema nel caricare il file'});

                    deckDb.cards[x].bimg = responseb;    
                }
                

            }
        }finally{await deckDb.save()}
        

        

        return res.json({success: true, msg:msg , id: id , stripeId:stripeId})

    }catch(e){console.log(e); return res.json({success: 'error' , msg:'errore nel server'})}

}

//aggiungi stripe
async function deleteDeck(req,res){
    try{
        
        //se il corso si dovra cancellare su stirpe
        if(req.body.isOnStripe){
            let stripe = await  stripeController.deleteDeck(req.body.isOnStripe)
            if(!stripe) return res.json({success: false , msg:'problema nella cancellazione prodotto'})
        }

        //sistema di memorizzazione file
        let filePrecedente = await cardModel.findOne({_id: req.body.deckId}).select('_id c ');
        try{
            await fs.rm(path.join(__dirname, `../public/upload/deck/${filePrecedente.c}/`, filePrecedente._id.toString()), { recursive: true })
        }catch(e){
            if(e.code !== 'ENOENT') console.log(e)}
            
        
        let response = await cardModel.findByIdAndDelete({_id: req.body.deckId});
        if(!response) return res.json({success: false , msg:'problema nella cancellazione del deck, prova più tardi'})

        return res.json({success: true, msg:'deck cancellato'})

    }catch(e){console.log(e); return res.json({success: 'error' , msg:'errore nel server'})}
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
    getDeckUser,
    getDeckSeller,
    getDeckForMaster,

    saveDeck,
    deleteDeck,    
}