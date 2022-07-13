import { useState } from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import Cookie from '../customHook/cookie';


function Dashbord(){
    const [stato , setStato]  = useState({class: 'button' , msg:'LogOut'});
    
    async function userLogOut(){
        setStato({error: {class: 'button_msg-pending' , msg:''}})

        try{
            let response = await fetch('/logout', {
                    method: "GET",
                    credentials: "include",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
            })
            let data = await response.json();
            if(!data.success) return setStato({error: {class: 'button' , msg:'LogOut'}});

            Cookie.deliteCookie('user');
            return  window.open("/", "_self");
        

        }catch(e){console.log(e)}
    }

    return (
        <main>
            <nav >
                <ul>
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="utente">Utente</NavLink></li>
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="corsi">Corsi</NavLink></li>
                    <li>
                        Corsi
                        <ul>
                            <li><Link to="crea-corso">Corsi</Link></li>
                            <li><Link to="lezioni">Lezioni</Link></li>
                        </ul>
                    </li>
                  
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="impostazioni">Impostazioni</NavLink></li>
                </ul>
            </nav>

            <h1>Questa è una dashbord</h1>
            <button onClick={() => userLogOut()}>{stato.msg}</button>
            <Outlet/>
            
        </main>
    )
}

export default Dashbord;