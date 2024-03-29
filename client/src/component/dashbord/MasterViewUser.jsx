import { useEffect, useState } from "react";
import {useParams, Link} from 'react-router-dom';

import Sezione from '../Section';
import env from "react-dotenv";

async function downloadFile(href){
    try{
     let response = await fetch((env?.URL_SERVER || '') + '/api/download', {
         method: "POST",
         headers: {'Content-Type': 'application/json' },
         body: JSON.stringify({
             href: href,
         })
       })
     let data = await response.json();
     
 
     let fileTypeIndex = href.split('/').length -1;
     let fileType = href.split('/')[fileTypeIndex]
 
     const link = document.createElement("a");
     link.href = data.url;
     link.setAttribute("download", fileType); //or any other extension
     document.body.appendChild(link);
     link.click()    
     
 
 
     }catch(e){console.log(e)}
 };


 function User(params){
    let user = params.user

    if(!user) return <p>caricamento...</p>
    return(
            <div>
                <p>nome: {`${user.name.f} ${user.name.l}`}</p>
                <p>username: {user.user}</p>
                <p>data di nascita: {user?.date}</p>
                <p>email: {user.email}</p>
                <p>residenza: {`${user.address.c} , ${user.address.s} , ${user.address.cap}`}</p> 
            </div>
    )
}

function CourseUser(params){
    let user = params.user
    let course = params.course
    let [viewCourse , setViewCourse] = useState(); //contiene tutti i capitoli del corso scelto
    let [lezione, setLezione] = useState(<p>scegli lezione...</p>); //contiene la lezione scelta

    let [postoSezioni , setPostoSezioni] = useState(1) //per le lezioni
    let [postoCorsi, setPostoCorsi] = useState(1) //per i corsi
    
    
    async function courseBlock(idCorso , idStripe , btn){
    if(!btn.classList.contains('btn-pending')){
        try{
            let btntext= btn.innerText
            btn.innerText = '';
            btn.classList.add('btn-pending');
    
            let response= await fetch((env?.URL_SERVER || '') + '/api/master/block_course', {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    idCorso: idCorso,
                    idStripe: idStripe,
                })
            })
            let data = await response.json();
            alert(data.msg)
    
            btn.innerText = btntext;
            btn.classList.remove('btn-pending');
        }catch(e){console.log(e)}
    }
    }
    

    let listaCourse = []
    course?.map((e, index)=> {
    return listaCourse.push(
        <li className='flex-content' key={e.t +' - ' +index}>
            <span title='nome corso'>{e.t}</span>
            <span title='prezzo'>{(e.sale.o) ? 'scontato: '+ e.sale.o +' €' : 'prezzo: ' + e.sale.p + ' €'}</span>
            <span title='stato corso'>stato: {(e?.block || !e.s ) ? 'non attivo' : 'attivo'}</span>
            <span title='quantità venduta'>venduti: {e.ven?.length || 0}</span>
            <span>
                <button onClick={btn => {
                    btn.preventDefault();
                    courseBlock(e._id , e.idStripe ,btn.target)
                }}>{(e.block) ? 'Sblocca' : 'Blocca'} corso</button>
    
                <button onClick={btn => {
                    btn.preventDefault();
                    setViewCourse(e.chapter)
                }}>Vedi corso</button>
            </span>
            
            
        </li>
        )
    })
    
    let corso = []
    viewCourse?.map(e => {
        return corso.push(
            <li key={e.ma}>
                {e.ma}
                <ol>
                   {e.li_ma.map((cap , capIndex) => {
                        return(
                            <li key={cap.t+capIndex}>
                                {cap.t}
                                <ol>
                                    {cap.lesson.map((y , indexY) => 
                                        (<button key={indexY + '-'} index={y[1]} 
                                            onClick={e => {e.preventDefault(); caricaLezione(y[1])}}>
                                            {y[0]}
                                        </button>)
                                    )}
                                </ol>
                            </li>
                        )
                   })} 
                </ol>
                
            </li>
        )
    })

    async function caricaLezione(id){
        let response= await fetch((env?.URL_SERVER || '') + '/api/lesson/'+id, {
            method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
        })
        let data = await response.json();
        if(!data.success) return setLezione(<p>ricarica la pagina...</p>);
        let viewLezione
        if(data.lesson.l){ 
            viewLezione = (
                <div>
                    <iframe width="560" height="315" 
                    src={data.lesson.l}
                    title={data.lesson.n} frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    >
                    </iframe>
                </div>
                )
        }

        else if(Boolean(data.lesson.quiz.length)){
            
            let elementi = []
            for(let x = 0 ; x < data.lesson.quiz.length ; x++){

                let domanda = data.lesson.quiz[x];
                let risposte = []
                for(let y = 0 ; y < domanda.answere.length ; y++ ){
                    let risposta = domanda.answere[y]
                    risposte.push(
                        <div key={risposta.t + x} >
                            <span>{risposta.t}</span>
                        </div>
                    )
                }
                elementi.push(
                    <li key={'domanda'+x}>
                        {domanda.q}
                        <form>
                           {risposte}
                        </form>
                    </li>
                    
                )
            }

            viewLezione = (
                <div>
                    <Sezione divisione={3} 
                        elementi={elementi} 
                        down={true}  
                        postoSezioni={[postoSezioni , setPostoSezioni]}
                    /> 
                </div>
            )
           
            
            }
        else if(data.lesson.f){ 
            viewLezione = (
                <a href="/" onClick={e => {
                    e.preventDefault();
                    downloadFile(data.lesson.f);
                }}>
                    scarica pdf lezione
                </a>
            )
        }
        else{ viewLezione = (<p>questa lezione è vuota</p>);}

        setLezione(viewLezione)
    }


    return(
            <div>
                <p>CORSI</p>
                <Link to={"../../dashbord/crea-corso?user="+user._id}>Modifica un corso</Link>
                <Link to={"../../dashbord/crea-lezioni?user="+user._id}>Modifica una lezione</Link>
                {Boolean(listaCourse?.length) ? <Sezione
                    elementi={listaCourse}
                    divisione={10}
                    down={true}
                    postoSezioni={[postoCorsi, setPostoCorsi]}
                /> : null}
                
                {(Boolean(viewCourse?.length)) ? <div>{lezione}<ul>{corso}</ul></div> : null}
            </div>      
    )
}

