import { useEffect, useState } from "react";
import Cookie from '../../customHook/cookie';
import Section from '../../component/Section';


import env from "react-dotenv";

export default function Messages (){
    const [msg, setMsg] = useState(null);
    const [posto , setPostoSezioni] = useState(1);

    useEffect(()=>{
        async function getAllMsg(){
            let response = await fetch((env?.URL_SERVER || '') + '/api/user/get_user_msg' , {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({id: Cookie.getCookie('user')._id})
            })
            let dati = await response.json();
            if(dati.msg.length === 0 ) return setMsg(false);
            setMsg(dati?.msg)
            
        }
        if(msg === null) getAllMsg()
       
    })

    async function deleteMsg(index , all){
        let response = await fetch((env?.URL_SERVER || '') + '/api/user/delete_user_msg' , {
            method: 'DELETE',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                id: Cookie.getCookie('user')._id,
                index: index,
                all: all
            })
        })
        let dati = await response.json();
        if(dati.success){
            if(all){
              
                setMsg(false)
            }else{
                msg.splice(index, 1);
                setMsg([...msg]);
    
                if((posto - 1) * 10 >= msg.length){
                    setPostoSezioni(posto - 1)
                }
            }
           
        }else{alert('qualcosa è andato storto')}
        
    }


    let allMsg = []
    if(msg === null){
        allMsg.push(<p key={'caricamento'}>caricamento</p>)
    }else if(msg === false){
        allMsg.push(<p key={'caricamento'}>non hai messaggi</p>)
    }else{

        let messaggi = []
        msg.map((x, xIndex) => {
            let titolo;
            let testo;
            switch(x.tipe){
                case 'sim_dom_alert':
                    titolo = `segnalazione per la simulazione "${x.msg[0]}"`;
                    testo = `segnalazione nella materia: ${x.msg[1]}, capitolo: ${x.msg[2]}, domanda: ${x.msg[3]}`;
                    break
                case 'for_user_buy_course':
                    titolo = `circolare per il corso: "${x.msg[0]}"`;
                    testo = x.msg[1]
                    break
                case 'for_all_user_by_master':
                    titolo = `Da YouTestPlus`;
                    testo = x.msg[0]
                    break
            }

            messaggi.push(
                <div key={'messaggio'+x.type+xIndex}>
                    <p>{titolo}</p>
                    <p>{testo}</p>
                    <button
                    title='cancella messaggio'
                    onClick={e => {
                        e.preventDefault()
                        deleteMsg(xIndex , false)
                    }}
                    >
                        🗑️​
                    </button>
                </div>
            )


        })
        allMsg.push(
            <Section key={'sezzione'}
                elementi= {messaggi} //lista elementi
                divisione= {10}   //numero di elementi per sezione
                down = {true}
                postoSezioni = {[posto , setPostoSezioni]} 
            />
        )
    }

    return(
        <div>
            <h1>tutti i messaggi</h1>
            <div>
                {allMsg}
                {(msg)
                ?
                <button
                    title='cancella tutti i messaggi'
                    onClick={e => {
                        e.preventDefault()
                        deleteMsg(0 , true)
                    }}
                    >
                        🗑️​
                </button>
                :undefined
                
                }
                
            </div>
        </div>


    )
}




/*
* for_user_buy_course  = per gli utenti che hanno comprato il corso
* sim_dom_alert        = segnalazione domanda di una simulazione
*/