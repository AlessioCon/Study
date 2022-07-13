import { useState } from 'react';
import {Link}       from 'react-router-dom';

function Register(){
    let [stato , setStato]      = useState({error: {class: '' , msg:''}});

    let [name, setName] = useState('Alessio');
    let [surname, setSurName] = useState('Conforto');
    let [username, setUserName] = useState('Ale12ssio');
    let [dataAge, setDataAge] = useState('2003-09-17');
    let [txc, setTxc] = useState('QQQQQQ12A12A123A');
    let [cell, setCell] = useState('3293874651');
    let [country, setCountry] = useState('Italia');
    let [city, setCity] = useState('Napoli');
    let [address, setAddress] = useState('via Ciubecca n29');
    let [cap, setCap] = useState('80039');
    let [email, setEmail] = useState('ale@gmail.com');
    let [password, setPassword] = useState('Pa23d%eu');
    
    async function handlSubmit(e){
        e.preventDefault();

        setStato({error: {class: 'form_msg-pending' , msg: ''}});
        try{
            let response = await fetch('/register', {
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
        <form action="/register" method="POST" onSubmit={(e) => handlSubmit(e)}> 

            <div>
                <label htmlFor="name">Name</label>
                <input type="text" name="name" id="name" minLength={3} maxLength={11} value={name} required 
                     onChange={(e) => setName(e.target.value)}
                />
            </div>
        
            <div>
                <label htmlFor="surname">Surname</label>
                <input type="text" name="surname" id="surname" minLength={3} maxLength={11} value={surname} required
                    onChange={(e) => setSurName(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='username'>Username</label>
                <input type="text" name="username" id="username" minLength={3} maxLength={15} value={username} required
                    onChange={(e) => setUserName(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='username'>Data Di Nascita</label>
                <input type="date" name="date" id="date"  value={dataAge} required
                    onChange={(e) => setDataAge(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='txc'>Codice Fiscale</label>
                <input type="text" name="txc" id="txc" minLength={16} maxLength={16} value={txc} required
                    onChange={(e) => setTxc(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='txc'>Numero Cellulare</label>
                <input type="tel" name="cell" id="cell" value={cell} placeholder="es. 0123456789" required
                    onChange={(e) => setCell(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='country'>Paese</label>
                <input type="text" name="country" id="country" value={country} required
                    onChange={(e) => setCountry(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='city'>Città</label>
                <input type="text" name="city" id="city" value={city} required
                    onChange={(e) => setCity(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='address'>Indirizzo</label>
                <input type="text" name="address" id="address" placeholder="es. via Duomo 20" value={address} required
                    onChange={(e) => setAddress(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='cap'>cap</label>
                <input type="number" name="cap" id="cap" value={cap} required
                    onChange={(e) => setCap(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='email'>email</label>
                <input type="email" name="email" id="email" value={email} required
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor='password'>password</label>
                <input type="password" name="password" id="password" minLength={8}  value={password} required
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className={stato.error.class}>
                <p>{stato.error.msg}</p>
            </div>

            <div>
                <button formAction='submit'>SignUp</button>
                <Link to="/login">SignIn</Link>
            </div>
            
        </form>
    )
}



export default Register;