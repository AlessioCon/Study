import  {useEffect, useState} from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Cookie from './customHook/cookie'
import env from "react-dotenv";


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
import MasterViewUser from './component/dashbord/MasterViewUser';

import SettingUser from './component/dashbord/SettingUser';

import Status from './routers/Status';

import UserCorso from './routers/UserCorso';

function App (){
    const [user, setUser] = useState(Cookie.getCookie('user'));

    useEffect(() => {
    const getUser = async () =>{
        try{
            let response = await fetch((env.URL_SERVER || '') + "/login", {
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
                Cookie.setCookie('user', data.data , 30);
                return setUser(data.data);
            }
            
        }catch(e){console.log(e)}
    }
    if (!Boolean(user)) getUser();
    }, [user]);

    



let isMaster = Boolean(user?.grade?.find(e => e === 'master'))
let isSeller = Boolean(user?.grade?.find(e => {if(e === 'seller' || e === 'sellerPending') return true}))

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
                    <Route path="venditore" element={isSeller ? <UserSeller/> :  <Navigate to="/dashbord"/>}/>
                </Route>
                <Route path="impostazioni/utente" element={user ? <SettingUser/> : <Navigate to="/login"/> }/>
                <Route path="dashbord/crea-lezioni" element={isSeller ? <CreateLesson/> : <Navigate to="/dashbord"/> }/>
                <Route path="dashbord/crea-corso" element={isSeller ? <CreateCourse/> : <Navigate to="/dashbord"/>}/>

                <Route path="master/view/:user"  element={isMaster ? <MasterViewUser/> : <Navigate to="/dashbord"/>}/>


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