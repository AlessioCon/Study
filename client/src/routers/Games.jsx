import { useEffect, useState, useRef } from "react"
import env from "react-dotenv";
import Cookie from "../customHook/cookie"


export default function Games(){
    const [packs, setPacks] = useState(null);
    let [packDisplay ,setPackDisplay] = useState(null);
    let [started , setStarted] = useState(null); //partite gia startate
    let [startedDisplay, setStartedDisplay] = useState(null)
    let [classifica , setClassifica] = useState(null); //partite gia startate
    let [classificaDisplay, setClassificaDisplay] = useState(null)

    //find Pack
    useEffect(()=> {
        fetch((env?.URL_SERVER || '')+'/api/game/getAllClient',{
            method : 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setPacks(dati?.pack || [])  
            }
        });
        
    },[]);

    //find classifica
    useEffect(()=>{
        if(!Cookie.getCookie('user')) return
        fetch((env?.URL_SERVER || '')+'/api/game/game_classifica',{
            method : 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setClassifica(dati.leader)
            }
        });
        
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
        
    },[packs])



    

    //format in html
    useEffect(()=>{
        if(packs === null) {
            setPackDisplay(<p key={'gameCat-err'}>ricarica la pagina</p>)
            return;
        }else if(packs?.length === 0){
            setPackDisplay(<p key={'gameCat-err'}>al momento non ci sono modalità disponibili</p>)
            return;
        }else{
            packDisplay = []
            packs.map((cat,catIndex) => { packDisplay.push(
                <li key={'gameCat'+catIndex}>
                    <button onClick={e => {
                        e.preventDefault();
                        startGame(cat._id);
                    }}>
                    {cat.t}</button>
                </li>
                )    
            })
            setPackDisplay([...packDisplay])
        };
        
    },[packs])


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

    useEffect(()=> {
        if(classifica === null) return ;
        if(classifica.length === 0) return setClassificaDisplay(<p>la classifica non è al momento disponibile</p>);

        let classificaDisplay = [];
        classifica.map((pack , packIndex) => {
           
        let users = []
        pack[1].map((user, userIndex) => {
            users.push(
            <tr key={'table-'+packIndex+'user-'+userIndex}>
                <td>{user[0]}</td>
                <td>{userIndex+1}</td>
                <td>{user[1]}</td>
            </tr>)
        })
        
        classificaDisplay.push(
            <div key={'table-'+packIndex}>
                <p>classifica di {pack.t}</p>
                <table >
                    <thead>
                        <tr>
                            <th>nome utente</th>
                            <th>posizione</th>
                            <th>vincite</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users}
                    </tbody>
                </table>
            </div>
            
        )
           
            
        })
        setClassificaDisplay([...classificaDisplay])
       
    }, [classifica])




    function startGame(packId){
        
        if(! Cookie.getCookie('user')){ 
            alert('accedi per giocare');
            return window.location.href = '/login';}
        let confirm = prompt('sicuro di voler giocare. (digita si)');
        if(confirm !== 'si') return;
        fetch((env?.URL_SERVER || '')+'/api/game/find_game',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({
                idPlayer: Cookie.getCookie('user')._id,
                idPack: packId
            })
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                return window.location.href = '/game/'+packId+'/'+dati.idSession
            }else(
                alert(dati.msg)
            )
        });

    }


    return(
        <div>
            <h1>benvenuto nella modalita gioco</h1>
            <div>
                <p>modalità</p>
            </div>
            <div>
                <p>scegli una categoria e inizia una partita.</p>
                <ul>
                    {packDisplay}
                </ul>
                <p>tu e il tuo avversario riceverete nove domande casuali, chi risponde correttamente a più domande vince.</p>
            </div>
            <div>
                <p>partite in sospeso</p>
                {startedDisplay}
            </div>
            <div>
                <p>classifica</p>
                {classificaDisplay}
            </div>
        </div>
        
    )
}