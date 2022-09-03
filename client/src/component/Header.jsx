import { NavLink }  from 'react-router-dom';
import Cookie from '../customHook/cookie'

import env from "react-dotenv";
import { useEffect, useState } from 'react';
function menuActive(){
    let div = document.getElementById('hamburger');
    div.classList.toggle('active')
}

function Msg(){
    const [msg, setMsg] = useState(null);

    useEffect(()=>{
        async function getMsg(){
            let response = await fetch((env?.URL_SERVER || '') + '/api/user/have_msg' , {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({id: Cookie.getCookie('user')._id})
            })
            let dati = await response.json();
            setMsg(dati?.alert || false)
        }
        if(msg === null) getMsg()
    })

    return(
        <NavLink to='/dashbord/msg'     onClick={() => setMsg(false)}>
            {(msg) ? 'nuovi msg': 'msg'}
        </NavLink>
    )
}

function NavBarHeadre(){
        return(
            <div className={'header_nav-container'}>
                <div id="hamburger" className={'nav-hamburger'}
                    onClick={e => { 
                        e.target.classList.toggle('active')}}
                >
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <nav className={'header-nav'}>
                    <button className={"x-hamburger"} onClick={() => menuActive()}>X</button>
                    <ol>
                        <li><NavLink to='/simulazioni' onClick={() => menuActive()}>simulazioni</NavLink></li>
                        <li className='sub-nav'>
                            <a href="" onClick={e => {
                                e.preventDefault();
                                e.target.classList.toggle('active')
                                } }>click</a>
                            <ol>
                                <li><NavLink to='/test/test'     onClick={() => menuActive()}>test di prova</NavLink></li>
                                <li><NavLink to='/test/test'     onClick={() => menuActive()}>test di prova2</NavLink></li>
                            </ol>
                        </li>
                        <li><NavLink to='/corsi'    onClick={() => menuActive()}>Corsi</NavLink></li>
                        
                    </ol>
                </nav>
            </div>
            
        )
}

function UserLog(){
    
    let user = Cookie.getCookie('user');
    let redirect ='login'
    let valueLink= 'Login'
    if(user && user.user){
        redirect  =  'dashbord';
        valueLink =   user.user;
    }

    return(
        <div className="header-user">
            <NavLink to={redirect}>{valueLink}</NavLink>
        </div>
    )
}


function Header(){

    return(
        <header>
            <NavLink to="/">Home</NavLink>
            <NavBarHeadre/>
            {(Cookie.getCookie('user')) ? <Msg/>  : undefined}
            <UserLog/>

        </header>
   
    )
}

export default Header