const stripe = require('stripe')(process.env.Secret_Key);
const userModel = require('../model/userModel');
const curseModel = require('../model/corsiModel');
const cardModel = require('../model/cardsModel');



//Controllo prodotti
async function StripeCreateProduct(item){
    try{

        const product = await stripe.products.create({
            name: item.t,
            description:  item.d,
            active:(item.s == true) ? false : true ,
            metadata: {block: false},
        })

        let amount = (item.sale.o !== 0) ? item.sale.o : item.sale.p
        if(item.sale.e){ amount = (amount / 3).toFixed(2) }

        const price = await stripe.prices.create({
            unit_amount: amount * 100,
            currency: 'eur',
            billing_scheme: "per_unit",
            recurring: {
                interval: "month",
                interval_count: 1, //intervallo di tempo per i pagamenti scandito da interval (parametro sopra) es 1 mese
                usage_type: "licensed"
              },
            product: product.id,
            tax_behavior:'inclusive',
        })

        return {success:true, id: price.id}
    }catch(e){if(e) console.log(e)}    
}

async function StripeUpdateProduct(item){    
    try{
        let amount = (item.sale.o !== 0) ? item.sale.o : item.sale.p;
        if(item.sale.e){ amount = (amount / 3).toFixed(2) }
       

        const priceFined = await stripe.prices.retrieve(
            item.idStripe
        );
       
        const product = await stripe.products.retrieve(
            priceFined.product
        )

        const updateProduct = await stripe.products.update(
            product.id, {
                name: item.title,
                description:item.description,
                active:(item.s == true) ? false : true,
            }
        )
        

        if(priceFined.unit_amount === amount * 100) return {success:true , id: item.idStripe};

        //delite old price
        await stripe.prices.update( item.idStripe ,{active: false});

        //create new price
        const price = await stripe.prices.create({
            unit_amount: amount * 100,
            currency: 'eur',
            billing_scheme: "per_unit",
            recurring: {
                interval: "month",
                interval_count: 1, //intervallo di tempo per i pagamenti scandito da interval (parametro sopra) es 1 mese
                usage_type: "licensed"
              },
            product: updateProduct.id,
            tax_behavior:'inclusive',
        })

        return {success:true , id: price.id};

       
    }catch(e){if(e) console.log(e)}
}

async function StripeDeleteProduct(id){
    try{
        let price = await stripe.prices.update(id , {active: false});
        await stripe.products.update(price.product, {active:false});
    }catch(e){if(e) console.log(e)}
    
}

async function stripeBlockProduct(id){
    try{
        //trova il prodotto

        const price = await stripe.prices.retrieve(id);
        if(!price) return {success: false , msg: 'prezzo non trovato'}

        const productFind = await stripe.products.retrieve(price.product);
        if(!productFind) return {success: false , msg: 'prodotto non trovato'}
        
        
        //sblocca corso
        if(productFind.metadata?.block === 'true'){
            await stripe.products.update(price.product,
                {
                    metadata: {block: false},
                    active: true
                }
            );
        }else{
            await stripe.products.update(price.product,
                {
                    metadata: {block: true},
                    active: false,
                }
            );
        }

        return {success: true}
    }catch(e){console.log(e)}
    
}

//creazione di un deck
async function sellDeck(item){

    try{
        if(!item.idStripe){
            //se l'idstripe è undefined significa che il deck non è stato ancora messo in vendita
            
            const product = await stripe.products.create({
                name: item.title,
                description:  'raccolta di card',
                active: item.status,
                metadata: {block: false},
            })
    
            let amount = (item.outlet !== 0) ? item.outlet : item.price
    
            const price = await stripe.prices.create({
                unit_amount: amount * 100,
                currency: 'eur',
                billing_scheme: "per_unit",
                product: product.id,
                tax_behavior:'inclusive',
            })

           

            return {success:true, id: price.id , change: true , idChange:price.id}
        }else{

            let amount = (item.outlet !== 0) ? item.outlet : item.price;
        
            const priceFined = await stripe.prices.retrieve(
                item.idStripe
            );
            
            const product = await stripe.products.retrieve(
                priceFined.product
            )
    
            const updateProduct = await stripe.products.update(
                product.id, {
                    name: item.title,
                    active: item.status
                }
            )
            
    
            if(priceFined.unit_amount === amount * 100) return {success:true};
    
            //delite old price
            await stripe.prices.update( item.idStripe ,{active: false});
    
            //create new price
            const price = await stripe.prices.create({
                unit_amount: amount * 100,
                currency: 'eur',
                billing_scheme: "per_unit",
                product: updateProduct.id,
                tax_behavior:'inclusive',
            })
    
            return {success:true , id: price.id , change: true};

        }
        
    }catch(e){console.log(e) ; return false}    

}

