import {useState , useEffect } from 'react';
import {NavLink} from 'react-router-dom';

import env from "react-dotenv";



function listCourse(corsi, filter){

    if(corsi.length > 0){

        let reg = (filter) ? new RegExp(`^${filter.toLowerCase()}`) : /./g
        let corsiFilter = corsi.filter(corso => reg.test(corso.t.toLowerCase()));

        return (
            <div>
                {corsiFilter.map((corso) =>
                
                    <NavLink style={{border: "2px solid black", display: "block", margin: "10px"}}
                        to={corso.sl}
                        key={corso.sl}
                        title='vai al corso'
                    >
                    <p>{corso.t}</p>
                    <p>{corso.sale.p} €</p>
                    <p>{corso.sale.o} €</p>
                    {(corso?.simu && corso?.simu.length !== 0) 
                    ? <p>{(corso?.simu.length > 1) 
                        ? 'previste '+corso?.simu.length+' simulazioni private' 
                        : 'prevista 1 simulazione privata'}</p>
                    :undefined

                    }
                    
                    </NavLink>
                )}
            </div>
        );
    }
    return <p>Al momento non ci sono corsi disponibili</p>
}


function Corsi(){
    const [corsi , setCorsi] = useState([]);
    const [filter, setFilter] = useState('');

    
    useEffect(()=>{
        let getCourse = async () =>{
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + '/api/corsi' , {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(data.success) return setCorsi(data.data) ;
                if(!data.success) return <p>corsi non disponibili</p>;
    
            }catch(e){console.log(e);}
        }
        getCourse();
    },[])

    return(
        <main>
            <h1>questa è la lista dei corsi</h1>
            <div>
                <label htmlFor='filter'>cerca il nome del corso</label>
                <input type="search" id="filter" name="filter" placeholder='cerca il corso...'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {listCourse(corsi, filter)}        
        </main>
       
    )
}




export default Corsi;