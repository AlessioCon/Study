import {useState , useEffect } from 'react';
import {NavLink} from 'react-router-dom';
import Cookie from '../customHook/cookie'

import env from "react-dotenv";



function listSimulations(simulations, filter){

    if(simulations?.length > 0){

        let reg = (filter) ? new RegExp(`^${filter.toLowerCase()}`) : /./g
        let simulationsFilter = simulations.filter(sim => reg.test(sim.n.toLowerCase()));

        return (
            <div>
                {simulationsFilter.map((sim , index) =>{
                
                    return (<NavLink style={{border: "2px solid black", display: "block", margin: "10px"}}
                        to={sim.simId}
                        key={sim.n+index}
                    >
                    <p>{sim.n}</p>
                    <p>fatta : {(Number(sim.hit) === 1) ? '1 volta': sim.hit+' volte'}</p>
                    </NavLink>)
                })}
            </div>
        );
    }
    return <p>Al momento non ci sono simulazioni disponibili</p>
}


function Simulazioni(){
    const [simulations , setSimulations] = useState([]);
    const [macroStat, setMacroStat] = useState([]); //macro sattistiche
    const [htmlMacroStat, setHtmlMacroStat] = useState(null); //formattazione in "html" per i dati macroStatistiche
    const [filter, setFilter] = useState('');


    useEffect(()=>{
        let getSimulations = async () =>{
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/get_user_simulations' , {
                    method: "POST",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({id: Cookie.getCookie('user')._id})
                })
                let data = await response.json();
                if(!data.success) return undefined ;
                setSimulations(data.simulations)
                setMacroStat(data.macro)
                
    
            }catch(e){console.log(e);}
        }
        getSimulations();
    },[])
    
    useEffect(() => {
        if(! Boolean(macroStat?.length)) return;
        let allPack = []
        macroStat.map((pack , packIndex) => {
    
            let materie = []
            pack.materie.map((mat , matIndex)=> {
                let capitoli = []
                mat.capitoli.map((cap, capIndex) => {
                    return capitoli.push(
                        <li key={cap.capitolo+capIndex}>
                            {cap.capitolo}= 
                            {cap.num}%
                        </li>
                    )
                })
            return materie.push(
                <li key={mat.materia+matIndex}>
                    {mat.materia}
                    <ul>
                        {capitoli}
                    </ul>
                </li>
            )
        })
        
        return allPack.push(

            <li key={pack.pack+packIndex}>
                {pack.pack}
                <ul>
                    {materie}
                </ul>
            </li>
        )
    })


    setHtmlMacroStat(allPack)
    }, [macroStat])


    return(
        <main>
            <h1>questa è la lista delle simulazioni fatte</h1>
            <div>
                <label htmlFor='filter'>cerca il nome della simulazione</label>
                <input type="search" id="filter" name="filter" placeholder='cerca la simulazione...'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {listSimulations(simulations, filter)} 
            {(htmlMacroStat !== null) ? <div>{htmlMacroStat} </div>: undefined }      
        </main>
       
    )
}




export default Simulazioni;