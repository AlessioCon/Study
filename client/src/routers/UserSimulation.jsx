import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import PlurySection from '../component/PlurySection'

import env from "react-dotenv";

import Cookie from "../customHook/cookie"


export default function PlaySimulation(){
    const [simulation, setSimulation] = useState(undefined);
    const [filter, setFilter] = useState([]);
    const [plurySection, setPlurySection] = useState([]);
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
                    minuti = '59';
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
                method : 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    userId: Cookie.getCookie('user')._id , 
                    start: true})
            })
            let dati = await  respons.json();
            setSimulation(dati.data);
            if(dati.success){
                if(Boolean(dati.data?.chapter?.length)){
                    let segnalaMat = [];
                    let mostraDom = [];
                    let materie = [];
                    dati.data.chapter.map(mat => {
                        //per filtro
                        let capitoli = []
                        mat.li_ma.map(cap => {
                            capitoli.push({name: cap.t , active: 'active' , dom: Array(cap.quiz.length).fill('active')})
                        })
                        materie.push({name: mat.ma, active: 'active' , cap: capitoli });
    
                        //per segnalazione domanda e per stato commento
                        let allCap= [mat.li_ma.map(x => {
                            
                            return Array(x.quiz.length).fill(0)
                        })]
    
                        let allCapp= [mat.li_ma.map(x => {
                            
                            return Array(x.quiz.length).fill(0)
                        })]
    
                        segnalaMat.push(...allCap)
                        mostraDom.push(...allCapp)
                        
                    });
                    
                    setShowCom([...mostraDom]);
                    setSegnalaDom([...segnalaMat]);
                    setFilter(materie);
                }
    
                let simulation = dati.data
                let respo = await fetch((env?.URL_SERVER || '' )+ '/api/simulation/get_save_answere',{
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
                let dato = await  respo.json();
                setSaveAns(dato.ans || [])
            }
           
                
            
        }
        if (!simulation) getSimulation();

    }, [simulation])

    //per PLURYSECTION Simulazione-On
    useEffect(() => {
        let mat = [];
        let elemento = simulation
        elemento?.chapter.forEach((materia) => {
           mat.push(new Array(materia.li_ma.length).fill(1))
        });
        setPlurySection(mat)
    }, [simulation])
    //per PLURYSECTION Simulazione-Off
    useEffect(() => {
        let allArray = []
        plurySection.map((x , index) => {
            allArray.push(Array(x.length).fill(1))
        })
        setPlurySection(allArray)
    }, [stop])

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

    async function saveAnswere(materia , capitolo ,domanda){
        let response = await fetch((env?.URL_SERVER || '' ) + '/api/simulation/save_answere', {
            method: 'PUT',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                simId: simulation._id,
                materia: materia[0],
                capitolo: capitolo[0],
                indexDom: domanda,
                userId: Cookie.getCookie('user')._id
            })
        })
        let data = await response.json();
        alert(data.msg)
        if(data.success){
            if(data.cancell){
                let indexDomanda =  saveAns[materia[1]].cap[capitolo[1]].a.findIndex(x => x === domanda)
                saveAns[materia[1]].cap[capitolo[1]].a.splice(indexDomanda , 1);
            }else{
                let matIndex = saveAns?.findIndex(mat => mat.mat === materia[0]);
                if(matIndex === -1){
                    //se la materia non esiste
                    saveAns.push({
                        mat: materia[0],
                        cap: [{n: capitolo[0], a: [domanda]}]
                    })
                }else{
                    let capIndex = saveAns[matIndex].cap.findIndex(cap => cap.n === capitolo[0]);
                    if(capIndex === -1){
                        //se il capitolo non esiste
                        saveAns[matIndex].cap.push({n: capitolo[0] , a: [domanda]})
                    }else{
                        saveAns[matIndex].cap[capIndex].a.push(domanda)
                    }
                }
                
            }
            setSaveAns([...saveAns])
        }
    }

    async function segnalaDomanda(materia , cap ,dom){   
            let indexDomanda = segnalaDom[materia[1]][cap[1]][dom]
            if( indexDomanda !== 0){
                alert('hai gia segnalato la domanda, grazie!');
            }else{
                segnalaDom[materia[1]][cap[1]][dom] = 1

            let response = await fetch((env?.URL_SERVER || '' ) + '/api/user/send_msg', {
                method: 'POST',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    id: simulation.access.c,
                    msg:[simulation.n, materia[0] , cap[0] , dom ],
                    type: 'sim_dom_alert'
                })
            })
            let data = await response.json();
            if(data.success){
                alert('domanda segnalata');
            }else{
                alert('qualcosa è andato storto');
            }

                
            }
            setSegnalaDom([...segnalaDom])
            
        

        
    }

    async function showCommentDom(materia , cap , dom){
        
        let indexDomanda = showCom[materia][cap][dom]
        if( indexDomanda !== 0){
            showCom[materia][cap][dom] = 0
        }else{
            showCom[materia][cap][dom] = 1
        }
        setShowCom([...showCom])
       
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
                let fullTime = parseInt(simulation.time)
                let ore = parseInt(fullTime / 60)
                let minuti = fullTime % 60

                if(!ore || ore === 0 ){ore = '00';
                }else if(ore < 10){ ore = '0'+ore;
                }

                if(!minuti || minuti === 0){minuti = '00'; 
                }else if(minuti < 10){ minuti = '0'+minuti;
                }

                timer.current = [ore,minuti,'00']
                timerInterval.current = setInterval(timeDown, 1000);
            }
            
            //creazione domande
            let materie = [];
            simulation.chapter.map((mat, matIndex) => {
                let answereMat = saveAns?.find(x => x.mat === mat.ma);                
    
                if(filter[matIndex].active !== 'active') return undefined ;
                let capitolo = []
                mat.li_ma.map((cap, capIndex) => {
                    if(filter[matIndex].cap[capIndex].active !== 'active') return undefined;
                    
                    let answereCap = undefined;
                    if(answereMat) answereCap = answereMat?.cap?.find(x => x.n === cap.t);

                    let domande = []
                    cap.quiz.map((dom, domIndex) => {
                        if(filter[matIndex].cap[capIndex].dom[domIndex] !== 'active') return undefined;

                        let isDomSave = -1;
                        if(answereCap) isDomSave = answereCap?.a.findIndex(x => x === domIndex);
                        
                        domande.push(
                            <li key={dom.q+matIndex+capIndex+domIndex}>
                                <p>{dom.q}</p>
                                <form>
                                    {dom.answere.map((ris, risIndex) => (
                                        <div key={'risposta'+risIndex}>
                                            <label htmlFor={dom.q+'-'+domIndex+'-'+risIndex}>{ris.t}</label>
                                            <input id={dom.q+'-'+domIndex+'-'+risIndex} name={dom.q+'-'+domIndex}
                                                type='radio' value={risIndex}
                                                onChange={e => {
                                                    if(!risposte.current?.[mat.ma]) risposte.current[mat.ma] = [];
                                                    let findCap = risposte.current[mat.ma].findIndex(x => x.name === cap.t)
                                                    if(findCap === -1) {findCap = risposte.current[mat.ma].push({name: cap.t , dom:[]}) - 1} ;
                                                    risposte.current[mat.ma][findCap].dom[domIndex] = risIndex;
                                                    
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
                                                    let findCap = risposte.current[mat.ma].findIndex(x => x.name === cap.t)
                                                    if(findCap === -1) {findCap = risposte.current[mat.ma].push({name: cap.t , dom:[]}) - 1} ;
                                                    risposte.current[mat.ma][findCap].dom[domIndex] = -1;

                                                    setFilter([...filter])
                                                }}
                                            />
                                </form>
                                <button 
                                    title={(isDomSave === -1 ) ? 'salva domanda' : 'cancella domanda dai salvati​'}
                                    onClick={e => {
                                        e.preventDefault() ; 
                                        saveAnswere([mat.ma, matIndex] , [cap.t , capIndex], domIndex)}}>
                                    {(isDomSave === -1) ? '💿' : '📀​'}
                                </button>
                                <div>
                                    <button 
                                        title='segnala domanda'
                                        onClick={(e)=>{
                                            e.preventDefault()
                                            segnalaDomanda([mat.ma, matIndex], [cap.t, capIndex], domIndex)
                                        }}>
                                            {(segnalaDom?.[matIndex]?.[capIndex]?.[domIndex])
                                            ? '🙋‍♂️' 
                                            : '🙎‍♂️'
                                        }
                                    </button>
                                </div>
                            </li>
                        )
                    })

                    capitolo.push(
                        <li key={`${cap.t}-${matIndex}-${capIndex}`}>
                            <p>{cap.t}</p>
                            <ul>
                                {<PlurySection
                                    elementi= {domande}
                                    divisione= {5}
                                    down = {true}
                                    postoSezioni = {[plurySection , setPlurySection]}
                                    index= {[matIndex, capIndex]}//materia, capitolo
                                />}
                            </ul>
                        </li>
                    )
                })

                materie.push(
                    <li key={mat.ma + matIndex}>
                        <p>{mat.ma}</p>
                        <ul>
                            {capitolo}
                        </ul>
                    </li>
                )
            })

            bodySimulation.push(
                <div key="simulation">
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

                                {x.cap.map((cap, capIndex) => {

                                    return (
                                    <div key={cap.name+capIndex}>
                                        <div>
                                            <button className={`${x.active}`}  
                                            onClick={e => {
                                                e.preventDefault()
                                                if(filter[xIndex].cap[capIndex].active === 'active'){
                                                    filter[xIndex].cap[capIndex].active = 'deactive';
                                                }else{ filter[xIndex].cap[capIndex].active = 'active';}
                                                setFilter([...filter])
                                            }}
                                        >
                                        {`${cap.name} ${(cap.active === 'active') ? '✅' : '⭕'}`}
                                            </button>
                                        </div>
                                        <div>
                                            {cap.dom.map((dom, domIndex) => (
                                                <button className={`${x.active}`} key={'domanda'+xIndex+capIndex+ domIndex}  
                                                onClick={e => {
                                                    e.preventDefault()
                                                    if(filter[xIndex].cap[capIndex].dom[domIndex] === 'active'){
                                                        filter[xIndex].cap[capIndex].dom[domIndex] = 'deactive';
                                                    }else{ filter[xIndex].cap[capIndex].dom[domIndex] = 'active';}
                                                    setFilter([...filter])
                                                }}
                                                >
                                                {`${domIndex + 1} ${(dom === 'active') ? '✅' : '⭕'}`}
                                                {(
                                                    risposte.current?.[x.name]?.[capIndex]?.dom[domIndex] !== undefined &&
                                                    risposte.current?.[x.name]?.[capIndex]?.dom[domIndex] !== -1
                                                 ) ? 'fatta' : 'non fatta'}
                                          
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
    
                        ))}
                    </div>
                    <ul>
                        {materie}
                    </ul>
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
            let materieUser =[];
            let allMaterie = []
            let fullMaxPoint = 0
            let fullFattiPoit = 0
            for(let materia in userMaterie){
                let subCap = [];
                let allpMateria = 0
                let allpFatti = 0

                userMaterie[materia].map((cap, capIndex) => {
                    allpMateria += cap.point[0]
                    allpFatti   += cap.point[1]
                    let percentuale = Number((cap.point[1] * 100 /cap.point[0]).toFixed(2));
                    subCap.push(
                        <li key={cap.name+capIndex}>
                            <p>{cap.name} = domande: {cap.point[0]} , risposte giuste: {cap.point[1]}, risultato: {percentuale} %</p>
                        </li>
                    )
                })
                fullMaxPoint += allpMateria;  fullFattiPoit += allpFatti
                let allPercentuale = Number((allpFatti * 100 /allpMateria).toFixed(2));
                allMaterie.push(
                    <li key={materia}>
                        <p>{materia} = domande: {allpMateria} , risposte giuste: {allpFatti}, risultato: {allPercentuale} % </p>
                        <ul>
                            {subCap}
                        </ul>
                    </li>
                )
            }
            
            let percentualeAll  = (fullFattiPoit*100 / fullMaxPoint).toFixed(2)
            materieUser.push(
                <div key='tuttelematerie'>
                    <p>responso corso = domande: {fullMaxPoint} , giuste: {fullFattiPoit} , percentuale: {percentualeAll}% </p>
                    <ul>
                        {allMaterie}
                    </ul>                
                </div>)


            //domande corrette
            let correzioneDom = [];
            if(simulation){
                //se la simulazione non è stata cancellata
                simulation.chapter.map((mat,matIndex) => {
                    let answereMat = saveAns?.find(x => x.mat === mat.ma);
                    
                    let capitoli = []
                    mat.li_ma.map((cap, capIndex) => {
                        let capitoloR = risposte.current?.[mat.ma]?.[capIndex]
    
                        let answereCap = undefined;
                        if(answereMat) answereCap = answereMat?.cap?.find(x => x.n === cap.t);
    
    
                        let domande= []
                        cap.quiz.map((dom, domIndex) => {
                            let rData =  capitoloR?.dom[domIndex];
                            let centOnline = clickDom[mat.ma][capIndex].domande[domIndex]
                            
                            let isDomSave = -1;
                            if(answereCap) isDomSave = answereCap?.a.findIndex(x => x === domIndex);
                            
                            let risposte = []
                            dom.answere.map((ans , ansIndex) => {
                                let rCorrect = (ans?.c) ? true : false;
                                let centAns= centOnline[ansIndex]
    
                                let simbolo ; 
                                if(rCorrect) simbolo = '✔️ questa è la risposta giusta' 
                                if(rData === ansIndex){
                                    if(rCorrect){
                                        simbolo = '✅ hai risposto correttamente'
                                    }else{
                                        simbolo = '❌ hai risposto male'
                                    }
                                }
    
                                risposte.push(
                                    <li key={ans.t+ansIndex}>
                                        {ans.t}
                                        <span>{simbolo}</span>
                                        <span>---percentuale utenti: {centAns}%</span>
                                        
                                    </li>
                                )
                            })
    
                            domande.push(
                                <li key={dom.q+domIndex}>
                                    <p>{dom.q}</p>
                                    <ul>
                                        {risposte}
                                    </ul>
                                    <p>
                                        risposta non data 
                                        {(rData === undefined || rData === -1 ) ? '❌' : undefined}
                                        {'---percentuale utenti: '+ centOnline[dom.answere.length]+'%'}
                                    </p>
                                    <div>
                                        <button onClick={(e)=>{
                                            e.preventDefault()
                                            showCommentDom(matIndex, capIndex, domIndex)
                                        }}>
                                            {(showCom?.[matIndex]?.[capIndex]?.[domIndex])
                                            ? 'nascondi domanda'
                                            : 'mostra domanda'
                                        }
                                        </button>
                                        {(showCom?.[matIndex]?.[capIndex]?.[domIndex])
                                            ? <p>{dom.c}</p>
                                            :undefined
                                        }
                                       
                                    </div>
                                    <div>
                                        <button 
                                            title={(isDomSave === -1 ) ? 'salva domanda' : 'cancella domanda dai salvati​'}
                                            onClick={e => {
                                                e.preventDefault() ; 
                                                saveAnswere([mat.ma, matIndex] , [cap.t , capIndex], domIndex)}}>
                                            {(isDomSave === -1) ? '💿' : '📀​'}
                                        </button>
                                        <button 
                                            title='segnala domanda'
                                            onClick={(e)=>{
                                                e.preventDefault()
                                                segnalaDomanda([mat.ma, matIndex], [cap.t, capIndex], domIndex)
                                            }}>
                                                {(segnalaDom?.[matIndex]?.[capIndex]?.[domIndex])
                                                ? '🙋‍♂️' 
                                                : '🙎‍♂️'
                                            }
                                        </button>
                                       
                                    </div>
                                </li>
                            )
                        })
                        capitoli.push(
                            <li key={cap.t+capIndex}>
                                <p>{cap.t}</p>
                                <ul>
                                    {<PlurySection
                                        elementi= {domande}
                                        divisione= {5}
                                        down = {true}
                                        postoSezioni = {[plurySection , setPlurySection]}
                                        index= {[matIndex, capIndex]}//materia, capitolo
                                    />}
                                </ul>
                            </li>
                        )
                    })
                    correzioneDom.push(
                        <li key={mat.ma+matIndex}>
                            <p>{mat.ma}</p>
                            <ul>
                                {capitoli}
                            </ul>
                        </li>
                    )
    
                })
            }else{
                correzioneDom.push(
                    
                    <p key={'simulazione-Cancellata'}>ci dispiace la simulazione è stata cancellata</p>
                    
                )
            }
            

            bodySimulation.push(
                <div key="simulazione">
                    <p>questa è la correzione</p>
                    {(mod.current) ? undefined : <p>modalità facile</p>}
                    {timerVeiw}
                    <div>
                        <p>risultato percentuale per materia</p>
                        {materieUser}
                    </div>
                    <div>
                        {correzioneDom}
                    </div>
                </div>
            )

        }
    }

    return(
        <div>
            {bodySimulation}
        </div>
    )
}