import {Component}  from 'react';
import { NavLink }  from 'react-router-dom';
import Cookie from '../customHook/cookie'

class NavBarHeadre extends Component{

    render(){
        return(
            <nav>
                <ol>
                    <NavLink to='/contatti'>Contatti</NavLink>
                    <NavLink to='/corsi'>Corsi</NavLink>
                    <NavLink to='/test'>Test</NavLink>
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
        <div>
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