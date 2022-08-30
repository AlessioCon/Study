import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Section from "../component/Section"
import MultiSection from "../component/MultiSection"

import env from "react-dotenv";

import Cookie from "../customHook/cookie"


export default function PlaySimulation(){
    const [simulation, setSimulation] = useState(undefined);
    const [filter, setFilter] = useState([]);
    const [posto, setPosto] = useState(1);
    const [saveAns , setSaveAns] = useState(undefined);
    const [segnalaDom , setSegnalaDom] = useState(undefined)
    const [showCom , setShowCom] = useState(undefined)//per mostrare commenti

    let timer = useRef(['00','00','00']);
    let timerRevers = useRef(['00','00','00']);
    let timerInterval = useRef(false)
    const [timerUpdate, setTimerUpdate] = useState('00:00:00');

    const [stop, setStop] = useState(false); //stoppa la simulazione nel casso fosse finito il tempo o l'utente finisce
    const [correction, setCorrection] = useState(undefined);
    const [userMaterie, setUserMaterie] = useState(undefined);//percentuale di risposte esatte per materia
    const [clickDom, setClickDom] = useState(undefined); //percentuale di quante volte gli utenti hanno dato una risposta
    const [postoCorrecton , setPostoCorrecton] = useState([1, 1])
    let risposte = useRef({})  //risposte date dall'utente
    

    let param = useParams();
    param.name = param.nameSim.replace(/%20/, 'g');


    let mod = useRef(Boolean(Number(new URLSearchParams(window.location.search).get('time'))));//modalita easy o hard
    function timeDown(){

    //modalità con timer
    if(mod.current){
        let [ore , minuti , secondi] = timer.current;
        secondi = Number(secondi) - 1;
        minuti = Number(minuti);
        ore = Number(ore);

        if(secondi <= 0){
            if(minuti <= 0){
                if(ore <=0){
                    startCorrecton();
                    setStop(true)
                    clearInterval(timerInterval.current);
                }else{
                    ore = ore - 1;
                    minuti = '60';
                    secondi = '60';
                }
            }else{
                minuti = minuti - 1;
                secondi = '60';
            }
       }

       
       if(secondi <= 9) secondi = '0'+secondi;
       if(minuti <= 9)  minuti = '0'+minuti;
       if(ore <= 9)     ore = '0'+ore;

       timer.current = [ore, minuti, secondi];
       setTimerUpdate(`${ore}:${minuti}:${secondi}`);
    }

    let [oreR , minR, secR] = timerRevers.current ; //per stabilire il tempo impiegato

    secR = Number(secR) + 1;
    minR = Number(minR);
    oreR = Number(oreR);
       
    if(secR >= 60){
        secR = 0;
        minR = minR + 1
    }

    if(minR >= 60){
        minR = 0;
        oreR = oreR + 1
    }


    if(secR <= 9)    secR = '0'+secR;
    if(minR <= 9)    minR = '0'+minR;
    if(oreR <= 9)    oreR = '0'+oreR;
      
    
    timerRevers.current = [oreR, minR, secR]
    
    }


    useEffect(()=>{
        async function getSimulation(){
            let respons = await fetch((env?.URL_SERVER || '' )+ '/api/simulation/simulations/'+param.nameSim,{
                method: 'GET',
                header: {
                    accept:'application/json',
                    'Content-type':'application/json',
                    'Access-Control-Allow-Credentials': true
                }
            })
            let data = await  respons.json();
            setSimulation(data.data);
            if(Boolean(data.data?.chapter?.length)){
                let segnalaMat = []
                let materie = []
                data.data.chapter.map(mat => {
                    //per filtro
                    materie.push({name: mat.ma, active: 'active' , dom: Array.from(mat.quiz, x=> 'active')});

                    //per segnalazione domanda e per stato commento
                    segnalaMat.push({n: mat.ma , a: []})

                });
                setFilter(materie);
                setSegnalaDom(segnalaMat);
                setShowCom(segnalaMat)
                setPostoCorrecton(data.data.chapter.map(x => 1));
            }
        }
        getSimulation();

    }, [])

    async function startCorrecton(){
        let respons = await fetch((env?.URL_SERVER || '' )+ '/api/simulation/correction',{
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                userId: Cookie.getCookie('user')._id,
                simId: simulation._id,
                resp: risposte.current,
                mod: mod.current,
                time: timerRevers.current
            })
        })
        let data = await  respons.json();
        if(!data.success) return alert('la correzione non è andata a buon fine , ricarica la pagina')
        setUserMaterie(data.percentualeUser);
        setCorrection(data.correction);
        setClickDom(data.p);
    }

    async function saveAnswere(materia , domanda){
        let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/save_answere', {
            method: 'PUT',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                simId: simulation._id,
                indexMat: materia,
                indexDom: domanda,
                userId: Cookie.getCookie('user')._id
            })
        })
        let data = await response.json();
        alert(data.msg)
        if(data.success){
            if(data.cancell){
                let indexDomanda =  saveAns[materia].a.findIndex(x => x === domanda)
                saveAns[materia].a.splice(indexDomanda , 1);
            }else{
                if(!saveAns?.[materia]) saveAns[materia] = {n: simulation.chapter[materia].ma , a: []};
                saveAns[materia].a.push(domanda);
            }
            setSaveAns([...saveAns])
        }
    }

    async function segnalaDomanda(materia , domanda , msg){

        let response = await fetch((env?.URL_SERVER || '' ) + '/api/mail/userToUser', {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                userFrom: Cookie.getCookie('user')._id,
                userTo: simulation.access.c
            })
        })
        let data = await response.json();
        if(data.success){
            let linkmail = "mailto:"+data.userTo
            + "?subject=" + encodeURIComponent("segnalazione domanda")
            + "&body=" + encodeURIComponent(`
            motivo: ${msg}
            la simulazione è " ${simulation.n} "  
            la materia è " ${simulation.chapter[materia].ma} " 
            la domanda è la numero " ${domanda+1} "`);

            const link = document.createElement("a");
            link.href = linkmail
            //link.setAttribute("download", fileType); //or any other extension
            document.body.appendChild(link);
            link.click()

            let indexDomanda = segnalaDom[materia].a.findIndex(x => x === domanda);
            
            if( indexDomanda !== -1){
                alert('hai gia segnalato la domanda, grazie!');
            }else{
                segnalaDom[materia].a.push(domanda);
            }
            setSegnalaDom([...segnalaDom])
            
    
        }else{alert('qualcosa è andato storto')}

        
       

        
    }

    async function showCommentDom(materia , domanda , msg){
        
        let indexDomanda = showCom[materia].a.findIndex(x => x === domanda);
           
        if( indexDomanda !== -1){
            showCom[materia].a.splice(indexDomanda , 1);
        }else{
            showCom[materia].a.push(domanda);
        }
        setShowCom([...showCom])
            


        
    }
    
    if(simulation && !saveAns){
        async function getSaveAnswer(){
            let respons = await fetch((env?.URL_SERVER || '' )+ '/api/simulation/get_save_answere',{
                method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({ 
                user: Cookie.getCookie('user')._id,
                simId: simulation._id,
                })
            })
            let data = await  respons.json();
            setSaveAns(data.ans || [])
        }

        getSaveAnswer();
    }



    let bodySimulation = []
    if(!stop){
        if(!simulation){
            bodySimulation.push(<p key='simulazione'>caricamento...</p>)
        }else if(simulation.length === 0){
            bodySimulation.push(<p key='simulazione'>simulazione non trovata</p>)
        }else{
            //start timer
            if (!timerInterval.current){
                let ore , minuti;

                if(simulation.time.o === 0 || !simulation.time?.o){ore = '00';
                }else if(simulation.time.o < 10){ ore = '0'+simulation.time.o;
                }else{ore = simulation.time.o}
                if(simulation.time.m === 0 || !simulation.time?.m){minuti = '00'; 
                }else if(simulation.time.m < 10){ minuti = '0'+simulation.time.o;
                }else{minuti = simulation.time.m}

                timer.current= [ore,minuti,'00']
                timerInterval.current = setInterval(timeDown, 1000);
            }
            
            
            
            //creazione domande
            let domande = [];
            simulation.chapter.map((mat, matIndex) => {
                let answere = saveAns?.find(x => x.n === mat.ma)
                let segnalazione = segnalaDom?.find(x => x.n === mat.ma);
                if(filter[matIndex].active !== 'active') return undefined ;
                mat.quiz.map((dom , domIndex) => {
                    let isDomSave = -1
                    let isDomSegn = -1
                    if(answere) isDomSave = answere.a.findIndex( inedxDom => inedxDom === domIndex );
                    if(segnalazione) isDomSegn = segnalazione.a.findIndex( inedxDom => inedxDom === domIndex );
                    if(filter[matIndex].dom[domIndex] !== 'active') return undefined;
    
                    return domande.push(
                        <li key={dom.q+domIndex}>
                            <p>{dom.q}</p>
                            <form>
                                {dom.answere.map((ris, risIndex) => (
                                    <div key={'risposta'+risIndex}>
                                        <label htmlFor={dom.q+'-'+domIndex+'-'+risIndex}>{ris.t}</label>
                                        <input id={dom.q+'-'+domIndex+'-'+risIndex} name={dom.q+'-'+domIndex}
                                            type='radio' value={risIndex}
                                            onChange={e => {
                                                if(!risposte.current?.[mat.ma]) risposte.current[mat.ma] = [];
                                                risposte.current[mat.ma][domIndex] = risIndex;
                                                setFilter([...filter])
                                            }}
                                        />
                                    </div>
                                ))}
                                <label htmlFor={`'salta-${domIndex}`}>{'salta domanda'}</label>
                                <input id={'salta'+'-'+domIndex} name={dom.q+'-'+domIndex}
                                            type='radio' value={-1}
                                            onChange={e => {
                                                if(!risposte.current?.[mat.ma]) risposte.current[mat.ma] = [];
                                                risposte.current[mat.ma][domIndex] = -1;
                                                setFilter([...filter])
                                            }}
                                        />
                            </form>
                            <button 
                                title={(isDomSave === -1) ? 'salva domanda' : 'cancella domanda dai salvati​'}
                                onClick={e => {e.preventDefault() ; saveAnswere(matIndex , domIndex)}}>
                                {(isDomSave === -1) ? '💿' : '📀​'}
                            </button>
                            <button 
                                title={(isDomSegn === -1) ? 'segnala domanda' : 'domanda segnalata'}
                                onClick={e => {
                                    e.preventDefault() ;
                                    let msg = prompt(`puoi dirci il motivo della segnalazione?
                                    esempio:
                                    1- risposte non corrette
                                    2- errori di ortografia
                                    3- bug
                                    4- altro...
                                    `) 
                                    if(isDomSegn === -1) segnalaDomanda(matIndex , domIndex, msg)
                                }}>
                                {(isDomSegn === -1) ? '🙎‍♂️' : '🙋‍♂️​'}
                            </button>
                        </li>
                    )
                })
            })
            
    
            bodySimulation.push(
                <div key="simulazione">
                    <p>{simulation.n}</p>
                    <p>{(mod.current) ?  timerUpdate : undefined}</p>
                    <div>
                        {filter.map((x, xIndex) => (
                            <div key={x.name+xIndex}>
                                <button className={`${x.active}`}   
                                    onClick={e => {
                                        e.preventDefault()
                                        if(filter[xIndex].active === 'active'){
                                            filter[xIndex].active = 'deactive';
                                        }else{ filter[xIndex].active = 'active';}
                                        
                                        setFilter([...filter])
                                    }}
                                >
                                    {`${x.name} ${(x.active === 'active') ? '✅' : '⭕'}`}
                                </button>
    
                                {x.dom.map((dom, domIndex) => (
                 
                                    <button className={`${x.active}`} key={'domanda'+ domIndex}  
                                        onClick={e => {
                                            e.preventDefault()
                                            if(filter[xIndex].dom[domIndex] === 'active'){
                                                filter[xIndex].dom[domIndex] = 'deactive';
                                            }else{ filter[xIndex].dom[domIndex] = 'active';}
                                            setFilter([...filter])
                                        }}
                                    >
                                    {`${domIndex + 1} ${(dom === 'active') ? '✅' : '⭕'}`}
                                    {(risposte.current?.[x.name]?.[domIndex] !== undefined) ? 'fatta' : 'non fatta'}
                                  
                                    </button>
                                ))}
                            </div>
    
                        ))}
                    </div>
                    <div>
                        <Section
                            elementi= {domande}
                            divisione= {20}
                            down= {true}
                            postoSezioni = {[posto, setPosto]}
                        />
                    </div>
                    <button onClick={e => {
                        e.preventDefault();
                        startCorrecton();
                        clearInterval(timerInterval.current);
                        setStop(true)
                    }}>Fine simulazione</button>
                </div>
            )
        }
    }else{
        if(!correction){
            bodySimulation.push(<p key='simulazione'>caricamento correzione...</p>)
        }else{

            //conteggio tempo
            let timerVeiw;
            let [oreR, minR, secR] = timerRevers.current;
            if(timerUpdate === '00:00:00'){timerVeiw = <p>tempo scaduto! hai impiegato {`${oreR}:${minR}:${secR}`}</p>
            }else{
                timerVeiw = <p>hai impiegato {`${oreR}:${minR}:${secR}`}</p>
            }

            //percentuale risposte esatte test attuale (solo per l'utente)
            let materieUser = []
            let allMaterieAnswere= 0;
            let allPoint = 0;
            
            for(let materia in userMaterie){
                let rispostePercentuale = userMaterie[materia][0];
                let rGiuste = userMaterie[materia][1];

                allMaterieAnswere += rispostePercentuale
                allPoint += rGiuste

                let percentuale  = (rGiuste*100 / rispostePercentuale).toFixed(2)

                materieUser.push(<li key={materia}>{`${materia} = domande: ${rispostePercentuale} giuste: ${rGiuste} percentuale: ${percentuale}%`}</li>)
            }
            let percentualeAll  = (allPoint*100 / allMaterieAnswere).toFixed(2)
            materieUser.push(<li key='tuttelematerie'>{`Tutte = domande: ${allMaterieAnswere} giuste: ${allPoint} percentuale: ${percentualeAll}%`}</li>)


            //domande corrette
            let correzioneDom = [];
            simulation.chapter.map((mat,matIndex) => {
                let domande = [];
                let answere = saveAns?.find(x => x.n === mat.ma);
                let segnalazione = segnalaDom?.find(x => x.n === mat.ma);
                let show = segnalaDom?.find(x => x.n === mat.ma);
                mat.quiz.map((dom, domIndex) => {
                    let rispostemat = [];
                    let rispostaNonData = [];
                    let isDomSave = -1;
                    let isDomSegn = -1
                    let showComment = -1
                    if(answere) isDomSave = answere.a.findIndex( inedxDom => inedxDom === domIndex );
                    if(segnalazione) isDomSegn = segnalazione.a.findIndex( inedxDom => inedxDom === domIndex );
                    if(show) showComment = show.a.findIndex( inedxDom => inedxDom === domIndex );

                    let commento = [];
                    commento.push(
                        <div id={"commento"+matIndex+'-'+domIndex} key={"commento"+matIndex+'-'+domIndex}>
                            <button 
                                onClick={e =>{ 
                                    e.preventDefault();
                                    showCommentDom(matIndex , domIndex)
                                }}>{(showComment !== -1 ) ? 'nascondi commento' : 'mostra commento'}</button>
                            <p style={{display:( (showComment !== -1) ? 'block': 'none')}}>{dom.c}</p>
                        </div>
                    )
                    dom.answere.map((ris, risIndex) => {

                        let rispostaData = risposte.current?.[mat.ma]?.[domIndex];
                        let rispostaGiusta = (ris?.c) ? true : false

                        let percentuale = clickDom[mat.ma][domIndex][risIndex];
                            
                       
                        let segno = undefined;
                        if(rispostaData !== undefined && rispostaData === risIndex){
                            if(rispostaGiusta){
                                segno = '✅ hai risposto bene';
                            }else{
                                segno = '❌ hai risposto male';
                            }
                        } 
                        if(!segno && ris?.c) segno = '✔️  questa è la risposta giusta'                 
                    
                        if(risIndex === dom.answere.length -1){
                            let percentuale = clickDom[mat.ma][domIndex][risIndex+1];
                            if(rispostaData === undefined || rispostaData === -1){
                                rispostaNonData.push(
                                    <li key={ris.t+risIndex+'non'}>
                                    {'risposta non data ❌'}
                                    <span>||||||risposta untenti: {percentuale}%</span>
                                    </li>
                                )
                            }else{
                                rispostaNonData.push(
                                    <li key={ris.t+risIndex+'non'}>
                                    {'risposta non data' }
                                    <span>||||||risposta untenti: {percentuale}%</span>
                                    </li>
                                )
                            }
                            
                            
                        }
                        rispostemat.push(
                        <li key={ris.t+risIndex}>
                            {ris.t + ' '}
                            {(segno) ? segno + ' ' : ' '}
                            <span>||||||risposta untenti: {percentuale}%</span>
                        </li>)
                    })
                    domande.push(
                        <li key={dom.q+domIndex}>
                            <ul key={dom.q+domIndex}>
                                {dom.q}
                                {rispostemat}
                                {(Boolean(rispostaNonData.length)) ?  rispostaNonData : undefined}
                            </ul>
                            {commento}
                            <button title={(isDomSave === -1) ? 'salva domanda' : 'cancella domanda dai salvati​'} 
                                onClick={e => {e.preventDefault() ; saveAnswere(matIndex , domIndex)}}>
                                {(isDomSave === -1) ? '💿' : '📀​'}
                            </button>
                            <button 
                                title={(isDomSegn === -1) ? 'segnala domanda' : 'domanda segnalata'}
                                onClick={e => {
                                    e.preventDefault() ;
                                    let msg = prompt(`puoi dirci il motivo della segnalazione?
                                    esempio:
                                    1- risposte non corrette
                                    2- errori di ortografia
                                    3- bug
                                    4- altro...
                                    `) 
                                    if(isDomSegn === -1) segnalaDomanda(matIndex , domIndex, msg)
                                }}>
                                {(isDomSegn === -1) ? '🙎‍♂️' : '🙋‍♂️​'}
                            </button>
                        </li>
                    )
                })
                correzioneDom.push(
                    <li key={mat.ma+matIndex}>
                        {mat.ma}
                        <ul>
                            <MultiSection
                                elementi= {domande} //lista elementi
                                divisione= {10}   //numero di elementi per sezione
                                down = {true}
                                postoSezioni = {[postoCorrecton , setPostoCorrecton]}
                                index= {matIndex}
                            />
                        </ul>
                    </li>
                )
               
            })

            bodySimulation.push(
                <div key='simulazione'>
                    <p >questa è la correzione</p>
                    {(mod.current) ? undefined : <p>modalità facile</p>}
                    {timerVeiw}
                    <div>
                        <p>risultato percentuale per materia</p>
                        <ul>
                            {materieUser}
                        </ul>
                        <div>
                            {correzioneDom}
                        </div>
                        
                    </div>
                </div>
                
                
            )
        }
    }

    return(
        <div>
            {(!stop) ? bodySimulation : bodySimulation}
        </div>
    )
}