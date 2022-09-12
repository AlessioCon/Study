const cardModel = require('../model/cardsModel');

let Validator = require('../../private_modules/validator');

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
        deck.cards.map(x => {
            let validator = new Validator();

            let input = {
                title: x.t,
                body: x.b
            }

            let option = {
                title         : "type:string|length:<:65",
                body          : "type:string|length:<:1000",
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

        let response = await cardModel.findByIdAndDelete({_id: req.body.deckId});
        if(!response) return res.json({success: false , msg:'problema nella cancellazione del deck, prova più tardi'})

        return res.json({success: true, msg:'deck cancellato'})

    }catch(e){console.log(e); return res.json({success: 'error' , msg:'errore nel server'})}
}








module.exports= {
    getDeckUser,
    getDeckSeller,
    getDeckForMaster,

    saveDeck,
    deleteDeck,

    
}