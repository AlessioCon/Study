import {useState , useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import Cookie from '../customHook/cookie'

import MultiSection from '../component/MultiSection';

import env from "react-dotenv";


function SimulationInfo(){
    const [simulation , setSimulation] = useState(undefined);
    const [userDom, setUserDom] = useState(undefined);
    let nameSim = useRef('caricamento...')

    const [multiPosto , setMultiPosto] = useState([])

    const param = useParams() 
    
    useEffect(()=>{
        let getSimulations = async () =>{
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/get_user_simulation_info' , {
                    method: "POST",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        simId: param.simId,
                        userId: Cookie.getCookie('user')._id
                    })
                })
                let data = await response.json();
                if(!data.success) return setSimulation([]) ;
                nameSim.current = data.simulation.name;
                setSimulation(data.simulation.saveDom);
                setUserDom(data.userDate)
                setMultiPosto(new Array(data.simulation.saveDom.length).fill(1))

                
            }catch(e){console.log(e);}
        }
        getSimulations();
    },[])


    async function deliteQuestion(materia , domanda){
       let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/save_answere', {
           method: 'PUT',
           headers: {
               Accept: "application/json",
               "Content-Type": "application/json",
               "Access-Control-Allow-Credentials": true,
           },
           body: JSON.stringify({
               simId: userDom.simId,
               indexMat: materia,
               indexDom: domanda,
               userId: Cookie.getCookie('user')._id
           })
       })
       let data = await response.json();
       alert(data.msg)
       if(data.success){
        simulation[materia].list.splice(domanda, 1)          
        setSimulation([...simulation]);
        }
    }


    if(simulation){
        if(typeof simulation === 'array'){
            return <p>dati simulazione non trovati</p>

        }else{

            //statistiche per materia
            let materie = []
            userDom.stat.map((mat, matIndex) => {
                materie.push(<p key={mat.n+matIndex}>{mat.n} : <span>{mat.num}%</span></p>)
            })

            //domande salvate
            let gruppoDomande = []
            simulation.map((mat, matIndex) => {
    
                if(!Boolean(mat.list.length)) return;
                let domande = []
                mat.list.map((dom, domIndex) => {
                    return domande.push(
                        <div key={'domanda-'+matIndex+'-'+domIndex}>
                            <p>{dom.q}</p>
                            <ul>
                                {dom.answere.map((ris, risIndex) => (
                                    <li key={"risposta"+domIndex+'-'+risIndex}>
                                        {ris.t}
                                    </li>
                                ))}
                            </ul>
                            <div>
                                <p>commento alla domanda:</p>
                                <p>{dom.c}</p>
                            </div>
                            <button onClick={e =>{
                                e.preventDefault();
                                deliteQuestion(matIndex , domIndex);
                            }}>cancella dai salvati</button>
                        </div>
                    )
                })

                gruppoDomande.push(
                    <div key={"gruppo"+matIndex}>
                        <p>{mat.n}</p>
                        <MultiSection
                            elementi= {domande} //lista elementi
                            divisione= {5}   //numero di elementi per sezione
                            down = {true}
                            postoSezioni = {[multiPosto , setMultiPosto]} //arry per posti
                            index= {matIndex}
                        />
                    </div>
                    
                
                    )
            })

            return (
                <div>
                    <h1>{nameSim.current}</h1>
                    <div>
                        {materie}
                        <p>dati raccolti su un totale di {userDom.hit} {(userDom.hit === 1) ? 'simulazione' : 'simulazioni'}</p>
                    </div>
                    <button>resetta progressi</button>
                    {(Boolean(gruppoDomande.length))?
                        <div>
                            <p>domande salvate</p>
                            {gruppoDomande}
            
                        </div>:
                        <p>non ci sono domande salvate</p>
                    }
                    
                </div>
            )
        }

    }else{return <p>caricamento...</p>}

}




export default SimulationInfo;