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
            <span title='quantità venduta'>venduti: {e.ven.ul.length}</span>
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
        console.log(e)
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
            <p>nome: {`${user.name.f} ${user.name.l}`}</p>
            <p>username: {user.user}</p>
            <p>data di nascita: {user?.date}</p>
            <p>email: {user.email}</p>
            <p>residenza: {`${user.address.c} , ${user.address.s} , ${user.address.cap}`}</p>

            <p>corsi</p>
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



export default function MasterViewUser(){
    let [user , setUser] = useState(null);
    let [course, setCourse] = useState(null)
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
            if(data.success) setUser(data.user)
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
        if(data.success){ setCourse(data.data)
        }else{ setCourse([])}
    }
    if(user && !course) getCourse();


    
    return(
        <div>
            <h1>Vedi utente</h1>
            {(user) ? <User user={user} course={course}/> : null}
        </div>
        
    )
}