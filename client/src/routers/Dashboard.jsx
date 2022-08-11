import { useState, useEffect } from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import Cookie from '../customHook/cookie';

import env from "react-dotenv";

function Dashbord(){
    const [user, setUser] = useState(null)
    
    useEffect(()=> {
        try {
            let getUser = async ()=>{
                let response = await fetch((env?.URL_SERVER || '' ) +  '/api/user/getuser' , {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({id: Cookie.getCookie('user')._id})
                })
                let data = await response.json();
                if(!data.success){
                    alert('errore nel trovare l\'utente , ricarica la pagina')
                    window.location.href = '/'
                }
                setUser(data.user)
            }
            if(!user) getUser()
            
        } catch(e) {if(e) console.log(e)}

    }, [user]);


    async function userLogOut(e){
        e.preventDefault()
        try{
            let response = await fetch((env?.URL_SERVER || '' ) + '/api/sign/logout', {
                    method: "GET",
                    credentials: "include",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
            })
            let data = await response.json();
            if(!data.success) return alert('errore! Ricarica la pagina...');   
           
            Cookie.deliteCookie('user')
            return  window.open("/", "_self");
        
        }catch(e){console.log(e)}
    }

    if(!user){
        return(<p>caricamento...</p>)
    }

    let accessVenditore = user.grade.find(e => {if(e === 'seller' || e === 'sellerPending') return true});
    let accessCorsiVenditore = user.grade.find(e => e === 'seller' );
    let cookieSeller = Cookie.getCookie('newSeller')?.seller;

    let isMaster = user.grade.find(e => e === 'master');

    return (

        <div className='dashboard'>


            <nav className={'dashboard-nav'}>
                <ol>
                    {(Boolean(isMaster)) ? 
                    <li><NavLink  className={({ isActive }) => isActive ? "dashbord-select" : null} to="master">Master</NavLink></li>
                    : null}
                    <li><NavLink  className={({ isActive }) => isActive ? "dashbord-select" : null} to="utente">Utente</NavLink></li>
                    <li><NavLink  className={({ isActive }) => isActive ? "dashbord-select" : null} to="corsi">Corsi</NavLink></li>
                    {(accessCorsiVenditore || cookieSeller) ? 
                        <li className='sub-nav'>
                            <a href="" onClick={e => {
                               e.preventDefault();
                               e.target.classList.toggle('active')
                               }}>Crea Corsi</a>
                            <ol>
                                <li><Link  to="crea-corso">Corsi</Link></li>
                                <li><Link  to="crea-lezioni">Lezioni</Link></li>
                            </ol>
                        </li> 
                        : null}
                    <li className='sub-nav'>
                        <a href="" onClick={e => {
                           e.preventDefault();
                           e.target.classList.toggle('active')
                           }}>Impostazioni</a>
                        <ol>
                            <li><NavLink  to="/impostazioni/utente">utente</NavLink></li>
                        </ol>
                    </li>
                    {(accessVenditore) ? <li><NavLink  className={({ isActive }) => isActive ? "dashbord-select" : null} to="venditore">Venditore</NavLink></li> : null}
                    <li><a href="" onClick={(e) => userLogOut(e)}>LogOut</a></li>
                </ol>
            </nav>
            <Outlet/>
        </div>
       
    )
}

export default Dashbord;