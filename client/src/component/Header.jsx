import { NavLink }  from 'react-router-dom';
import Cookie from '../customHook/cookie'



function menuActive(){
    let div = document.getElementById('hamburger');
    div.classList.toggle('active')
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
            <UserLog/>

        </header>
   
    )
}

export default Header