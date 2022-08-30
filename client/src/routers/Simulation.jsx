import { useEffect, useState } from 'react';
import {useParams} from 'react-router-dom';

import env from "react-dotenv";




export default function Simulation(){
    const [simulation , setSimulation] = useState(undefined);
    const [btnTimer, setBtnTimer] = useState(1)


    let param = useParams();
    param.name = param.name.replace(/%20/, 'g');

    useEffect(()=>{
        async function getSimulation(){
            let respons = await fetch((env?.URL_SERVER || '' )+ '/api/simulation/simulations/'+param.name,{
                method: 'GET',
                header: {
                    accept:'application/json',
                    'Content-type':'application/json',
                    'Access-Control-Allow-Credentials': true
                }
            })
            let data = await  respons.json();
            setSimulation(data.data);
        }
        getSimulation()
    }, [])

    function startSimulation(e){
        window.open('../../user/simulation/'+param.name+'/?time='+btnTimer, '_self')
    }


    let bodySimulation = []
    if(!simulation){
        bodySimulation.push(<p key='simulazione'>caricamento...</p>)
    }else if(simulation.length === 0){
        bodySimulation.push(<p key='simulazione'>simulazione non trovata</p>)
    }else{
        let minuti , ore;

        if(simulation.time.o === 0 || !simulation.time?.o){ore = '00';
        }else if(simulation.time.o < 10){ ore = '0'+simulation.time.o;
        }else{ore = simulation.time.o}
        if(simulation.time.m === 0 || !simulation.time?.m){minuti = '00'; 
        }else if(simulation.time.m < 10){ minuti = '0'+simulation.time.o;
        }else{minuti = simulation.time.m}


        let listTable= []
        simulation.table.map((item , index) => listTable.push(
            <div key={"lista"+item.u+index}>
                <span>{`username: ${item.u}  `}</span>
                <span>{`punti: ${item.p}  `}</span>
                <span>{`tempo impiegato: ${item.t}  `}</span>
                <span>modalità: {(item.mod) ? 'timer  ' : 'no timer  '}</span>
                <span>{`data: ${item.d}  `}</span>
            </div>
        ))

        bodySimulation.push(
            <div key="simulazione">
                <div className='info'>
                    <p>{simulation.n}</p>
                    <p>{simulation.d}</p>
                    <p>{`tempo: ${ore}:${minuti}h`}</p>
                    <p>fatta in modalita timere: {simulation.hit.h}</p>
                    <p>fatta in modalita no-Timer: {simulation.hit.e}</p>
                </div>
                <div>
                    <p>argomenti trattati</p>
                    <ul>
                        {simulation.chapter.map((mat, matIndex) => {
                            return (<p key={mat.ma+matIndex}>{`${mat.ma} , domande: ${mat.quiz.length}`}</p>)
                        })}
                    </ul>
                </div>
                {(!Boolean(simulation?.table.length)) ? <div><p>al momento non ci sono dati</p></div> : <div>{listTable}</div> }
            </div>
        )
    }

    return(
        <div>
            {bodySimulation}
            <form onSubmit={e => {e.preventDefault(); startSimulation(e)}}>
                <p>scegli se attivare il timer</p>
                <div>
                    <label htmlFor='time' >timer si</label>
                    <input type="radio" id="timesi" name="time" value={1} title="timer si" defaultChecked={true}
                        onChange={e => setBtnTimer(e.target.value)}
                    /><br/>
                    <label htmlFor='time'>timer no</label>
                    <input type="radio" id="timeno" name="time" value={0} title="timer no"
                        onChange={e => setBtnTimer(e.target.value)}
                    /><br/>
                </div>
                <button>inizia</button>
            </form>
            
        </div>
    )
}