import {Component}  from 'react';
import { NavLink }  from 'react-router-dom';
import Cookie from '../customHook/cookie'

class NavBarHeadre extends Component{

    render(){
        return(
            <nav>
                <ol>
                    <li><NavLink to='/contatti'>Contatti</NavLink></li>
                    <li><NavLink to='/corsi'>Corsi</NavLink></li>
                    <li><NavLink to='/test'>Test</NavLink></li>
                </ol>
            </nav>
        )
    }
}

function UserLog(){
    
    let user = Cookie.getCookie('user');
    let redirect ='login'
    let valueLink= 'Login'
    if(user){
        redirect  = (user.user) ? 'dashbord' : 'login';
        valueLink = (user.user) ? user.user : 'login';
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
            <UserLog/>
            
        </header>
   
    )
}

export default Header