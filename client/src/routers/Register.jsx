import { useState } from 'react';
import {Link}       from 'react-router-dom';


//element
import Input from '../component/form/Input'

function Register(){
    let [stato , setStato]      = useState({error: {class: '' , msg:''}});

    let [name, setName] = useState();
    let [surname, setSurName] = useState();
    let [username, setUserName] = useState();
    let [dataAge, setDataAge] = useState();
    let [txc, setTxc] = useState();
    let [cell, setCell] = useState();
    let [country, setCountry] = useState();
    let [city, setCity] = useState();
    let [address, setAddress] = useState();
    let [cap, setCap] = useState();
    let [email, setEmail] = useState();
    let [password, setPassword] = useState();
    
    async function handlSubmit(e){
        e.preventDefault();

        setStato({error: {class: 'form_msg-pending' , msg: ''}});
        try{
            let response = await fetch(`${window.env.URL_SERVER}/register` ||'/register', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    surname: surname,
                    username: username,
                    date: dataAge,
                    txc: txc,
                    cell: cell,
                    country: country,
                    city: city,
                    street: address,
                    cap: cap,
                    email: email,
                    password: password,
                })
            })

            let data = await response.json();
            if (data.success === false) return setStato({error: {class: 'form_msg-error' , msg: data.msg}});
            if (data.success === 'error') return setStato({error: {class: 'form_msg-error' , msg: 'error ricarica la pagina'}});
            window.open("/login", "_self")

        }catch(e){console.log(e)}
        
    }


    return(
        <form className={'form'} onSubmit={(e) => handlSubmit(e)}> 

            <Input 
                nome='name'
                label='Nome' 
                variabile={[name, setName]} 
                propInput={{type: 'text', required:true, minLength:3 , maxLength:11}}
            />

            <Input 
                nome='surname'
                label='Cognome' 
                variabile={[surname, setSurName]} 
                propInput={{type: 'text', required:true, minLength:3 , maxLength:11}}
            />

            <Input 
                nome='username'
                label='User' 
                variabile={[username, setUserName]} 
                propInput={{type: 'text', required:true, minLength:3 , maxLength:15}}
            />

            <Input 
                nome='date'
                label='Data Di Nascita' 
                variabile={[dataAge, setDataAge]} 
                propInput={{type: 'date', required:true}}
            />

            <Input 
                nome='txc'
                label='Codice Fiscale' 
                variabile={[txc, setTxc]} 
                propInput={{type: 'text', required:true , minLength:16 , maxLength:16}}
            />

            <Input 
                nome='country'
                label='Paese' 
                variabile={[country, setCountry]} 
                propInput={{type: 'text', required:true}}
            />

            <Input 
                nome='city'
                label='Città' 
                variabile={[city, setCity]} 
                propInput={{type: 'text', required:true}}
            />

            <Input 
                nome='address'
                label='Indirizzo' 
                variabile={[address, setAddress]} 
                propInput={{type: 'text', required:true}}
            />

            <Input 
                nome='cap'
                label='Cap' 
                variabile={[cap, setCap]} 
                propInput={{type: 'text', required:true}}
            />

            <Input 
                nome='email'
                label='Email' 
                variabile={[email, setEmail]} 
                propInput={{type: 'email', required:true}}
            />

            <Input 
                nome='password'
                label='Password' 
                variabile={[password, setPassword]} 
                propInput={{type: 'password', required:true, minLength:8, autoComplete:'current-password'}}
            />
            

            <div className={stato.error.class}>
                <p>{stato.error.msg}</p>
            </div>

            <div className={'form_container-btn'}>
                <button className={'btn_form'} formAction='submit'>SignUp</button>
                <Link className={'btn_form second'} to="/login">SignIn</Link>
            </div>
            
        </form>
    )
}



export default Register;