async function deleteDeck(id){
    try{
       

        let price = await stripe.prices.retrieve(id)
        if(!price) return false;

        const product = await stripe.products.update(price.product ,
                {active: false}
        );
        return true;
          
    }catch(e){console.log(e) ; return false}    

}




async function CreateSubscription(req, res){
    try{
        //retrive items
        const corso = req.body.idStripe;
        const user  = req.body.idUser;
        let usetStripe = await userModel.findById(user);

        let corsoData = await curseModel.findOne({idStripe: corso}).select('sale.e access');
        if(!corsoData) return res.json({success: false, msg:'corso non trovato'});
        let month = 0; 
        let dayMonth = 1;
        if(corsoData?.sale?.e) month = 2;
        
        for(let x = 0 ; x < month ; x++){
            let monthNow = new Date().getMonth() + x;
            switch(monthNow){
                case 0 :
                case 2 :
                case 4 :
                case 6 :
                case 7 :
                case 9 :
                case 11:
                    dayMonth += 31;
                    break
                case 3 :
                case 5 :
                case 8 :
                case 10:
                    dayMonth += 30;
                    break
                case 1 :
                    dayMonth += 28;
                    break
            }  
        }

        //mese di scadenza
        if(dayMonth = 1) dayMonth = 31
        let data = Date.now() + ((60*60*24*dayMonth)*1000);
        let fulldata = new Date(data).getTime();
        let unixTime = Math.round(fulldata / 1000);
        


         //userCreatore corso
         userCourse = await  userModel.findById({_id: corsoData.access.c});
         if(!userCourse) return res.json({success: false, msg:'creatore corso non trovato'});


        const subscription = await stripe.subscriptions.create({
            customer: usetStripe.idStripe,
            items: [{
              price: corso,
            }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            cancel_at: unixTime,

            transfer_data: {
                destination: userCourse.idSS,
                amount_percent: 91.0
            },
          });


        return res.json({
            success: true,
            data:{
                subscriptionId: subscription.id, 
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            }
          });
        

        
    }catch(e){if(e) console.log(e)}   
}

async function BuyDeck(req, res){
    try{
        //retrive items
        const item = req.body.idStripe;
        const user  = req.body.idUser;
        let usetStripe = await userModel.findById({_id: user}).select('-grade -CourseBuy -simu -msg');

        let deck = await cardModel.findOne({'stripe.id': item}).select('c stripe');
        if(!deck) return res.json({success: false, msg:'deck non trovato'});
    

         //userCreatore deck
         let userDeck = await  userModel.findById({_id: deck.c}.select('-grade -CourseBuy -simu -msg'));
         if(!userDeck) return res.json({success: false, msg:'creatore deck non trovato'});

         //trova la quota da pagare
         let amount = (deck.stripe.sale.o || deck.stripe.sale.p);

         //calcolare quanto dare all'utente venditore
        let amount_percent = (amount*91/100).toFixed(2);


        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount*100,
            currency: 'eur',
            customer: usetStripe.idStripe,
            automatic_payment_methods: {enabled: true},
            shipping:{
                address:{
                    city: usetStripe.address.c,
                    country: usetStripe.address.cc,
                    line1: usetStripe.address.s,
                    postal_code: usetStripe.address.cap,
                    state: 'italy'
                },
            name: usetStripe.name.f +' '+ usetStripe.name.l
            },

            transfer_data: {
                destination: userDeck.idSS,
                amount: amount_percent*100
            },
            receipt_email: usetStripe.email,
            metadata: {
                txcUser: usetStripe.txc,
                userStripe: userDeck.idStripe,
            }
        });


        return res.json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
        

        
    }catch(e){if(e) console.log(e)}   
}


async function stripeNewCustomer(data){
    try{

        if(data.country.toLowerCase() === 'italia') data.country = 'IT';

        const customer = await stripe.customers.create({
            email: data.email,
            name:  data.name + ' ' + data.surname ,
            phone: data.cell,
            shipping: {
              address: {
                city: data.city,
                country: data.country,
                line1: data.street,
                postal_code: data.cap,
                state: data.country,
              },
              name: data.name + ' ' + data.surname,
              phone: data.cell,
            },
            address: {
                city: data.city,
                country: data.country,
                line1: data.street,
                postal_code: data.cap,
                state: data.country,
            },
            //metadata: {
            //    codice_fiscale: data.txc
            //}
            invoice_settings: {
                custom_fields :[
                    {
                        name: 'codice fiscale',
                        value: data.txc
                    }
                ]
            }
          });
        
        return {success: true , id: customer.id}

    }catch(e){if(e) console.log(e)}
}

