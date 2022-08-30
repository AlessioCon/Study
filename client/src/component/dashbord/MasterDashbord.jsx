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


    let [newCreatorSemulation, setNewCreatorSemulation] = useState('');
    let [simulator, setSimulator] = useState() //valore grezzo di tutti i creatori di simulazioni (non formattato in html)
    let [simulatorList, setSimulatorList] = useState(null) //lista formattata in html di tutti ivenditori
    let [simulatorSearch, setSimulatorSearch] = useState('')

    let [posto , setPostoSezioni] = useState(1) //per sellerlist
    let [postosSim, setPostoSim] = useState(1) //per simululatorList

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
            let data = await response.json();
            if(!data.success) return(<p>caricamento...</p>) 
            allSeller(data.user._id);
            allCreatorSimulation(data.user._id)
            setMaster(data.user)
        }
        if (master === null) getMaster();
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
    async function newSimulator(update, info, btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/new_simulator', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        idMaster: master._id,
                        user: info,
                    })
                })
                let data = await response.json();
                alert(data.msg)
        
                btn.innerText = 'salva';
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }
        
    }

    async function allSeller(idMaster){
        let response = await fetch((env?.URL_SERVER || '') + '/api/master/all_seller', {
            method:'POST',
            headers: {
                accept:'application/json',
                'Content-Type':'application/json',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({idMaster: idMaster})
        })
        let data = await response.json();
        setSeller(data.list)
    }
    async function allCreatorSimulation(idMaster){
        let response = await fetch((env?.URL_SERVER || '') + '/api/master/all_creatorSimulatior', {
            method:'POST',
            headers: {
                accept:'application/json',
                'Content-Type':'application/json',
                'Access-Control-Allow-Credentials': true
            },
            body: JSON.stringify({idMaster: idMaster})
        })
        let data = await response.json();
        setSimulator(data.list);
    }




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

    async function blockCreatoreSimulator(idUser , btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                let btntext= btn.innerText
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/block_creator_simulaton', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        idMaster: master._id,
                        idUser: idUser
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

    function filterSimulator(value){
        let reg = new RegExp(value?.toLowerCase() || '');
        let filter = simulator.filter(e => reg.test(e.user.toLowerCase()));
        let list = []
        filter.map(u => {
            let userBlock = u.grade.includes('simulationBlock');
            return list.push(
                <li className='flex-content' key={u.user+'simulator'}>
                   <span title="nome completo">{u.nome}</span>
                   <span title="username">{u.user}</span>
                   <span title="corsi attivi">{u.active_simulation}</span>
                   <span>
                    {(userBlock)  ? <p title={"utente bloccato, aggiungilo nel campo \"aggiungi creatore di simulazioni\""}>utente bloccato</p> : <button onClick={e => {
                            e.preventDefault()
                            let confirm = prompt(`sei sicuro di voler bloccare "${u.user}" come creatore di simulazioni? digita: si`)
                            if(confirm !=='si') return ;
                            blockCreatoreSimulator(u._id, e.target)
                            }
                    }>Blocca creatore</button>}
                    
                    <a href={"../master/view/"+u._id} title="visita il profilo">profilo</a>
                   </span>
                   
                </li>
            )
        })
        setSimulatorList(list)
    }
    if(simulator && !simulatorList) filterSimulator()
    
    return(
        <div className='dashbord-outlet'>
            <div>
                <h2>Sezione Corsi</h2>
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
            <div>
                <h2>Sezione Simulazioni</h2>
                <SingleInput
                    nome="newSimulation"
                    label="aggiungi creatore di sumulazioni tramite username"
                    variabile={[newCreatorSemulation, setNewCreatorSemulation]}
                    propInput={{type: 'text', minLength:3, maxLength:15, required:true}}
                    fetch={newSimulator}
                />

                <div>
                    <p>lista creatori di simulazioni</p>
                    <form className='form-search'>
                        <label htmlFor='simulatorSearch'>filtra per nome utente</label>
                        <input type="search" id="simulatorSearch" name="simulatorSearch" value={simulatorSearch}
                            onChange={e => {setSimulatorSearch(e.target.value) ; filterSimulator(e.target.value)}}
                        />
                        
                    </form>
                    {(simulator) ?<Section
                        elementi={simulatorList}
                        divisione={10}
                        down={true}
                        postoSezioni={[postosSim, setPostoSim]}
                    /> : <p>caricamento...</p>}
                    
                </div>

            </div>
        </div>
    )
}