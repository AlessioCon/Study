import {useEffect , useState} from 'react';
import {useParams} from 'react-router-dom';

import Sezioni from '../component/Section';
import Cookie from '../customHook/cookie'
import Room from '../component/course/Room'
import env from "react-dotenv";


async function downloadFile(href){
    try{
     let response = await fetch((env.URL_SERVER || '') + '/api/download', {
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



async function responseControl(risposte ,idLesson, idCourse){
    try{
        let res = await fetch((env.URL_SERVER || '') + '/api/corsi/answersControl', {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
                },
            body: JSON.stringify({ 
                answere : risposte , 
                idLesson: idLesson , 
                idUser: Cookie.getCookie('user')._id,
                idCourse: idCourse
            })
        })
        let data = await res.json();
        if (!data.success) return alert('qualcosa è andato storto nella correzione ,ricarica la pagina');
        let corrette = data.data ;
        

        let responso = []
        corrette.map((el , index) => {
            if(el === risposte[index]) return responso.push(1) ;
            return responso.push(0)
        })
        
        return responso;

    }catch(e){ if(e) console.log(e);}
}



export default function UserCorso(){
const [corso , setCorso] = useState();
const [lezione, setLezione] = useState(null);
const [domande, setDomande] = useState([])//risposte date live
const [controlAnswers , setControlAnswers] = useState(false); //controllo risposte un buleano
const [progress , setProgress] = useState([]);
const [punti , setPunti] = useState(0);
const [postoSezioni, setPostoSezioni] = useState(1);

let param = useParams();

    useEffect(()=>{
        let getCourse = async () =>{
            try{
                let response = await fetch((env.URL_SERVER || '') + `/user/haveCourse/${param.idUser}/${param.idCorso}`, {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(!data.success) return;
                if(Boolean(data.progress.length)) {
                    let puntiFatti = 0
                    data.progress.map(e => {
                        if(e?.p)  puntiFatti += e.p;
                    })
                    if(puntiFatti) setPunti(puntiFatti);
                    setProgress(data.progress)};
                return setCorso(data.course);
                
    
            }catch(e){console.log(e);}
        }
        
        if(!corso) getCourse();

    }, [corso])

    function CorsoDisplay (){

        let chapter = []
        if(corso?.chapter){
            for(let capIndex = 0 ; capIndex < corso.chapter.length ; capIndex++){
                let cap = corso.chapter[capIndex];
                let lessonList = []

                for(let lessIndex = 0 ; lessIndex < cap.lesson.length ; lessIndex++){

                    let lezioneFatta = progress?.find(e => cap.lesson?.[lessIndex]?.[1] === e.idL);

                    lessonList.push(
                        <li key={'lezione'+ lessonList}
                            onClick={(e) => {
                            
                            e.preventDefault()
                            if((cap?.u && cap?.u <= punti) || !cap?.u ){ findLesson(capIndex, lessIndex)};
                            }}
                        >
                        {cap.lesson?.[lessIndex]?.[0]}

                        {(lezioneFatta) ? <span>fatta</span> : <span>da fare</span>}
                        </li>
                    )
                }
                chapter.push(
                    <li key={cap.t+capIndex}>
                    {(cap?.u) ? <span>{cap.u}</span> : null}
                    {cap.t}
                    <ul>
                        {lessonList}
                    </ul>
                </li>
                )
            }
        }

        let lezioneDisplay = []
        //ritrovo lezione
        function findLesson (capIndex, lessIndex) {
            let idLezione = corso.chapter[capIndex].lesson[lessIndex][1];
            async function fetchlesson(){
                let response = await fetch((env.URL_SERVER || '') + '/api/corsi/findLesson', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                        },
                    body: JSON.stringify({ lezione: idLezione , idUser: Cookie.getCookie('user')._id})
                })
                let data = await response.json();

                if (!data.success) return alert('errore nel caricare la lezione');
                let checkProgress = progress.find(e => e.idL === data.lesson._id)?.['an']
                if(checkProgress){setDomande(checkProgress) ; setControlAnswers(true)};
                setLezione(data.lesson);
            } 
            fetchlesson();

        }

        function  createMsgAnswer(indexDomanda , risposta){
            if(Boolean(risposta)){
                return <p>hai risposto correttamente</p>
            }
            return (
                <div>
                    <p>rispostra sbagliata</p>
                    <p>{lezione.quiz[indexDomanda].c}</p>
                </div>)
        }
        
        async function saveProgress(idLesson , answere = []){
            try{
                let res = await fetch((env.URL_SERVER || '') + '/api/corsi/saveProgress', {
                    method: 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({ 
                        idLesson: idLesson, 
                        idUser : Cookie.getCookie('user')._id, 
                        idCourse: corso._id,
                        answere: answere
                    })
                })
                let data = await res.json()
                if(!data.success) return alert('lezione non salvata , ricarica la pagina');
                if(!progress?.find(e => e.idL === idLesson)){
                    let newValue = Object.values(progress);
                    newValue.push({
                        idL : idLesson,
                        an : answere
                    })
                    setProgress(newValue)
                }
                window.location.reload()

            }catch(e){if(e) console.log(e);}
        }


        //costruisci e mostra lezione
        if(lezione){
            let tipo;
            if(lezione.l){ 
                tipo = (
                    <div>
                        <iframe width="560" height="315" 
                        src={lezione.l}
                        title={lezione.n} frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        >
                        </iframe>
                        <button onClick={(e) => {
                            e.preventDefault();
                            saveProgress(lezione._id);

                        }}>Visto</button>
                    </div>
                    )
            }

            else if(Boolean(lezione.quiz.length)){
                
                if(Boolean(domande.length) && controlAnswers === true){
                    responseControl(domande , lezione._id)
                    .then(data => setControlAnswers(data));
                }

                let elementi = []
                for(let x = 0 ; x < lezione.quiz.length ; x++){

                    let domanda = lezione.quiz[x];
                    let risposte = []
                    for(let y = 0 ; y < domanda.answere.length ; y++ ){
                        let risposta = domanda.answere[y]
                        risposte.push(
                            <div key={risposta.t + x} >
                                <label htmlFor={risposta.t + x}>{risposta.t}</label>
                                <input id={risposta.t + x} name={'domanda'+x} value={risposta.t}
                                checked={(domande?.[x] === y) ? true : false }
                                type="radio"
                                onChange={e => {
                                    //rientreare in modalità fai test
                                    if(controlAnswers){
                                        setControlAnswers(null);
                                        setDomande([]);
                                    }

                                    //inizzializzazione domande (riempimento a -1 [non risposto])
                                    if(domande.length !== lezione.quiz.length){
                                        let domandeInizio = []
                                        for(let numero = 0 ; numero < lezione.quiz.length; numero++ ){
                                            domandeInizio.push(-1)
                                        }
                                        domandeInizio[x] = y
                                        setDomande(domandeInizio)
                                    }else{
                                        let newDomande = Object.values(domande)
                                        newDomande[x] = y;
                                        setDomande(newDomande)
                                    }
                                }}
                                />
                            </div>
                        )
                    }
                    elementi.push(
                        <li key={'domanda'+x}>
                            {domanda.q}
                            <form>
                               {risposte}
                            </form>
                            {(controlAnswers) ? createMsgAnswer(elementi.length, controlAnswers[elementi.length]) : null}
                        </li>
                        
                    )
                }

                tipo = (
                    <div>
                        <Sezioni divisione={3} 
                            elementi={elementi} 
                            down={true}  
                            postoSezioni={[postoSezioni , setPostoSezioni]}
                        /> 
                        <button onClick={(e) => {
                            e.preventDefault() ; 
                            saveProgress(lezione._id, domande);
                            responseControl( domande , lezione._id, corso._id ).then(data => setControlAnswers(data))}}>
                                controlla
                        </button>
                        <button onClick={(e) => {
                            e.preventDefault() ; 
                            setControlAnswers(null);
                            setDomande([]);
                            }}>
                                riprova
                        </button>
                    </div>
                )
               
                
                }
            else if(lezione.f){ 
                tipo = (
                    <a href="" onClick={e => {
                        e.preventDefault();
                        downloadFile(lezione.f);
                        saveProgress(lezione._id)
                    }}>
                        scarica pdf lezione
                    </a>
                )
            }
            else{ tipo = (<p>questa lezione è vuota</p>);}


            lezioneDisplay.push(
                <div key="lezione">
                    <p>{lezione.n}</p>
                    {tipo}
                    <p>{lezione.d}</p>
                    <Room room={lezione.n}/>
                </div>
            )
        }else{
            lezioneDisplay = (<p>seleziona una lezione</p>)
        }
        
        console.log(punti)

        return (
        <div>
            <p>il tuo punteggio {punti}</p>
            <div className='col_2'>
                <div>{lezioneDisplay}</div>
                <div>
                    <ul>
                        {chapter}
                    </ul>
                </div>
                
            </div>

        </div>
            
            )
    } 

    return((corso) ? <CorsoDisplay key='corso'/> : <p>caricamento...</p>)
}
