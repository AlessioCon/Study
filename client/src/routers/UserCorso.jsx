import {useEffect , useState} from 'react';
import {useParams} from 'react-router-dom';

import Sezioni from '../component/Section';
import Cookie from '../customHook/cookie'
import Room from '../component/course/Room'
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
     let blobPdf = await response.blob();
   
     let fileTypeIndex = href.split('\\')
     let fileType = fileTypeIndex[fileTypeIndex.length -1]

     const reader = new FileReader();
     reader.readAsDataURL(blobPdf);

     reader.onload = () =>{    
        const link = document.createElement("a");
        link.href = reader.result;
        link.setAttribute("download", fileType); //or any other extension
        document.body.appendChild(link);
        link.click()                           
    }
     }catch(e){console.log(e)}
};



async function responseControl(risposte ,idLesson, idCourse){
    try{
        let res = await fetch((env?.URL_SERVER || '' ) + '/api/corsi/answersControl', {
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
const [punti , setPunti] = useState([]);
const [postoSezioni, setPostoSezioni] = useState(1);
const [categoria, setCategoria] = useState(0);

let param = useParams();

    useEffect(()=>{
        
        let getCourse = async () =>{
        
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + `/api/user/haveCourse/${param.idUser}/${param.idCorso}`, {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(!data.success) return;
//setta il punteggio per ogni categoria e salva i progressi 
                if(data.progress){
                    writePoint(data.course, data.progress)
                    setProgress(data.progress);
                }
                return setCorso(data.course); 

            }catch(e){console.log(e);}
        }
        
        if(!corso) getCourse();

    }, [corso])

    function CorsoDisplay (){
        
        /*lista corso*/
        let listCourse = [];
        corso.chapter.map((materia , matIndex) => {
            let listCapitoli = []
            let progresesCap = progress?.find(p => p.name === materia.ma);
            materia.li_ma.map((capitolo, capIndex) => {
                let listLezioni = []

                capitolo.lesson.map((lesson , lesIndex) => {
                    let progresesLesson = undefined;
                    if(progresesCap) progresesLesson = progresesCap.lesson?.find(l => l.idL === lesson[1]);

                    listLezioni.push(
                        <li key={`${lesson[0]}-${lesIndex}`}>
                            <button 
                                onClick={e => {
                                    e.preventDefault();
                                    findLesson(lesson[1] , materia.ma, matIndex, capIndex, lesIndex)
                                    if(punti[matIndex] < capitolo.u) alert('attenzione per questo capitolo sono previsti più punti, completa le lezioni dei capitoli precedenti prima di avanzare')
                                }}
                            >
                            {lesson[0]}</button>
                            {(progresesLesson)? <span>✅</span>: <span>⭕</span>}
                        </li>
                    )

                })

                listCapitoli.push(
                    <li key={`${capitolo.t}-${capIndex}`}>
                        {capitolo.t}
                        {(capitolo.u) ? <p>punti necessari {capitolo.u}</p> : undefined}
                        <ol>
                            {listLezioni}
                        </ol>
                    </li>
                )
            })
            listCourse.push(
                <li key={materia.ma + matIndex}>
                    {materia.ma}
                    <ol>
                        {listCapitoli}
                    </ol>
                </li>
            )
        })


        /*display lezione*/
        let lezioneDisplay = []
        //ritrovo lezione
        function findLesson (idLezione , materia , matIndex, capIndex, lesIndex) {
            
            async function fetchlesson(){
                let response = await fetch((env?.URL_SERVER || '' ) + '/api/corsi/findLesson', {
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
                setLezione([data.lesson , matIndex, capIndex, lesIndex ]);
                writeAnswere([data.lesson , matIndex, capIndex, lesIndex ])
                
                
            } 
            fetchlesson();
            if(materia !== categoria) setCategoria(materia)
        }

        if(lezione){
            let tipo;
            //video
            if(lezione[0].l){ 
                tipo = (
                    <div>
                        <iframe width="560" height="315" 
                        src={lezione[0].l}
                        title={lezione[0].n} frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        >
                        </iframe>
                        <button onClick={(e) => {
                            e.preventDefault();
                            saveProgress(categoria, lezione[0]._id);
                        }}>Visto</button>
                    </div>
                    )
            }
            //quiz
            else if(Boolean(lezione[0].quiz.length)){
                
                if(Boolean(domande.length) && controlAnswers === true){
                    responseControl(domande , lezione[0]._id)
                    .then(data => setControlAnswers(data));
                }

                let elementi = []

                lezione[0].quiz.map((dom, domIndex) => {

                    let listRisposte = [];
                    dom.answere.map((ris, risIndex) => {
                        listRisposte.push(
                            <div key={ris.t + risIndex} >
                                <label htmlFor={ris.t + risIndex}>{ris.t}</label>
                                <input id={ris.t + risIndex} name={'domanda'+domIndex} value={ris.t}
                                checked={(domande?.[domIndex] === risIndex) ? true : false }
                                type="radio"
                                onChange={e => {
                                    //rientreare in modalità fai test
                                    if(controlAnswers){
                                        setControlAnswers(null);
                                        setDomande([]);
                                    }

                                    //inizzializzazione domande (riempimento a -1 [non risposto])
                                    if(domande.length !== lezione[0].quiz.length){
                                        let domandeInizio = []
                                        for(let numero = 0 ; numero < lezione[0].quiz.length; numero++ ){
                                            domandeInizio.push(-1)
                                        }
                                        domandeInizio[domIndex] = risIndex
                                        setDomande(domandeInizio)
                                    }else{
                                        let newDomande = Object.values(domande)
                                        newDomande[domIndex] = risIndex;
                                        setDomande(newDomande)
                                    }
                                }}
                                />
                            </div>
                        )
                    })
                    elementi.push(
                        <li key={dom.q+domIndex}>
                            {dom.q}
                           <form>
                              {listRisposte}
                           </form>
                           {(controlAnswers) ? createMsgAnswer(elementi.length, controlAnswers[elementi.length]) : undefined}
                       </li>
                    )

                })

                tipo = (
                    <div>
                        <Sezioni divisione={3} 
                            elementi={elementi} 
                            down={true}  
                            postoSezioni={[postoSezioni , setPostoSezioni]}
                        /> 
                        <button onClick={(e) => {
                            e.preventDefault() ; 
                            saveProgress(categoria, lezione[0]._id, domande);
                            responseControl( domande , lezione[0]._id, corso._id ).then(data => setControlAnswers(data))
                        }}>
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
            //file
            else if(lezione[0].f){ 
                tipo = (
                    <a href="/" onClick={e => {
                        e.preventDefault();
                        downloadFile(lezione[0].f);
                        saveProgress(categoria ,lezione[0]._id)
                    }}>
                        scarica pdf lezione
                    </a>
                )
            }
            else{ tipo = (<p>questa lezione è vuota</p>);}

            lezioneDisplay.push(
                <div key="lezione">
                    <p>{lezione[0].n}</p>
                    {tipo}
                    <p>{lezione[0].d}</p>
                    {(lezione[0].l) ? <Room room={lezione[0].n}/> : undefined}
                </div>
            )
        }else{ lezioneDisplay = (<p>seleziona una lezione</p>)}




        //salva progressi lezione
        async function saveProgress(materia , idLesson , answere = []){
            try{
                let res = await fetch((env?.URL_SERVER || '') + '/api/corsi/saveProgress', {
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
                        answere: answere,
                        categoria: materia
                    })
                })
                let data = await res.json();
                if(!data.success) return alert('lezione non salvata , ricarica la pagina');
                reloadPoint();

            }catch(e){if(e) console.log(e);}
        }

        //ricarica i progressi fatti
        async function reloadPoint(){
            try{
                let response = await fetch((env?.URL_SERVER || '' ) + `/api/user/haveCourse/${param.idUser}/${param.idCorso}`, {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(!data.success) return;
                writePoint(corso, data.progress)
                setProgress(data.progress)
    
            }catch(e){console.log(e);}
        }

        function writeAnswere(lesson = undefined){
            let lez = lesson || lezione;
            let checkProgress = progress?.[lez[1]]?.lesson?.find( x => x.idL === lez[0]._id)?.['an'];
            if(checkProgress){setDomande(checkProgress) ; setControlAnswers(true)}
            else{setDomande([]); setControlAnswers(false)}
                

        }

        //crea msg per quiz
        function  createMsgAnswer(indexDomanda , risposta){
            if(Boolean(risposta)){
                return <p>hai risposto correttamente</p>
            }
            return (
                <div>
                    <p>rispostra sbagliata</p>
                    <p>{lezione[0].quiz[indexDomanda].c}</p>
                </div>)
        }

        function statistiche() {
            if(Boolean(progress.length)){
                let listStatistiche= []
                progress.map((mat, matIndex) =>{
                  let p = 0;
                  mat.lesson.map(point => p += point.p || 0);
                  listStatistiche.push(<p key={mat.name+ matIndex}>{mat.name}: {p}</p>)
                })
                return (
                    <div>
                        {listStatistiche}
                    </div>
                )

            }else{
                return <p>statistiche a 0</p>
            }
        }
        return (
            <div>
                {(categoria) ? <p>punteggio {categoria}: {punti[corso.chapter.findIndex(x => x.ma === categoria)]}</p> : undefined}
                <div className='col_2'>
                    <div>{lezioneDisplay}</div>
                    <div>
                        <ul>
                            {listCourse}
                        </ul>
                    </div>
                    
                </div>
                <div>
                    <h2>statistiche</h2>
                    {statistiche()}
                </div>
            </div>
        )
    
    }
    function writePoint(course , progreses){
        let newPunti = []
        course.chapter.map(x => newPunti.push(0))
        progreses.map((materie , matIndex) => {
            materie?.lesson?.map(less => {
                
                if(less?.p && parseInt(less.p) !== NaN) newPunti[matIndex] += parseInt(less.p);
            })
        })
        setPunti(newPunti);
    }

    return((corso) ? <CorsoDisplay/> : <p>caricamento...</p>)
}
