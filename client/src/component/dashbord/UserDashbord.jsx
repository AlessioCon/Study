import env from 'react-dotenv';
import Cookie from '../../customHook/cookie';
import {useEffect, useState} from 'react';



export default function UserDashbord(){
    let [user , setUser] = useState(null);
    let [codPromo, setCodPromo] = useState('');
    
    useEffect(() => {
        fetch((env?.URL_SERVER || '') + '/api/user/getuser' , {
            method:'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({id: Cookie.getCookie('user')._id })
        })
        .then(datajson => datajson.json())
        .then(dati => {
            if(dati.success){
                setUser(dati.user)
                if(dati.user.promoYou) setCodPromo(dati.user.promoYou)
            }
        })
    },[])

    async function savePromo(){
        console.log('ok')
        if(user?.promoYou) return alert('hai gia inserito un codice amico');
        if(user?.promoMy === codPromo) return alert('non puoi usare il tuo codice');

        let resp = await fetch((env?.URL_SERVER || '') + '/api/user/save_promo' , {
            method:'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                id: Cookie.getCookie('user')._id,
                promo: codPromo
            })
        })
        let dati = await resp.json();
        if(dati.success){
            alert('codice amico inserito');
            //window.location.reload();
        }else{alert(dati.msg)}

    }


    return(
        <div>
            <h1>sei nella sezione utente</h1>
            <div>
                <div>
                    <p>dai il tuo codice agli amici , e quando acquisteranno un corso , riceverai dei punti</p>
                    <p>{user?.promoMy ? user.promoMy : 'caricando...'}</p>
                </div>
                <div>
                    <p>{user?.promoYou ? 'codice amico già inserito' : 'inserisci un codice amico'}</p>
                    {(user?.promoYou) 
                    ? <p>{user?.promoYou}</p>
                    :   <div onSubmit={(e) => {e.preventDefault() ; savePromo()}}>
                            <form>
                                <div>
                                    <label htmlFor='promoYou'>codice: </label>
                                    <input type='text' value={codPromo} onChange={(e) => setCodPromo(e.target.value)} required />
                                </div>
                                <button>invia</button>
                            </form>
                             
                        </div>
                    }
                </div>
            </div>
            <p>diamanti ottenuti: {user?.dim || 0}</p>

        </div>
    )
}