//dare possibilità all utente di creare corsi e venderli
async function stripeNewConnect(data){

let dateAge = data.date.split('/')

    try{
        const account = await stripe.accounts.create({
            type: 'express',
            email: data.email ,
            business_type: 'individual',
            individual: {
                address: {
                    city: data.address.c,
                    country: data.address.cc,
                    line1: data.address.s,
                    postal_code: data.address.cap,
                },
                email: data.email,
                first_name: data.name.f,
                last_name: data.name.l,
                phone: '+39 ' + data.cell.n,
                dob:{
                    day: dateAge[0],
                    month: dateAge[1],
                    year: dateAge[2],
                },
                id_number : data.txc,
            },
            capabilities: {
              card_payments: {requested: true},
              transfers: {requested: true},
            },
            default_currency: 'EUR',
        })
        
        return {success: true, id: account.id};

    }catch(e){if(e) console.log(e)}

    

}


async function getSeller(id){
    try{
        const account = await stripe.accounts.retrieve(id);
        if(!account) return {success: false, msg:'account Stripe non trovato'}


        return {success:true , user : account }
    }catch(e){if(e) console.log(e)}

}


async function updateInfoSeller(req, res){
    try{
        const accountLink = await stripe.accountLinks.create({
            account: req.body.idSeller,
            refresh_url: (process.env.DOMAIN || 'http://localhost:3000' )  +'/dashbord/venditore?&stripe_access=fail', //link per l'autenticazione scaduto
            return_url: (process.env.DOMAIN || 'http://localhost:3000' ) + '/dashbord/venditore',
            type: 'account_onboarding',
          });

          return res.json({success: true, url: accountLink.url})
    }catch(e){console.log(e)}
}

async function stripeLogin(req, res){
    try{

        const link = await stripe.accounts.createLoginLink(req.body.idSeller);
        return res.json({success: true , url:link.url})
       
    }catch(e){console.log(e)}
}

async function amountProduct(req, res){
    try{
        //se è chiamato direttamente o tramite altro controller
        let idStripe = req?.body?.idStripe || req

        //id Corso?
        const price = await stripe.prices.retrieve(
            idStripe
        );

        const invoice = await stripe.invoices.search({
            query: 'metadata["product"]:"' + price.product + '"',
        });

        let totalPrice = 0; 
        invoice?.data?.map(x => {
            totalPrice += Number( x.metadata.amount)
        })

        if(req.body?.idStripe){
            return res.json({success: true , amount: totalPrice})
        }else{
            return {success: true , amount: totalPrice}
        }
        


    }catch(e){console.log(e)}
}

//tramite paiment-intent generalmente per i deck
async function amountProductPI(req, res){
    try{
        //se è chiamato direttamente o tramite altro controller
        let idStripe = req?.body?.idStripe || req

        const paymentIntent = await stripe.paymentIntents.search({
            query: `status:\'succeeded\' AND metadata[\'userStripe\']:\'${idStripe}\'`,
          });
        

        let amountArray = paymentIntent.data.map(x => {return x.amount})
        let amount = 0;
        amountArray.map(x => amount += x);

        amount = (amount / 100).toFixed(2);
        

        if(req.body?.idStripe){
            return res.json({success: true , amount: amount})
        }else{
            return {success: true , amount: amount}
        }
        


    }catch(e){console.log(e)}
}


async function webHook(request, response){
    const endpointSecret = process.env.PrivateHook || "whsec_Si7CHmAjqti3V17OXC0mFkKeoWSaKvJF";
    const sig = request.headers['stripe-signature']
   
    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body , sig, endpointSecret);
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

     // Handle the event
     switch (event.type) {
       case 'account.updated':
         const account = event.data.object;

         if(account.charges_enabled){
           let user = await userModel.findOne({idSS: account.id});
           let index = -1;
           user.grade.find((e , number) => {
               if(e === 'sellerPending') index = number 
           })
   
           if(index !== -1) user.grade.splice(index, 1, 'seller');
           await user.save();

           const accountUpdate = await stripe.accounts.update(
            account.id,
            {metadata: {
                isSeller: true
            }}
          );
           
         }
         break;
       case 'invoice.payment_succeeded':

        //tracciamento prodotto cosi da quantificare quanto il prodotto ha fatto guadagnare
            const invoice = event.data.object;
          
            await stripe.invoices.update(invoice.id,
                {
                metadata: {
                    product: invoice.lines.data[0].price.product,
                    amount:  (invoice.lines.data[0].price.unit_amount / 100)
                }}
            );
            break

       default:
         console.log(`Unhandled event type ${event.type}`);
     }
   
     // Return a 200 response to acknowledge receipt of the event
     return response.status(200).json({st: true});
   };

module.exports = {
    StripeCreateProduct,
    StripeUpdateProduct,
    StripeDeleteProduct,
    stripeBlockProduct,

    sellDeck,
    deleteDeck,


    amountProduct,
    amountProductPI,

    CreateSubscription,
    BuyDeck,
    

    stripeNewCustomer,
    stripeNewConnect,
    getSeller,
    updateInfoSeller,
    stripeLogin,
    webHook,
}