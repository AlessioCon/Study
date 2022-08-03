import  {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookie from './customHook/cookie'



import './index.css';
import Home     from './routers/Home';
import Login    from './routers/Login';
import Register from './routers/Register';
import Dashbord from './routers/Dashboard';
import Corsi    from './routers/Corsi';
import Corso    from './routers/Corso';

import Header   from './component/Header';

import UserDashbord from './component/dashbord/UserDashbord';
import CreateCourse from './component/course/CreateCourse';
import CreateLesson from './component/course/CreateLesson';
import UserSeller from './component/dashbord/UserSeller';
import MasterDashbord from './component/dashbord/MasterDashbord';

import SettingUser from './component/dashbord/SettingUser';

import Status from './routers/Status';

import UserCorso from './routers/UserCorso';

function App (){
    const [user, setUser] = useState(Cookie.getCookie('user'));

    useEffect(() => {

    const getUser = async () =>{
        try{
            let response = await fetch("/login", {
                            method: "GET",
                            credentials: "include",
                            headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Credentials": true,
                            },
                        })
            let data = await response.json();
            if(data.success) { 
                //if (user !== undefined && user['_id'] === data.data['_id']) return ;
                Cookie.setCookie('user', data.data , 1);
                return setUser(data.data)
            }
            
            //return setUser(false);
        }catch(e){console.log(e)}
    }
    if (!Boolean(user)) getUser();
    }, [user]);

    







let isMaster = Boolean(user?.grade?.find(e => e === 'master'))
    return(
        <BrowserRouter>
            <Header/>
            <Routes >
                <Route exact path="/"       element={<Home /> }/>
                <Route path="login"  element={user ? <Navigate to="/"/> : <Login/>}/>
                <Route path="register"  element={user ? <Navigate to="/"/> : <Register/>}/>


                <Route path="dashbord"  element={user ? <Dashbord/> : <Navigate to="/login"/>}>
                    <Route path="master" element={isMaster ? <MasterDashbord /> : <Navigate to="/dashbord"/>}/>
                    <Route path="utente" element={<UserDashbord />}/>
                    <Route path="impostazioni" element={<h1>impostazioni</h1>}/>
                    <Route path="venditore" element={<UserSeller/>}/>
                </Route>
                <Route path="impostazioni/utente" element={user ? <SettingUser/> : <Navigate to="/login"/> }/>
                <Route path="dashbord/lezioni" element={<CreateLesson/>}/>
                <Route path="dashbord/crea-corso" element={<CreateCourse/>}/>


                <Route path="corsi"  element={<Corsi/>}/>
                <Route path="corsi/:name" element={<Corso/>}/>
        

                <Route path="stripe/status" element={<Status/>}/>

                <Route path="user/corso/:idUser/:idCorso" element={user ? <UserCorso/> : <Navigate to="/login"/>}/>

                <Route path="*"  element={<h1>page not found</h1>}/>
            </Routes>
        </BrowserRouter>
    )
}


export default App;