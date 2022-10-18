import {useEffect, useState} from 'react';
import env from "react-dotenv";
import Cookie from "../customHook/cookie";

export default function UserGameInfo(){

    let [infoUser, setInfoUser] = useState(null);
    let [infoUserDisplay, setInfoUserDisplay] = useState(null);

    let [started , setStarted] = useState(null); //partite gia startate
    let [startedDisplay, setStartedDisplay] = useState(null)


    //statistiche
    useEffect(()=>{
        fetch((env?.URL_SERVER || '' ) +  '/api/game/user_game_info' , {
            method : 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({ userId: Cookie.getCookie('user')._id })
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setInfoUser(dati.gameInfo)                
            }
        })
    },[])

    //started (sessioni già avviate)
    useEffect(()=>{
        if(!Cookie.getCookie('user')) return
        fetch((env?.URL_SERVER || '')+'/api/game/game_started',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({ idPlayer: Cookie.getCookie('user')._id })
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setStarted(dati.allPack)
            }
        });
        
    },[])

    //statistiche display
    useEffect(() => {
        if(infoUser === null) return;
        if(infoUser.length === 0){
            setInfoUserDisplay(<p key="notting">al momento non ci sono statistiche disponibili</p>)
        }else{
            
            let statPack = []
            infoUser.map((pack , packIndex)=> {
               
                let statCat = []
                pack.cat.map((cat, catIndex) => {

                    statCat.push(
                        <div key={"packDisp"+packIndex+"cat"+catIndex}>
                            <p>{cat.name}</p>
                            <p>domande fatte: {cat.n}</p>
                            <p>domande corrette: {cat.c}</p>
                            <p>domande sbagliate: {cat.n - cat.c}</p>
                            <p>percentuale:{(cat.c * 100 / cat.n).toFixed(2)} % </p>
                        </div>
                    )
                })



                statPack.push(
                    <div key={"packDisp"+packIndex}>
                        <p>{pack.namePack}</p>
                        <p>numero partite: {pack.n}</p>
                        <p>numero partite vinte: {pack.win}</p>
                        <p>numero partite perse: {pack.n - pack.win}</p>
                        <p>percentuale : {(pack.win * 100 / pack.n).toFixed(2)} %</p>
                        <div>
                            <p>per categoria</p>
                            {statCat}
                        </div>
                    </div>
                )
            })

           
            setInfoUserDisplay(
                <div key="statistiche">
                    {statPack}
                </div>
                
            )
        }
        
    }, [infoUser])

        //formato html delle sessioni già avviate
        useEffect(()=> {
            if(started === null) return ;
            
            let startedDisplay = [];
            started.map((pack , packIndex) => {
               
    
                let liElement = [];
                if(pack.game.length === 0){
                    liElement.push(<li key={"nessuna"+packIndex}>non ci sono partite registrate</li>)
                }
                pack.game.map((sess, sessIndex) => {
                        let date = new Date(Number(sess.ti));
                     
                        let scad = date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();
                        liElement.push(<li key={"status"+packIndex+"-"+sessIndex}>
                            <p>{(sess.c === 4) 
                                ? "partita finita" 
                                : "partita in corso"}
                            </p>
                            <p>scadenza: {scad}</p>
                            <button onClick={(e) => {
                                return window.location.href = '/game/'+pack.idPack+'/'+sess._id
                            }}>vai</button>
                        </li>)
                    
                })
                
    
                startedDisplay.push(
                <div key={"cont"+packIndex}>
                    <p>{pack.namePack}</p>
                    <ul>
                        {liElement}
                    </ul>
                    
                </div>)
            })
            setStartedDisplay([...startedDisplay])
           
        }, [started])

    return (
        <div>
            <p>sezione gioco</p>
            <div>
                <p>registro partite</p>
                {startedDisplay}
            </div>
            <div>
                <p>statistiche</p>
                {infoUserDisplay}
            </div>
        </div>
    )
}