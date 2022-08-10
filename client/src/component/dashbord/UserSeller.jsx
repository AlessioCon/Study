import { useState, useEffect } from "react";
import Cookie from "../../customHook/cookie";

import env from "react-dotenv";


export default function UserSeller(){
    const [seller, setSeller] = useState(null);

    useEffect(()=> {

        let queryString = new URLSearchParams(window.location.href);

        if(queryString.get('stripe_access') === 'fail'){
            alert('link accesso a stripe scaduto, ricarica la pagina')
            return  window.location.href = '/dashbord/venditore'
           
        }

        try {
            let getSeller = async ()=>{
                let response = await fetch((env.URL_SERVER || '') + '/user/getseller' , {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({id: Cookie.getCookie('user')._id})
                })
                let data = await response.json()
                if(data){ 
                    //nel caso in cui l'utente si sia registrato correttamente 
                    //non si può modificare il cookie user quindi , crea un cookie nuovo solo per seller
                    let grade = Cookie.getCookie('user').grade;
                    let filterGrade = grade.find(e => e === 'sellerPending')

                    if(data.seller?.metadata?.isSeller && filterGrade && !Cookie.apply.getCookie('nawSeller') ){
                        Cookie.setCookie('nawSeller' , {seller: true} , 1)
                    }
                    return setSeller(data.seller)
                }
                window.location.href = '/';
            }
            if(!seller) getSeller();
            
        } catch(e) {if(e) console.log(e)}

    }, [seller]);

    async function registratiStripe(e){
        e.preventDefault()
        try{
            let response = await fetch((env.URL_SERVER || '') + '/user/seller/strip_update_info', {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({ idSeller: seller.id,})
            })
            let data = await response.json();
            if(data.success){
                window.open(data.url, '_blank');

            }else{
                 alert('qualcosa è andato storto , ricarica la pagina');
                 window.location.reload()
            }

        }catch(e){console.log(e)}
    }


    async function accediStripe(e){
        e.preventDefault();
        try{
            let response = await fetch((env.URL_SERVER || '') + '/user/seller/stripe_login', {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({ idSeller: seller.id,})
            })
            let data = await response.json();
            if(data.success){
                window.open(data.url, '_blank');

            }else{
                 alert('qualcosa è andato storto , ricarica la pagina');
                 window.location.reload()
            }

        }catch(e){console.log(e)}

    }

    //account non ha ancora accettato i termini e condizioni stripe
    if(seller){
        if(seller.charges_enabled){
            return(
                <div>
                    <p>modalità venditore attiva</p>
                    <button onClick={e => accediStripe(e)}>accedi al tuo account stripe</button>
                </div>
            )
        }else{
            return(
                <div>
                    <p>modalità venditore non attiva</p> 
                    <button onClick={(e) => registratiStripe(e)}>registarti su stripe</button>
                </div>
                )
        }  
    }

    return(<p>caricamento...</p>)


    

   


    
}



//individual.verification
//external_accountù



//external_account
//id
//payouts_enabled

//caricare documento di identità ecc...