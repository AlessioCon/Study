import { useState } from 'react';
import { Link } from 'react-router-dom';
import env from "react-dotenv";

//element
import Input from '../component/form/Input'

function Login(){
    let [username, setUsername] = useState('ales@gmail.com');
    let [password, setPassword] = useState('Pa23d%eust');
    let [stato , setStato]      = useState({error: {class: '' , msg:''}});
    

    async function handleSubmit(e){
        e.preventDefault();
    
        let data = e.target;
        setStato({error: {class: 'form_msg-pending' , msg:''}});

        try{
            let response = await fetch((env?.URL_SERVER || '' ) +  '/api/sign/login' , {
                method : 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    username: data.username.value,
                    password: data.password.value,
                })
            })
            let resData = await response.json();
            if (resData.success === false ) return setStato({error: {class: 'form_msg-error' , msg: resData.msg}});
            
            if(resData.success === true) window.open("/", "_self");
        }
        catch(e){console.log(e)}
        
    }

    return(
        <form className={'form'} onSubmit={(e) => handleSubmit(e)}>

            <Input 
                nome='username'
                label='Email' 
                variabile={[username, setUsername]} 
                propInput={{type: 'email', required:true, autoComplete:'email' }}
            />

            <Input 
                nome='password'
                label='Password' 
                variabile={[password, setPassword]} 
                propInput={{type:'password', required:true, autoComplete:'current-password' }}
            />

            <div className={stato.error.class}>
                <p>{stato.error.msg}</p>
            </div>

            <div className={'form_container-btn'}>
                <button className={'btn_form'} formAction='submit'>SignIn</button>
                <Link className={'btn_form second'} to="/register">SignUp</Link>
            </div>
        
        </form>
    )
}

export default Login;