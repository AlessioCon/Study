import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom";

import env from "react-dotenv";
import Section from '../component/Section'


export default function Simulations(){
    const [simulations , setSimulations] = useState(undefined);
    const [posto, setPosto] = useState(1);
    const [searchSim, setSearchSim] = useState('')

    useEffect(()=>{
        async function getSimulations() {
            let response = await fetch((env?.URL_SERVER || '' )+ '/api/simulation', {
                method: 'GET',
                header: {
                   accept : 'application/json',
                   'Content-type': 'application/json',
                   'Access-Control-Allow-Credentials': true,
                
                }
            })

            let data = await response.json();
            setSimulations(data.data);
        }

        getSimulations()
    }, [])

    let bodySimulation = [];
    
    if(!simulations){
        //fetch non avviato
        bodySimulation.push( <p key="simulations">caricamento simulazioni</p>)
    }else if(simulations.length === 0){
        
        bodySimulation.push( <p key="simulations">non ci sono simulazioni</p>)
    }else{
        let simulation = []
        let regExp = new RegExp(searchSim)
        simulations
        .filter(x => regExp.test(x.n))
        .map((sim , simIndex) => {

           
            simulation.push(
                <NavLink key={sim.n+simIndex} to={sim.n} title="vai alla simulazione">
                    <p>{sim.n}</p>
                    <p>{sim.d}</p>
                    <p>{`tempo: ${sim.time} m`}</p>
                </NavLink>
            ) 
        })


        bodySimulation.push(
            <div key="simulazione">
                <Section
                    elementi= {simulation}
                    divisione= {20}
                    down= {true}
                    postoSezioni = {[posto, setPosto]}
                />
            </div>
        )
        
        
    }

    return (
        <div key="simulations">
            <h1>simulazioni</h1>
            <p>trova simulazione</p>
            <form onSubmit={e => e.preventDefalut()}>
                <div>
                    <label htmlFor="searchSim">cerca simulazione</label>
                    <input type='search' name='searchSim' id='searchSim' value={searchSim} 
                        onChange={e=> setSearchSim(e.target.value)}
                    />
                </div>

            </form>
            {bodySimulation}
        </div>

    )
}