import {useState , useEffect } from 'react';
import {NavLink} from 'react-router-dom';
import Cookie from '../customHook/cookie'

import env from "react-dotenv";



function listCourse(corsi, filter){

    if(corsi.length > 0){

        let reg = (filter) ? new RegExp(`^${filter.toLowerCase()}`) : /./g
        let corsiFilter = corsi.filter(corso => reg.test(corso.t.toLowerCase()));

        return (
            <div>
                {corsiFilter.map((corso) =>
                
                    <NavLink style={{border: "2px solid black", display: "block", margin: "10px"}}
                        to={'../../user/corso/'+Cookie.getCookie('user')._id+'/'+corso._id}
                        key={corso.sl}
                    >
                    <p>{corso.t}</p>
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
                let response = await fetch((env?.URL_SERVER || '' ) + '/api/user/get_user_course' , {
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
                setCorsi(data.courses)
                
    
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