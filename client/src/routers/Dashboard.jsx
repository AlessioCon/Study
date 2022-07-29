import { useState, useEffect } from 'react';
import {Link, NavLink, Outlet} from 'react-router-dom';
import Cookie from '../customHook/cookie';


function Dashbord(){
    const [stato , setStato]  = useState({class: 'button' , msg:'LogOut'});
    const [user, setUser] = useState(null)
    
    useEffect(()=> {
        try {
            let getUser = async ()=>{
                let response = await fetch('/user/getuser' , {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({id: Cookie.getCookie('user')._id})
                })
                let data = await response.json()
                if(!data.success){
                    alert('errore nel trovare l\'utente , ricarica la pagina')
                    window.location.href = '/'
                }
                setUser(data.user)
            }
            if(!user) getUser()
            
        } catch(e) {if(e) console.log(e)}

    }, [user]);


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

            Cookie.deliteCookie('user')
            return  window.open("/", "_self");
        

        }catch(e){console.log(e)}
    }

    if(!user){
        return(<p>caricamento...</p>)
    }

    let accessVenditore = user.grade.find(e => {if(e === 'seller' || e === 'sellerPending') return true});
    let accessCorsiVenditore = user.grade.find(e => e === 'seller' );
    let cookieSeller = Cookie.getCookie('newSeller')?.seller

    return (
        <main>
            <nav className='nav-dashboard'>
                <ul>
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="utente">Utente</NavLink></li>
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="corsi">Corsi</NavLink></li>
                    {(accessCorsiVenditore || cookieSeller) ? 
                        <li>
                            crea Corsi
                            <ul>
                                <li><Link to="crea-corso">Corsi</Link></li>
                                <li><Link to="lezioni">Lezioni</Link></li>
                            </ul>
                        </li> 
                        : null}
                    
                    <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="impostazioni">Impostazioni</NavLink></li>
                    {(accessVenditore) ? <li><NavLink className={({ isActive }) => isActive ? "iconActive" : "iconNoActive"} to="venditore">Venditore</NavLink></li> : null}
                </ul>
            </nav>

            <h1>Questa è una dashbord</h1>
            <button className="btn" onClick={() => userLogOut()}>{stato.msg}</button>
            <Outlet/>
            
        </main>
    )
}

export default Dashbord;