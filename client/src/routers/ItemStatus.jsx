import { loadStripe } from "@stripe/stripe-js";
import {useEffect , useState} from "react";
import env from "react-dotenv";
import Cookie from "../customHook/cookie";


function Status(){
  let [stripe , setStripe] = useState(null);
  let [message, setMessage] = useState('Caricamento...');

  const idDeck = new URLSearchParams(window.location.search).get('idItems');
  const clientSecret = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret'
  );
  const pi = new URLSearchParams(window.location.search).get(
    'payment_intent'
  );
 
  useEffect(()=>{
        if(stripe) return
        let stripePromis = async () => {
          let response = await loadStripe('pk_test_51LLMdvHq8ifjUZsHgfMxSN7pZRlpa8xzi5nYAb3Fs71wSbevteSERApmF9gAvLAH9o3fYxwFlyqLxwXaiReX6II100yaJyL8fK');
          setStripe(response)
        }
        stripePromis()
  }, [stripe])

  if(stripe) {
    // Retrieve the "payment_intent_client_secret" query parameter appended to
    // your return_url by Stripe.js
    
    

    // Retrieve the PaymentIntent
    stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
      //const message = document.querySelector('#message')
    
      // Inspect the PaymentIntent `status` to indicate the status of the payment
      // to your customer.
      //
      // Some payment methods will [immediately succeed or fail][0] upon
      // confirmation, while others will first enter a `processing` state.
      //
      // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Pagamento avvenuto con successo!');
          savingPayment()    
          break;
        case 'processing':
          setMessage('Stiamo processando il tuo pagamento');         
          break;
    
        case 'requires_payment_method':
          setMessage('Richiesta di pagamento fallita , riprova');          
          break;
    
        default:
          setMessage('Qualcosa è andato storto , riprova');
          break;
      }
    });
  
  }

    async function savingPayment(){
      await fetch((env?.URL_SERVER || '' ) + '/api/user/payDeck' , {
        method: 'POST',
        body: JSON.stringify({idDeck: idDeck, idUser: Cookie.getCookie('user')._id}),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Access-Control-Allow-Credentials": true,
        },

      });
    }



  return(
    <p id="message">{message}</p>
  )




  }



export default Status