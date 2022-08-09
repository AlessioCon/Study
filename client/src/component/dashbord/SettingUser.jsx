import {useState ,useEffect, useRef} from 'react';
import Cookie from '../../customHook/cookie';

import SingleInput from '../form/SingleInput'



export default function SettingUser(){
    let user = useRef()

    let name= useRef('caricamento...');
    let surname = useRef('caricamento...');
    let dataAge = useRef('');
    let country = useRef('Italia');
    let txc = useRef('caricamento...');

    let [username, setUserName] = useState('caricamento...');
    let [cell, setCell] = useState('caricamento...');
    let [city, setCity] = useState('caricamento...');
    let [address, setAddress] = useState('caricamento...');
    let [cap, setCap] = useState('caricamento...');
    let [email, setEmail] = useState('caricamento...');
    let [password, setPassword] = useState('');

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

                name.current = u.name.f;    surname.current=u.name.l;    setUserName(u.user);
                dataAge.current = resetD[2]+'-'+resetD[1]+'-'+resetD[0];
                txc.current = u.txc;    setCity(u.address.c);    setCap(u.address.cap);
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
                if(update === 'password' || update === 'email'){
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
                <span>nome: </span><span>{name.current} </span>
            </div>
            <div>
                <span>cognome: </span><span>{surname.current} </span>
            </div>
            <div>
                <span>data di nascita: </span><span>{dataAge.current} </span>
            </div>
            <div>
                <span>codice fiscale: </span><span>{txc.current} </span>
            </div>
            <div>
                <span>paese: </span><span>{country.current} </span>
            </div>
        </div>
        <div>
            <SingleInput 
                nome='username'
                label='user' 
                variabile={[username, setUserName]} 
                propInput={{type: 'text', minLength:3 ,maxLength:15, required:true }/*'type="text"-minLength=3-maxLength=15-required=true'*/}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='cell' 
                variabile={[cell, setCell]} 
                propInput={{type:'number',  required:true}}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='city'
                label='città'  
                variabile={[city, setCity]} 
                propInput={{type:'text',  required:true}}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='address'
                label='indirizzo' 
                variabile={[address, setAddress]} 
                propInput={{type:'text',  required:true , placeholder:"es. via Duomo 20"}}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='cap'
                variabile={[cap, setCap]} 
                propInput={{type:'number',  required:true , step:1}}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='email' 
                variabile={[email, setEmail]} 
                propInput={{type:'email',  required:true }}
                fetch={saveInfo}
            />

            <SingleInput 
                nome='password'
                label='cambia password' 
                variabile={[password, setPassword]} 
                propInput={{type:'password',  required:true , minLength:8 , autoComplete:'true'}}
                fetch={saveInfo}
            />
        </div>

    </div>
    
)}
