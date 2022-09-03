import {useState , useEffect, useRef} from 'react';
import {useParams} from 'react-router-dom';
import Cookie from '../customHook/cookie'

import PlurySection from '../component/PlurySection'

import env from "react-dotenv";


function SimulationInfo(){
    const [simulation , setSimulation] = useState(undefined);//domande salvate
    const [userDom, setUserDom] = useState(undefined);//statistiche
    const [plurySection, setPlurySection] = useState([]);

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
                nameSim.current = [data.simulation.name, data.userDate.simId];
                setSimulation(data.simulation.saveDom);
                setUserDom(data.userDate)
                setMultiPosto(new Array(data.simulation.saveDom.length).fill(1))

                
            }catch(e){console.log(e);}
        }
        getSimulations();
    },[])

    //per PLURYSECTION Simulazione-On
    useEffect(() => {
        if(simulation){
            let mat = [];
            let elemento = simulation
            elemento?.forEach((materia) => {
               mat.push(new Array(materia.cap.length).fill(1))
            });
            setPlurySection(mat)
        }
    }, [simulation])


    async function deliteQuestion(materia , capitolo ,domanda){
        let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/save_answere', {
            method: 'PUT',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                simId: nameSim.current[1],
                materia: materia[0],
                capitolo: capitolo[0],
                indexDom: domanda,
                userId: Cookie.getCookie('user')._id
            })
        })
        let data = await response.json();
        alert(data.msg)
        if(data.success){
            simulation[materia[1]].cap[capitolo[1]].dom.splice(domanda , 1);
            if(simulation[materia[1]].cap[capitolo[1]].dom.length === 0){

                plurySection[materia[1]].splice(capitolo[1], 1)
                simulation[materia[1]].cap.splice(capitolo[1], 1)}

            if(simulation[materia[1]].cap.length === 0){ 

                plurySection.splice(materia[1], 1)
                simulation.splice(materia[1], 1)
            }
        }
        setSimulation([...simulation])
        setPlurySection(...plurySection)
        
    }


    if(userDom){
        if(typeof userDom === 'array'){
            return <p>dati simulazione non trovati</p>

        }else{
            //statistiche per materia
            let materie = []
            userDom.stat.map((mat, matIndex) => {
                let AllPercent = 0
                let capitoli = []
                mat.cap.map((cap, capIndex)=> {
                    AllPercent += cap?.num || 0;
                    return capitoli.push(
                        <li key={cap.n+capIndex}>
                            <p>{cap.n} = {cap?.num}%</p>
                        </li>
                    )

                })

                let calcPercent = (AllPercent / mat.cap.length).toFixed(2)
                return materie.push(
                    <li key={mat.mat + matIndex}>

                        <p>{mat.mat} =  {calcPercent} %</p>
                        
                        <ul>
                            {capitoli}
                        </ul>
                    </li>
                    
                )
            })
            let gruppoDomande = []
            if(simulation){
                //domande salvate
                simulation.map((mat, matIndex) => {
                
                    let capitoli = [];
                    mat.cap.map((cap,capIndex) => {
                        let domande = []
                        cap.dom.map((dom, domIndex) => {
                            domande.push(
                                <li key={dom.q+domIndex}>
                                    <p>{dom.q}</p>
                                    <ul>
                                        {dom.answere.map((x, xIndex) => (<li key={x.t+xIndex}>{x.t}</li>))}
                                    </ul>
                                    <button onClick={e =>{
                                        e.preventDefault();
                                        deliteQuestion([mat.mat, matIndex] , [cap.n , capIndex], domIndex);
                                    }}>cancella dai salvati
                                    </button>
                                </li>
                            )
                        })
                        capitoli.push(
                            <li key={cap.n+capIndex}>
                                <p>{cap.n}</p>
                                <ul>
                                    {<PlurySection
                                        elementi= {domande}
                                        divisione= {5}
                                        down = {true}
                                        postoSezioni = {[plurySection , setPlurySection]}
                                        index= {[matIndex, capIndex]}//materia, capitolo
                                    />}
                                </ul>
                            </li>
                        )
                    })
                    gruppoDomande.push(
                        <li key={mat.mat+matIndex}>
                            <p>{mat.mat}</p>
                            <ul>
                                {capitoli}
                            </ul>
                        </li>
                    )
                })
            }
            

            return (
                <div>
                    <h1>{nameSim.current[0]}</h1>
                    <div>
                        <ul>
                            {materie}
                        </ul> 
                        <p>dati raccolti su un totale di {userDom.hit} {(userDom.hit === 1) ? 'simulazione' : 'simulazioni'}</p>
                    </div>

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