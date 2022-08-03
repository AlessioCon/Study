import {useState ,useEffect, useRef} from 'react';
import Cookie from '../../customHook/cookie';

function changeBtn(id, state){
    let btn = document.getElementById(id);

    if(state == 'active'){
        if(!btn.classList.contains('active')) btn.classList.add('active');
    }else{
        if(btn.classList.contains('active')) btn.classList.remove('active');
    }
}



export default function SettingUser(){
    let user = useRef()

    let [name, setName] = useState('caricamento...');
    let [surname, setSurName] = useState('caricamento...');
    let [username, setUserName] = useState('caricamento...');
    let [dataAge, setDataAge] = useState('');
    let [txc, setTxc] = useState('caricamento...');
    let [cell, setCell] = useState('caricamento...');
    let [country, setCountry] = useState('Italia');
    let [city, setCity] = useState('caricamento...');
    let [address, setAddress] = useState('caricamento...');
    let [cap, setCap] = useState('caricamento...');
    let [email, setEmail] = useState('caricamento...');
    let [password, setPassword] = useState('');

    let [errorMsg , setErrorMsg] = useState(['error disable', 'tutto ok']) //privo valore è la classe , secondo è il msg

    useEffect(() => {

        let getUser = async () => {
            try{
                let response = await fetch('/user/getuser' , {
                    method:'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({id: Cookie.getCookie('user')._id })
                })
                let data = await response.json()
                if(!data.success) return(<p>ricarica la pagina...</p>)
                user.current = data.user


                let u = user.current; let resetD = u.date.split('/')
                setName(u.name.f);    setSurName(u.name.l);    setUserName(u.user);
                setDataAge(resetD[2]+'-'+resetD[1]+'-'+resetD[0])
                setTxc(u.txc);    setCity(u.address.c);    setCap(u.address.cap);
                setCell(u.cell.n); setAddress(u.address.s);  setEmail(u.email);

            }catch(e){console.log(e)}
        }
        getUser() 

    }, [user])

    async function saveInfo(update, info, btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                btn.innerText = '';
                btn.classList.add('btn-pending');

                let oldPassword = ''
                if(update == 'password' || update == 'email'){
                    oldPassword = prompt('scrivi la tua vecchia password')
                }
        
                let response= await fetch('/user/update', {
                    method: 'PUT',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        update: update, 
                        data:info , 
                        userId:Cookie.getCookie('user')._id,
                        stipeId: user?.current?.idStripe,
                        password: oldPassword
                    })
                })
                let data = await response.json();
                if(!data.success) alert(data.msg)

                if(data.success && update === 'username'){
                    let id = Cookie.getCookie('user')._id;
                    let grade= Cookie.getCookie('user').grade;
                    Cookie.deliteCookie('user');
                    Cookie.setCookie('user' , {_id: id , user: info, grade: grade} , 1);
                    window.location.reload();
                }
        
                btn.innerText = 'salva';
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }
        
    }



return (
    <div>
        <h1>impostazioni utente</h1>
        <div>
            <div>
                <span>nome: </span><span>{name    || 'caricamento...'} </span>
            </div>
            <div>
                <span>cognome: </span><span>{surname    || 'caricamento...'} </span>
            </div>
            <div>
                <span>data di nascita: </span><span>{dataAge    || 'caricamento...'} </span>
            </div>
            <div>
                <span>codice fiscale: </span><span>{txc    || '0'} </span>
            </div>
            <div>
                <span>paese: </span><span>{country    || 'caricamento...'} </span>
            </div>
        </div>
        <div>
            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('username' , username , document.getElementById('btn-username'));
            }}>
                <div>
                    <label htmlFor="username">Username</label>
                    <input type="text" name="username" id="username" minLength={3} maxLength={15} required
                        value={username || ''}
                        onChange={e => {
                            setUserName(e.target.value);
                            changeBtn('btn-username', 'active');
                        }}
                    />
                </div>
                <button id="btn-username" className="btn-form" onClick={e => {
                    changeBtn('btn-username', 'disable');
                    }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('cell' , cell , document.getElementById('btn-cell'));
            }}>
                <div>
                    <label htmlFor="cell">Cellulare</label>
                    <input type="tel" name="cell" id="cell" placeholder="es. 0123456789" required
                        value={cell || ''}
                        onChange={e => {
                            setCell(e.target.value);
                            changeBtn('btn-cell', 'active');
                        }}
                    />
                </div>
                <button id="btn-cell" className="btn-form" onClick={e => {
                    changeBtn('btn-cell', 'disable');
                }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('city' , city , document.getElementById('btn-city'));
            }}>
                <div>
                    <label htmlFor="city">Città</label>
                    <input type="text" name="city" id="city"  required
                        value={city || ''}
                        onChange={e => {
                            setCity(e.target.value);
                            changeBtn('btn-city', 'active');
                        }}
                    />
                </div>
                <button id="btn-city" className="btn-form" onClick={e => {
                    changeBtn('btn-city', 'disable');
                }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('address' , address , document.getElementById('btn-address'));
            }}>
                <div>
                    <label htmlFor="address">Via</label>
                    <input type="text" name="address" id="address" placeholder="es. via Duomo 20"  required
                        value={address || ''}
                        onChange={e => {
                            setAddress(e.target.value);
                            changeBtn('btn-address', 'active');
                        }}
                    />
                </div>
                <button id="btn-address" className="btn-form" onClick={e => {
                    changeBtn('btn-address', 'disable');
                   
                }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('cap' , cap , document.getElementById('btn-cap'));
            }}>
                <div>
                    <label htmlFor="cap">Cap</label>
                    <input type="number" name="cap" id="cap"  min={5} max={5} required
                        value={cap || ''}
                        onChange={e => {
                            setCap(e.target.value);
                            changeBtn('btn-cap', 'active');
                            saveInfo('cap' , cap ,e.target);
                        }}
                    />
                </div>
                <button id="btn-cap" className="btn-form" onClick={e => {
                    changeBtn('btn-cap', 'disable');
                }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('email' , email , document.getElementById('btn-email'));
            }}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input type="email" name="email" id="email" required 
                        value={email || ''}
                        onChange={e => {
                            setEmail(e.target.value);
                            changeBtn('btn-email', 'active');
                        }}
                    />
                </div>
                <button id="btn-email" className="btn-form" onClick={e => {
                    changeBtn('btn-email', 'disable');
                }}>
                    salva
                </button>
            </form>

            <form onSubmit={e => {
                e.preventDefault() ; 
                saveInfo('password' , password , document.getElementById('btn-password'));
            }}>
                <div>
                    <label htmlFor="password">cambia password</label>
                    <input type="password" name="password" id="password" minLength={8} required autoComplete='true' 
                        value={password || ''}
                        onChange={e => {
                            setPassword(e.target.value);
                            changeBtn('btn-password', 'active');
                        }}
                    />
                </div>
                <button id="btn-password" className="btn-form" onClick={e => {
                    changeBtn('btn-password', 'disable');
                }}>
                    salva
                </button>
            </form>

        </div>

    </div>
    
)
}