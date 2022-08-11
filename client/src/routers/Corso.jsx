import { useEffect, useState } from 'react';
import {useParams} from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import env from "react-dotenv";



import Cookie from '../customHook/cookie';
const stripePromise  = loadStripe('pk_test_51LLMdvHq8ifjUZsHgfMxSN7pZRlpa8xzi5nYAb3Fs71wSbevteSERApmF9gAvLAH9o3fYxwFlyqLxwXaiReX6II100yaJyL8fK');

function CheckoutForm(prop){
    const stripe = useStripe();
    const elements = useElements();
    const corsoId = prop.corsoId


    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {if (!stripe) {return;}})

    const clientSecret = prop.clientSecret;
    if (!clientSecret) return;
if(stripe){
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("pagamento avvenuto con successo");
            break;
          case "processing":
            setMessage("stiamo processando il pagamento");
            break;
          case "requires_payment_method":
            setMessage("il pagamento non è andato a buon fine , per favore riprova.");
            break;
          default:
            setMessage("qualcosa è andato storto.");
            break;
        }
    }, [stripe]);
}
    


    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!stripe || !elements) {
          // Stripe.js has not yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return;
        }
    
        setIsLoading(true);
    
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            // Make sure to change this to your payment completion page
            return_url: "http://localhost:3000/stripe/status/?&idCourse="+corsoId+"&idUser="+Cookie.getCookie('user')._id+'&subId='+prop.subId,
          },
        });
    
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message);
        } else {
          setMessage("errore inaspettato.");
        }
    
        setIsLoading(false);
      };

      return (
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" />
          <button disabled={isLoading || !stripe || !elements} id="submit">
            <span id="button-text">
              {isLoading ? <div className="spinner" id="spinner"></div> : "paga"}
            </span>
          </button>
          {/* Show any error or success messages */}
          {message && <div id="payment-message">{message}</div>}
        </form>
      );
      

}


function PayStripe(prop){
    let clientSecret = prop.clientSecret

    const options = { 
        clientSecret: clientSecret,      
        // Fully customizable with appearance API.      
        appearance: {theme: 'stripe'},
    };


//4242 4242 4242 4242
    return (
        <div className="App">
        {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
                <CheckoutForm clientSecret={clientSecret} corsoId={prop.corsoId} subId={prop.subId}/>
            </Elements>
        )}
        </div>
    );
}












export default function Corso(){
    const [corso , setCorso] = useState(0);    
    const [button , setButton] = useState(null)
    const [clientSecret ,setClientSecret] = useState(null);
    const [subScriptionId , setSubScriptionId] = useState(null);

    let param = useParams();
    
    useEffect(()=>{
        let getCourse = async () =>{
            if(corso) return ;
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + `/api/corsi/${param.name}`, {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(!data.success || data.data.s === 'true') return;
                return setCorso(data.data);
    
            }catch(e){console.log(e);}
        }
        let getButtonBuy = async () =>{
            if(corso){
                if(!Cookie.getCookie('user')) return setButton('login');

                let response =  await fetch((env?.URL_SERVER || '' ) + '/api/user/haveCourse/'+Cookie.getCookie('user')._id + '/'+corso._id ,{
                 method: 'GET',
                 headers: {
                     Accept: "application/json",
                     "Content-Type": "application/json",
                     "Access-Control-Allow-Credentials": true,
                     },
                 })
                let date = await response.json()
                if(date.haveCourse) return setButton('vedi')
                return setButton('compra')
            }
        }

        getCourse();
        getButtonBuy();
    })


    async function buyCurse(id){
        try{
            let response = await fetch((env?.URL_SERVER || '' ) + '/api/stripe/create-subscription', {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({idStripe: id , idUser: Cookie.getCookie('user')._id})
            })
    
            let data = await response.json();

            if(!data.success) return false;
            setClientSecret(data.data.clientSecret);
            setSubScriptionId(data.data.subscriptionId);
            //return {clientSecret: data.data.clientSecret , subscriptionId : data.data.subscriptionId}
    
    
        }catch(e){if(e) console.log(e)}
    }

   
    //sistema pulsante
    let buttonDisplay;
    switch(button){
        case 'login' :
            buttonDisplay = (<a href="/login"> registarti</a>)
            break
        case 'compra':
            buttonDisplay = (
                <button onClick={async (e) => {
                    e.preventDefault() ;
                    await buyCurse(corso.idStripe);
                    //if(data) window.open("/subscribe?clientSecret="+data.clientSecret+'&&idCourse='+corso._id+'&&subId='+data.subscriptionId, "_self");
                }}>
                    compra corso
                </button>)
            break
        case 'vedi':
            buttonDisplay = (
                <a href={`../user/corso/${Cookie.getCookie('user')._id}/${corso._id}`}>vedi corso</a>
            )
            break
        default: break
    }
    //-----------------

    //sistema prezzo
    let priceDisplay;
    if(corso){
        switch(corso?.sale.e){
            case true:
                //pagamento a rate
                let tot =  (corso.sale?.p / 3).toFixed(2) ;
                if(corso.sale?.o) tot = (corso.sale?.o / 3).toFixed(2);
                priceDisplay = (
                    <div>
                        <p>pagamento a rate</p>
                        <p>prezzo = {corso.sale.p} €</p>
                        {(corso.sale.o) ? <p>scontato adesso a = {corso.sale.o} €</p> : null}
                        <p>3 rate da {tot} €</p>
                    </div>)
                break
            case false:
                priceDisplay = (
                    <div>
                        <p>prezzo = {corso.sale.p} €</p>
                        {(corso.sale.o) ? <p>scontato adesso a = {corso.sale.o} €</p> : null}
                    </div>)
                break
            default: break
        }
    }
    //-----------------


    function displayCourse(){

        return(
            <div>
                <h1>{corso.t}</h1>
                <p>{corso.d}</p>

                {priceDisplay}

                <div>
                    <h3>cosa contiene il corso</h3>
                    <ul>
                    {corso.chapter.map((capitolo) =>{
                        return (<li key={capitolo.t}>
                           {capitolo.t}
                            <ul>
                                {capitolo.lesson.map((lesson) =>{
                                    return <li key={lesson[1]}>{lesson[0]}</li>
                                })}
                            </ul>
                        </li>)
                    })}
                    </ul>
                    
                </div>
                {buttonDisplay}
                <div>
                    {<PayStripe clientSecret={clientSecret} corsoId={corso._id} subId={subScriptionId}/>}
                </div>
            </div>
        )
    }

    return (
        <main>
        {(corso) ? displayCourse() : <h1> caricamento...</h1>  }
        
        </main>  
    )
    
    
}

