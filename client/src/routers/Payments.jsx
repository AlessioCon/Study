import React from 'react';


var paymentsClient = new google.payments.api.PaymentsClient({environment: 'TEST'});



export default function Paymants(){

    async function pagamento(e){
        e.preventDefault();
        
        try{

        
            let methodData = [
                {
                    supportedMethods: "https://google.com/pay",
                    //data: {
                    //  supportedNetworks: ["visa", "mastercard"],
                    //  supportedTypes: ["debit", "credit"]
                    //}
                  }
            ];

            //Si tratta di un oggetto JavaScript che contiene informazioni relative al pagamento specifico. Ciò include l'importo totale del pagamento, la spedizione, le tasse, ecc.
            let details    =
            {
                id: 'order-1',
                displayItems: [
                {
                    label: 'Shampoo'/*item.label*/,
                    amount: { currency: "AUD", value: 10/*item.amount*/}
                }
                ],
                total: {
                    label: "Totale",
                    amount: { currency: "AUD", value: 10/*item.amount*/}
                }
            };
    
            //Si tratta di un oggetto JavaScript che permette di controllare il comportamento del browser su cosa catturare dall'utente
            let options ={
                    requestPayerName: false,
                    requestPayerEmail: false,
                    requestPayerPhone: false,
                    requestShipping: false,
                    shippingType: 'shipping'
                  
                };
    
    
            const paymentObject = await new PaymentRequest(paymentsClient, details, options);
            // Show the UI
            const paymentUi = await paymentObject.show();
            //If payment is successful, run here
            await paymentUi.complete("success");

        }catch (e) {
            console.log("e", e);
            return;
        }
    }



    return(
        <button
            onClick={(e)=>{pagamento(e)}}
        
        >paga</button>
    )
}






