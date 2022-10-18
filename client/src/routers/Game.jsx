import { useEffect, useState } from "react";
import {useParams} from 'react-router-dom';
import env from "react-dotenv";
import Cookie from "../customHook/cookie"

export default function Game(){
    let params = useParams();
    let [game, setGame] = useState(null);
    let [html , setHtml] = useState('caricamento');
    let [risp, setRisp] = useState(new Array(9).fill(-1))

    //controlla la veridicità del giocatore
    useEffect(()=>{
        fetch((env?.URL_SERVER || '')+'/api/game/controll_game',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({
                idPlayer: Cookie.getCookie('user')._id,
                idPack:params.idPack,
                idGame: params.idGame,
              
            })
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setGame([dati.game])
            }
        });
    },[])

    //gira ruota primo utente 
    useEffect(()=>{
        if(game === null) return
        html = [];
        if(game[0]?.c === 0){
            
            if(game[0].p1.id ===  Cookie.getCookie('user')._id){
                html.push(turnTheWheel())
                setHtml([...html])
            }else{
                html.push(<p key="error">non dovresti essere qui ! torna alla home</p>)
                setHtml([...html])
            }
        }
        if(game[0]?.c === 1){
            if(game[0].p1.id ===  Cookie.getCookie('user')._id){
                if(game[0].p1.res.length !== 0){
                    html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                    setHtml([...html])
                }else{
                    showQuestions(0,5)
                }
            }else if(game[0].p2.id ===  Cookie.getCookie('user')._id){
                html.push(turnTheWheel());
                setHtml([...html]);
            }
        }

        if(game[0]?.c === 2){
            if(game[0].p1.id ===  Cookie.getCookie('user')._id){
                html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                setHtml([...html])

            }else if(game[0].p2.id ===  Cookie.getCookie('user')._id){
                if(game[0].p2.res.length !== 0){
                    html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                    setHtml([...html])
                }else{
                    showQuestions(0,9)
                }
            }
        }

        if(game[0]?.c === 3){
            if(game[0].p1.id === Cookie.getCookie('user')._id){
                showQuestions(5,9)
            }else{
                html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                setHtml([...html])
            }
        }

        if(game[0]?.c === 4){
            if(game[0].p1.id === Cookie.getCookie('user')._id || game[0].p2.id === Cookie.getCookie('user')._id){
                correction();
            }
        }
    }, [game])
    
    function turnTheWheel(){
        return(
            <div className="cont_ruota" key="ruota">
                <div className="ruota">
                    <div className="pack"></div>
                    <div className="pack"></div>
                    <div className="pack"></div>
                    <div className="pack"></div>
                </div>
                <div className="freccia"></div>
                <button onClick={(e) => {
                    e.preventDefault();
                    let btn = e.target;
                    if(btn.innerText !== 'start') return;
                    let freccia = document.getElementsByClassName('freccia')[0]
                    btn.innerText = 'aspetta';
                    freccia.classList.add('start')
                    let time = setTimeout(() => {
                        let position =1 + Math.floor(Math.random()*4)
                        freccia.classList.remove('start')
                        freccia.classList.add('stop', 'stop'+position)
                        clearTimeout(time)
                    }, 1000)

                    let fine = setTimeout(() => {
                        game[0].c += 1
                        setGame([...game])
                        clearTimeout(fine)
                    }, 2500)
                }}>start</button>
            </div>
        )
    }

    async function showQuestions(start , part){
        //part indica quante domande mostrare, dato che il primo utente vede solo 5 domande (nella prima fase 5)
        //                                              il secondo utente vede subito le nove domande (fase 9)
        //                                              il primo utente ritorna e vede anche lui le nove domande (fase 9)
        let questDisplay = [];
        let resp = await fetch((env?.URL_SERVER || '')+'/api/game/find_quest',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({
                idPack:params.idPack,
                questList: game[0].quest,
            }) 
        })
        let dati = await resp.json();
        if(dati.success){ 
            let questions = dati.questions 
            for(let x = start ; x < part ; x++){
                let ris = []
                questions[x].answere.map((y, index) => {
                    ris.push(
                        <li key={"q"+x+"-a"+index}>
                            <label id={"q"+x+"-a"+index}>{y.t}</label>
                            <input type="radio" name={"q"+x} id={"q"+x+"-a"+index}
                            onChange={e => {
                                risp[x] = index
                                setRisp([...risp])
                            }}/>
                        </li>
                    )
                })

                questDisplay.push(
                    <li key={"q"+x}>
                        <p>{questions[x].q}</p>
                        <ul>
                            {ris}
                        </ul>
                    </li>
                )                
            }
            questDisplay.push(<button key="btn-quest" onClick={()=>{sendQuestion()}}>invia</button>)
        }else{
            questDisplay.push(<p key="error">errore , ricarica la pagina</p>)
        }

        html.push(
            <ul key="quest">
                {questDisplay}
            </ul>
        )
        setHtml([...html]);        
    }

    async function sendQuestion(){
        setHtml(<p>caricamento...</p>);

        let resp = await fetch((env?.URL_SERVER || '')+'/api/game/save_response',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({
                idPack:params.idPack,
                idGame: params.idGame,
                idPlayer: Cookie.getCookie('user')._id,
                risp: risp,
                status: game[0].c
            }) 
        })
        let dati = await resp.json();
        if(dati.success){
            if(dati.status !== 4){
                html = [];
                html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                setHtml([...html])

            }else{correction()}
        }

    }

    async function correction(){
        let resp = await fetch((env?.URL_SERVER || '')+'/api/game/result_game',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body:JSON.stringify({
                idPack:params.idPack,
                idGame: params.idGame,
            }) 
        })
        let dati = await resp.json();
        if(dati.success){
            if(dati.status !== 4){
                html = [];
                html.push(<p key="wait">turno del tuo avversario , ritorna più tardi</p>)
                setHtml([...html])

            }else{correction()}
        }

        let domDisplay = [];
        dati.domande.map((dom, domIndex ) => {
            let risposte = []
            dom.answere.map((risp, rispIndex) => {
                
                risposte.push(
                    <tr key={"dom"+domIndex+"-ris"+rispIndex}>
                        <td>{risp.t}</td>
                        <td>{(game[0].p1.res[domIndex] === rispIndex) ? '✔️' :'⚪'}</td>
                        <td>{(game[0].p2.res[domIndex] === rispIndex) ? '✔️' :'⚪'}</td>
                        <td>{risp.c === true ? '✔️': '⚪'}</td>
                       
                    </tr>
                )
            })
            domDisplay.push(
                <div key={"dom-"+domIndex}>
                    <table>
                        <thead>
                            <tr>
                                <th>{dom.q}</th>
                                <th>{dati.persone[0]}</th>
                                <th>{dati.persone[1]}</th>
                                <th>{'corretta'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risposte}
                        </tbody>
                    </table>
                    <p>{dom.c}</p>
                </div>
                
            )
        })
        html = [];
        html.push(
            <div key="correction">
                {(dati.vincitore === 'pareggio') 
                ? <p>Pareggio</p>
                : <p>Vincitore: {dati.vincitore}</p>} 
                {domDisplay}
            </div>)
        setHtml([...html])
    }

    return (
    <div>
        {html}
    </div>)
}


/*

 <td>{(game[0].p2.res[domIndex] === rispIndex) ? '✔️'​ :'⚪'} ​</td>
<td>{risp.c === true ? '✔️'​ : '⚪'}</td>

*/