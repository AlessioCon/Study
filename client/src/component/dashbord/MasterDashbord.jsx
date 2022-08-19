import { useEffect, useState } from 'react';
import Cookie from '../../customHook/cookie';

import SingleInput from '../form/SingleInput';
import Section from '../Section';
import env from "react-dotenv";



export default function MasterDashbord(){
    let [master, setMaster] = useState(null)
    let [newUserSeller, setNewUserSeller] = useState('')
    let [seller, setSeller] = useState() //valore grezzo di tutti i venditori (non formattato in html)
    let [sellerList, setSellerList] = useState(null) //lista formattata in html di tutti ivenditori
    let [sellerSearch, setSellerSearch] = useState('')

    let [posto , setPostoSezioni] = useState(1)

    useEffect(() => {
        let getMaster = async () => {
            let response = await fetch((env?.URL_SERVER || '') + '/api/master/' , {
                method: 'POST',
                headers:{
                    accept:"application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    id: Cookie.getCookie('user')._id
                })
            })
            let data = await response.json()
            if(data.success === false) return(<p>caricamento...</p>) 
            setMaster(data.user)
        }
        if (master === null) getMaster()
    })

    async function newSeller(update, info, btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/new_seller', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        idMaster: master._id,
                        userSeller: info,
                    })
                })
                let data = await response.json();
                alert(data.msg)
        
                btn.innerText = 'salva';
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }
        
    }

    async function allSeller(){
        let response = await fetch((env?.URL_SERVER || '') + '/api/master/all_seller', {
            method:'POST',
            headers: {
                accept:'application/json',
                'Content-Type':'application/json',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({idMaster: master._id})
        })
        let data = await response.json();
        setSeller(data.list)
    }
    if(master && !Boolean(seller?.length)) allSeller();

    async function blockSeller(idSeller , btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                let btntext= btn.innerText
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/block_seller', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        idMaster: master._id,
                        idSeller: idSeller
                    })
                })
                let data = await response.json();
                alert(data.msg)
        
                btn.innerText = btntext;
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }

    }


    function filterSeller(value){
        let reg = new RegExp(value?.toLowerCase() || '');
        let filter = seller.filter(e => reg.test(e.user.toLowerCase()));
        let list = []
        filter.map(u => {
            let userBlock = u.grade.includes('sellerBlock');
            return list.push(
                <li className='flex-content' key={u.user}>
                   <span title="nome completo">{u.nome}</span>
                   <span title="username">{u.user}</span>
                   <span title="corsi attivi">{u.active_course}</span>
                   <span title="guadagno totale">{u.amount}</span>
                   <span>
                    {(userBlock)  ? <p title={"utente bloccato, aggiungilo nel campo \"aggiungi venditore\""}>utente bloccato</p> : <button onClick={e => {
                            e.preventDefault()
                            let confirm = prompt(`sei sicuro di voler bloccare "${u.user}" come venditore? digita: si`)
                            if(confirm !=='si') return ;
                            blockSeller(u._id, e.target)
                            }
                    }>Blocca venditore</button>}
                    
                    <a href={"../master/view/"+u._id} title="visita il profilo">profilo</a>
                   </span>
                   
                </li>
            )
        })
        setSellerList(list)
    }
    if(seller && !sellerList) filterSeller()
    
    return(
        <div className='dashbord-outlet'>
            <div>
                <h2>Sezione Stripe</h2>
                <SingleInput 
                    nome='newSeller'
                    label='aggiungi venditore tramite username' 
                    variabile={[newUserSeller, setNewUserSeller]} 
                    propInput={{type: 'text', minLength:3 ,maxLength:15, required:true }}
                    fetch={newSeller}
                />

                <div>
                    <p>lista venditori</p>
                    <form className='form-search'>
                        <label htmlFor='sellerSearch'>filtra per nome utente</label>
                        <input type="search" id="sellerSearch" name="sellerSearch" value={sellerSearch}
                            onChange={e => {setSellerSearch(e.target.value) ; filterSeller(e.target.value)}}
                        />
                        
                    </form>
                    {(seller) ?<Section
                        elementi={sellerList}
                        divisione={10}
                        down={true}
                        postoSezioni={[posto , setPostoSezioni]}
                    /> : <p>caricamento...</p>}
                    
                </div>
            </div>
        </div>
    )
}