function SimulationUser(params){
    let user = params.user
    let simulations = params.simulations
    const [postoSimulazioni, setPostoSimulazioni] = useState(1);
    async function simulationBlock(idSimulation , btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                let btntext= btn.innerText
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/block_simulation', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({ idSimulation: idSimulation})
                })
                let data = await response.json();
                alert(data.msg)
        
                btn.innerText = btntext;
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }
        }

    let listaSimulation = []
    simulations?.map((e, index)=> {
        let hit = Number(e.hit?.e || 0) +  Number(e.hit?.h || 0)
    return listaSimulation.push(
        <li className='flex-content' key={e.n +' - ' +index}>
            <span title='nome simulazione'>{e.n}</span>
            <span title='stato corso'>stato: {(e?.block || !e.s ) ? 'non attivo' : 'attivo'}</span>
            <span title='quante volte è stata fatta'>tentativi svolti: {hit} </span>
            <span>
                <button onClick={btn => {
                    btn.preventDefault();
                    simulationBlock(e._id , btn.target)
                }}>{(e.block) ? 'Sblocca' : 'Blocca'} simulazione</button>
    
            </span>
            
            
        </li>
        )
    })
    return (
            <div>
                <p>SIMULAZIONI</p>
                <Link to={"../../dashbord/crea-simulazioni?user="+user._id}>Modifica una simulazione</Link>
                {Boolean(listaSimulation?.length) ? <Sezione
                    elementi={listaSimulation}
                    divisione={10}
                    down={true}
                    postoSezioni={[postoSimulazioni, setPostoSimulazioni]}
                /> : null}
            </div>
    )
}

function DeckUser(params){
    let user = params.user
    let deck = params.deck
    const [postoDeck, setPostoDeck] = useState(1);

    async function deckBlock(idDeck , btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                let btntext= btn.innerText
                btn.innerText = '';
                btn.classList.add('btn-pending');
        
                let response= await fetch((env?.URL_SERVER || '') + '/api/master/block_deck', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({ idDeck: idDeck})
                })
                let data = await response.json();
                alert(data.msg)
        
                btn.innerText = btntext;
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }
        }

    let listaDeck = []
    deck?.map((e, index)=> {
    return listaDeck.push(
        <li className='flex-content' key={e.t +' - ' +index}>
            <span title='nome deck'>{e.t}</span>
            <span title='stato deck'>stato: {(e?.block || !e.s ) ? 'non attivo' : 'attivo'}</span>
            <span title='prezzo attuale'>{e.outlet > 0 ? 'in sconto a: '+ e.outlet  : e.price} €</span>
            <span title='quante volte è stato comprato'> {e.nBuy} </span>
            <span>
                <button onClick={btn => {
                    btn.preventDefault();
                    deckBlock(e._id , btn.target)
                }}>{(e.block) ? 'Sblocca' : 'Blocca'} Deck</button>
    
            </span>
            
            
        </li>
        )
    })
    return (
            <div>
                <p>Deck</p>
                <Link to={"../../dashbord/card?user="+user._id}>Modifica un deck</Link>
                {Boolean(listaDeck?.length) ? <Sezione
                    elementi={listaDeck}
                    divisione={10}
                    down={true}
                    postoSezioni={[postoDeck, setPostoDeck]}
                /> : null}
            </div>
    )
}

