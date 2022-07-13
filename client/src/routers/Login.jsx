import { useState } from 'react';
import { Link } from 'react-router-dom';


function Login(){
    let [username, setUsername] = useState('ale@gmail.com');
    let [password, setPassword] = useState('Pa23d%eu');
    let [stato , setStato]      = useState({error: {class: '' , msg:''}});
    

    async function handleSubmit(e){
        e.preventDefault();
    
        let data = e.target;
        setStato({error: {class: 'form_msg-pending' , msg:''}});

        try{
            let response = await fetch('/login' , {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username.value,
                    password: data.password.value,
                
                })
            })
            let resData = await response.json();
            if (resData.success === false ) return setStato({error: {class: 'form_msg-error' , msg: resData.msg}});
            
            if(resData.success === true) {
                window.open("/", "_self");
            }
        }
        catch(e){console.log(e)}
        
    }

    return(
        <form action='/login' method='POST' onSubmit={(e) => handleSubmit(e)}>
            <div>
                <label htmlFor="username">Email</label>
                <input type="email" id="username" name="username" required autoComplete='email'
                value={username}
                onChange={(e) => setUsername(e.target.value)} 
                />
            </div>
            <div>
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" autoComplete='current-password' required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className={stato.error.class}>
                <p>{stato.error.msg}</p>
            </div>

            <div>
                <button formAction='submit'>SignIn</button>
                <Link to="/register">SignUp</Link>
            </div>
            


        </form>
    )
}

export default Login;