import React, { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import env from "react-dotenv";

import Cookie from "../customHook/cookie"

let apkfake = 'pk_test_51LLMdvHq8ifjUZsHgfMxSN7pZRlpa8xzi5nYAb3Fs71wSbevteSERApmF9gAvLAH9o3fYxwFlyqLxwXaiReX6II100yaJyL8fK'

const stripePromise  = loadStripe(env.APK_STRIPE || apkfake);
const corsoId = new URLSearchParams(window.location.search).get('idCourse');
const subId = new URLSearchParams(window.location.search).get('subId');

function PayStripe(){
    const [clientSecret , setClientSecret] = useState();
    
    useEffect(()=>{

        let client = new URLSearchParams(window.location.search).get('clientSecret');
        if(client) setClientSecret(client);
    })

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
            <CheckoutForm clientSecret={clientSecret}/>
            </Elements>
        )}
        </div>
    );
}


function CheckoutForm(prop){
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {if (!stripe) {return;}})

    const clientSecret = prop.clientSecret;
    if (!clientSecret) return;
if(stripe){
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("Payment succeeded!");
            break;
          case "processing":
            setMessage("Your payment is processing.");
            break;
          case "requires_payment_method":
            setMessage("Your payment was not successful, please try again.");
            break;
          default:
            setMessage("Something went wrong.");
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
            return_url: window.location.origin  + "/stripe/status/?idCourse="+corsoId+"&&idUser="+Cookie.getCookie('user')._id+'&&subId='+subId,
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
          setMessage("An unexpected error occurred.");
        }
    
        setIsLoading(false);
      };

      return (
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" />
          <button disabled={isLoading || !stripe || !elements} id="submit">
            <span id="button-text">
              {isLoading ? <div className="spinner" id="spinner"></div> : "Pay now"}
            </span>
          </button>
          {/* Show any error or success messages */}
          {message && <div id="payment-message">{message}</div>}
        </form>
      );
      

}







export default PayStripe