export default function MasterViewUser(){
    let [user , setUser] = useState(null);
    let [course, setCourse] = useState(null);
    let [simulations , setSimulations] = useState(null);
    let [decks , setDecks] = useState(null);
    const [courseBuy, setCourseBuy] = useState(undefined);
    let param = useParams();
    
    useEffect(()=>{
        let getUser = async ()=>{
            let response = await fetch((env?.URL_SERVER || '') + '/api/user/getuser', {
                method: 'POST',
                headers:{
                    accept:'application/json',
                    'Content-Type': 'application/json',
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({id: param.user})
            })
            let data = await response.json()
            
            if(data.user.grade.find(x => x === 'course')) getCourse();
            if(data.user.grade.find(x => x === 'simulation' || 'simulationBlock')) getSimulation()
            if(data.user.grade.find(x => x === 'card')) getDeck();
            if(data.success){ 

                if(data.courseName.length > 0) setCourseBuy(data.courseName)
            }


            if(data.success) setUser(data.user);
        }
        getUser()
    },[])

    async function getCourse(){
        let response = await fetch((env?.URL_SERVER || '') + '/api/corsi/corsi_user', {
            method: 'POST',
            headers:{
                accept:'application/json',
                'Content-Type': 'application/json',
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({id: param.user})
        })
        let data = await response.json();
        if(data.success){  setCourse(data.data)
        }else{ setCourse([])}

    }

    async function getSimulation(){
        let response = await fetch((env?.URL_SERVER || '') + '/api/simulation/simulation_user', {
            method: 'POST',
            headers:{
                accept:'application/json',
                'Content-Type': 'application/json',
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({id: param.user})
        })
        let data = await response.json();
        if(data.success){ setSimulations(data.simulations)
        }else{ setSimulations([])}
    }

    async function getDeck(){
        let response = await fetch((env?.URL_SERVER || '') + '/api/card/getDeckForMaster', {
            method: 'POST',
            headers:{
                accept:'application/json',
                'Content-Type': 'application/json',
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({id: param.user})
        })
        let data = await response.json();
       
        if(data.success){ setDecks(data.deck)
        }else{ setDecks([])}
    }

    async function deliteUserCourse(index , btn){
        let sicuro = prompt('sicuro di voler cancellare il corso a questo utente , digita "si"')
        if(sicuro.toLowerCase() === 'si'){
            if(!btn.classList.contains('btn-pending')){
                let textBtn = btn.innerHTML;
                btn.classList.remove('btn-pendding');

                fetch((env?.URL_SERVER || '' ) + '/api/master/delite_user_course' , {
                    method : 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        userId: user._id,
                        courseId: courseBuy[index][1]
                    })
                })
                .then(jsonD => {return jsonD.json()})
                .then(response =>{
                    if(response.success){

                        courseBuy.splice(index, 1);
                        setCourseBuy(...courseBuy);
                        
                    }else{
                        alert(response.msg);
                    }
    
                    btn.classList.remove('btn-pendding');
                    btn.innerHTML = textBtn;
                })
            }
        }
    }



    
    return(
        <div>
            <h1>Vedi utente</h1>
            <User user={user}/>
            {(course && user.grade.includes('course')) ? <CourseUser user={user} course = {course}/> : undefined}
            {(simulations && (user.grade.includes('simulation') || user?.grade?.includes('simulationBlock'))) ? <SimulationUser user={user} simulations = {simulations}/> : undefined}
            {(decks && user.grade.includes('card'))? <DeckUser user={user} deck = {decks}/> : undefined}
            
            {(courseBuy)
            ?
            <div>
                <p>corsi posseduti</p>
                <ul>
                    {
                    courseBuy.map((course, index) => {

                        return (
                            <li key={course[0]}>
                                {course[0]}
                                <button onClick={(e) => {e.preventDefault() ; deliteUserCourse(index, e.target)}}>
                                    ellimina corso all'utente</button>
                                
                            </li>
                        )
                    })
                    }
                </ul>

            </div>
                


            :undefined}
        </div>
        
    )
}



