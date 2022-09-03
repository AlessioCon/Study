import {useState , useEffect, useRef} from 'react';
import Cookie from "../../customHook/cookie";
import env from "react-dotenv";


import MultiSection from '../MultiSection'
import PlurySection from '../PlurySection'


function alertConfirm(msg){
    let alertConfirm = prompt(msg);
    if(alertConfirm === 'si') return true;
    return false
}

/*identificazione corso non tuo*/
function isCreatorElement(element){
    let res = element.access?.find(e => e[0] === Cookie.getCookie('user').user)
    if(!res) return true;
    return false;
}


function AddOneInput(props){
    let [contList , setContList] = props.contList
    let actualElement = props.actualElement

    let element = (contList[actualElement].access) ? (contList[actualElement].access) : [];

    let name = (props.name) ? props.name : 'addOneInput';
    let inputProf= [];

    for(let x = 0; element.length > x ; x++){
        

        inputProf.push(
            <div key={`${name}${x+1}`}>

                <label htmlFor={`${name}${x+1}`}>{`${name} ${x+1}`}</label>
                <input type="text" id={`${name}${x+1}`} name={`${name}${x+1}`} placeholder='inserisci il nome utente' required
                    value={element[x] || ''} 
                    onChange={(e) => {
                        let newElement = Object.values(contList)
                        newElement[actualElement].access[x] = e.target.value; 
                        setContList(newElement);
                        }
                    }
                />
                <button onClick={(e) => {
                    e.preventDefault();
                    let newElement = Object.values(contList);
                    newElement[actualElement].access.splice(x , 1);
                    setContList(newElement);
                }}>X</button>
            </div>
        )

    }

    return (
        <div id="profForm">
            <p>{props.msg}</p>

        {inputProf}

        <button onClick={(e)=> {
            e.preventDefault() ; 
            let newElement = Object.values(contList);
            newElement[actualElement].access.push('');
            setContList(newElement);
            }}>+</button>

        <button onClick={(e)=> {e.preventDefault() ; 
            if(element.length > 0)  {
                let newElement = Object.values(contList);
                newElement[actualElement].access.splice(element.length -1 , 1);
                
                setContList(newElement)
            }
            }}>-
            </button>
        </div>
    )
}

function AddChupter(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let elemento = contList[actualElement];
    const [plurySection, setPlurySection] = useState([]);


    //per PLURYSECTION
    useEffect(() => {
        let mat = [];
        let elemento = contList[actualElement]
        elemento?.chapter.forEach((materia) => {
           mat.push(new Array(materia.li_ma.length).fill(1))
        });
        setPlurySection(mat)
    }, [actualElement])


    let name = (props.name) ? props.name : 'addMoreInput'
    let chapterDisplay = [];

    
    function buttonSu (mat ,cap , n){
        return (<button key={"buttonsu" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            let value = newValue[actualElement].chapter[mat].li_ma[cap].quiz[n];
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n, 1)
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n -1, 0 , value)
            setContList(newValue);
        }}>su</button>)
    }

    function buttonGiu (mat ,cap, n){
        return (<button key={"buttongiu" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            let value = newValue[actualElement].chapter[mat].li_ma[cap].quiz[n];
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n, 1)
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n +1, 0 , value)
            setContList(newValue);
        }}>giu</button>)
    }

    function buttonCrea (mat, cap ,n){
        return (<button key={"buttoncrea" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n +1, 0 , {q: '' , answere: []})
            setContList(newValue);
        }}>crea</button>)
    }

    function buttonDelite (mat, cap ,n){
        return (<button key={"buttonellimina" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            newValue[actualElement].chapter[mat].li_ma[cap].quiz.splice(n , 1)
            setContList(newValue);
        }}>ellimina</button>)
    }

    if(Boolean(elemento.chapter?.length)){
        for(let x = 0; elemento.chapter.length > x; x++){
    
            let capitolo = elemento.chapter[x] ?? {}
    
            chapterDisplay.push(
                <li key={`${name}${x}`}>
                    <label htmlFor={`${name}${x}`}>{`materia ${x+1}`}</label>
                    <input type="text" name={`${name}${x}`} id={`${name}${x}`}  placeholder='inserisci nome materia' required
                        value={capitolo.ma ?? ''}
                        onChange={(e)=>{
                            let newValue = Object.values(contList);
                            newValue[actualElement].chapter[x].ma = e.target.value;
                            setContList(newValue);
                        }}
                    />
    
                    <button onClick={(e) => {
                        e.preventDefault();
                        let newValue = Object.values(contList);
                        newValue[actualElement].chapter.splice(x , 1);
                        setContList(newValue);

                        //plurySection
                        let plury = [...plurySection]
                        plury.splice(x , 1)
                        setPlurySection(plury)


                    }}>X</button>
                    <div>

                        {capitolo?.li_ma?.map((cap , capIndex) => {

                            let domande = []

                            {cap?.quiz?.map((quiz , index) => {
                                domande.push(
                                    <div key={'quiz'+index}>
                                        <div>
                                            <label htmlFor={quiz.q+x}>{'domanda '+(index +1)}</label>
                                            <input type='text' name={quiz.q+x} id={quiz.q+x} value={quiz.q || ''} required 
                                                onChange={e => {
                                                    let newValue = [...contList];
                                                    newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].q = e.target.value;
                                                    setContList(newValue);
                                                }}
                                            />
                                        </div>
        
                                    {quiz.answere.map((answere, ansIndex) => (
                                            <div key={'risposta'+ansIndex}>
                                            <label htmlFor={'risposta'+ansIndex}>risposta</label>
                                            <input name={'risposta'+ansIndex} id={'risposta'+ansIndex} required
                                                value={answere.t ?? ''}
                                                onChange={(e) => {
                                                    let newValue = [...contList];
                                                    newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].answere[ansIndex].t = e.target.value
                                                    setContList(newValue)}}
                                            />
                                            
                                            <label htmlFor={answere +'C'}>corretta</label>
                                            <input type='checkbox' name={answere +'C'} id={answere +'C'} 
                                                checked={answere.c ?? false}
                                                onChange={(e)=>{
                                                    let newValue = [...contList];
                                                    newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].answere[ansIndex].c = e.target.checked;
                                                    setContList(newValue)}}
                                                />
                                            </div>
        
                                    ))}
                                    
                                    <div>
                                        <label htmlFor={'commento'+x}>{'commento'}</label>
                                        <input type='text' name={'commento'+x} id={'commento'+x} value={quiz.c || ''} required 
                                            onChange={e => {
                                                let newValue = [...contList];
                                                newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].c = e.target.value;
                                                setContList(newValue);
                                            }}
                                        />
                                    </div>
    
                                    <button onClick={(e)=>{
                                        e.preventDefault(); 
                                        
                                        let newValue = Object.values(contList) ;
                                        if(!quiz?.answere) newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].answere = [];
                                        newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].answere.push({}) ;
                                        setContList(newValue);
                                    }}>+ risp</button>
                                    
                                    {(quiz?.answere?.length > 0) ? 

                                        <button onClick={(e)=>{
                                            e.preventDefault(); 
                                            if(quiz?.answere?.length > 0){
                                                let newValue = Object.values(contList) ; 
                                                newValue[actualElement].chapter[x].li_ma[capIndex].quiz[index].answere.splice(quiz?.answere?.length -1, 1)
                                                setContList(newValue);
                                            }   
                                        }}>- risp</button>
                                    
                                    
                                    :undefined}

                                    {(index !== 0) ? buttonSu(x, capIndex, index) : undefined}
                                    {(index !== cap.quiz.length -1) ? buttonGiu(x, capIndex, index) : null}
                                    {buttonCrea(x, capIndex, index)}
                                    {buttonDelite(x, capIndex, index)} 
                                </div>
                                )      
                            })}

                            return (
                                <div key={'capitolo'+capIndex}>
                                    <label htmlFor={`${cap.t}${capIndex}`}>{`capitolo ${capIndex+1}`}</label>
                                    <input type="text" name={`${cap.t}${capIndex}`} id={`${cap.t}${capIndex}`}  placeholder='inserisci nome capitolo' required
                                        value={cap.t ?? ''}
                                        onChange={(e)=>{
                                            let newValue = Object.values(contList);
                                            newValue[actualElement].chapter[x].li_ma[capIndex].t = e.target.value;
                                            setContList(newValue);
                                        }}
                                    />

                                    {<PlurySection
                                        elementi= {domande}
                                        divisione= {5}
                                        down = {true}
                                        postoSezioni = {[plurySection , setPlurySection]}
                                        index= {[x, capIndex]}//materia, capitolo
                                    />}

                                    <button onClick={(e)=>{
                                        e.preventDefault(); 
                                        let newValue = Object.values(contList) ;
                                        if(!capitolo?.li_ma[capIndex].quiz) newValue[actualElement].chapter[x].li_ma[capIndex].quiz = [];
                                        newValue[actualElement].chapter[x].li_ma[capIndex].quiz.push({q:'', answere:[] , c:''}) ;
                                        setContList(newValue);
                                    }}>+ dom</button>
                
                                    {(capitolo?.li_ma[capIndex]?.quiz.length > 0) ? 
                                    
                                        <button onClick={(e)=>{
                                            e.preventDefault(); 
                                            let newValue = Object.values(contList) ; 
                                            newValue[actualElement].chapter[x].li_ma[capIndex].quiz.splice(capitolo.li_ma[capIndex].quiz.length -1, 1)
                                            setContList(newValue);
                                             
                                        }}>- dom</button>
                                        
                                    : undefined}
                                </div>
                            )
                                    
                        })}
    
    

                        <button onClick={(e)=>{
                            e.preventDefault(); 
                            let newValue = Object.values(contList) ;
                            if(!capitolo?.li_ma) newValue[actualElement].chapter[x].li_ma = [];
                            newValue[actualElement].chapter[x].li_ma.push({t: '' , quiz: []}) ;
                            setContList(newValue);

                            //plurySection
                            let plury = [...plurySection];
                            plury[x].push(1);
                            setPlurySection(plury);
                            
                         
                        }}>+ cap</button>
                        
                        {(capitolo?.li_ma?.length > 0) ? 
                        
                            <button onClick={(e)=>{
                                e.preventDefault(); 
                                let newValue = Object.values(contList) ; 
                                newValue[actualElement].chapter[x].li_ma.pop()

                                //plurySection
                                let plury = [...plurySection];
                                plury[x].pop()
                                setPlurySection(plury);
                                setContList(newValue);
                                 
                            }}>- cap</button>
                        
                        :undefined}
                        
                    </div>
    
                </li>
            )
    
        }
    }
    


    return(
        <div>
            <ul id="chapterForm">
                {chapterDisplay}
            </ul>

            <button onClick={(e) => { 
                e.preventDefault(); 
                let newValue = Object.values(contList);
                newValue[actualElement].chapter.push({});
                setContList(newValue);

                //plurySection
                let plury = [...plurySection]
                plury.push([])
                setPlurySection(plury)
               }}>+ mat</button>

            {(elemento.chapter.length > 0) ? 

                <button onClick={(e) => { 
                    e.preventDefault(); 
                    let newValue = Object.values(contList);
                    newValue[actualElement].chapter.splice(elemento.chapter.length -1, 1);
                    setContList(newValue);

                    //plurySection
                    let plury = [...plurySection]
                    plury.pop()
                    setPlurySection(plury)
                    
                }}>- mat</button>
            :undefined}

        </div>
    )
}



function Simulation(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let element = contList[actualElement];
    let [listFile , setListFile] = props.listFile;

    let inputFile = [
        <div key='file'>
            <label htmlFor='files'>immagine simulazione</label>
            <input type="file" id="files" name="files" accept=".png, .jpeg, .jpg" style={{display:'none'}}
                onChange={(e) => {
                let newValue = Object.values(contList);
    
                for (const key in e.target.files){
                    if(!isNaN(key)){
                        if(e.target.files[key].size < (1*1048576)){
                            //nome file ottenuto
                            let reader = new FileReader();
    
                            reader.onload = () =>{
                                newValue[actualElement].file = {name: e.target.files[key].name, file: reader.result};
                                setListFile(e.target.files[key].name)
                            }
                            reader.readAsDataURL(e.target.files[key]);
                        }else{ 
                            alert('inserire file minori di 1mb');
                            e.target.value = '';
                        }
                    }
                
                }
                setContList(newValue)                 
                }}
            />
            <textarea type="text" readOnly={true} value={listFile ?? ''}/>
            <button
                style={{display:(listFile) ? 'inline' : 'none'}}
                onClick={e => {
                    e.preventDefault();
                    let newValue = Object.values(contList);
                    newValue[actualElement].file = {name:'' , file:'not'};
                    setContList(newValue);
                    setListFile('');
                }}
            >X</button>
        </div>]

    return(
        <div>
            <div>
                <label htmlFor='tSimulation'>Titolo Simulazione</label>
                <input type="text" name="tSimulation" id="tSimulation" minLength={4} maxLength={31} required
                    value={element?.n ?? ''}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].n = e.target.value
                        setContList(newValue)}}
                />
            </div>

            <div>
            <label htmlFor='tdescription'>Descrizione Simulazione</label>
                <textarea type="text" name="tdescription" id="tdescription" maxLength={229}
                    value={element?.d ?? ''}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].d = e.target.value
                        setContList(newValue)}}
                />
            </div>
            
            <div>
                <label htmlFor='timeMinuti'>durata simulazione in minuti</label>
                <input type="number" name="timeMinuti" id="timeMinuti" min={0} required 
                    value={element?.time ?? 0}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                    
                        if(!e.target.value !== '0'){
                            newValue[actualElement].time = e.target.value
                            setContList(newValue)   
                        }
                     }}
                        
                />
            </div>
            <div>
                <label htmlFor='resetSimulation'>attiva reset dati</label>
                <input type="checkbox" name="resetSimulation" id="resetSimulation" 
                    checked={(element?.reset?.active) ?? false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].reset.active = e.target.checked
                        setContList(newValue)}}
                />
            </div>
            {(element?.reset?.active) ? 
            <div>
                <div>
                    <label htmlFor='resetSimulation'>ogni quanti giorni bisogna resettare le simulazioni</label>
                    <input type="number" name="resetSimulation" id="resetSimulation" required
                        value={element?.reset.for ?? ''}
                        onChange={(e) => {
                            let newValue = Object.values(contList);
                            newValue[actualElement].reset.for = e.target.value
                            setContList(newValue)}}
                    />
                </div>
                <div>
                    <label htmlFor='daOraSimulation'>iniziare da oggi il conto alla rovescia del reset</label>
                    <input type="checkbox" name="daOraSimulation" id="daOraSimulation" 
                        value={element?.reset.daOra ?? ''}
                        onChange={(e) => {
                            let newValue = Object.values(contList);
                            newValue[actualElement].reset.daOra= e.target.checked
                            setContList(newValue)}}
                    />
                </div> 
            </div> : undefined}
            

            


            {isCreatorElement(element) ? <AddOneInput 
                name="utente" 
                msg="inserisci i nomi utente che avranno accesso alla simulazione"
                contList={[contList , setContList]}
                actualElement = {props.elemento}
            /> : undefined }
           

            <AddChupter name="domande" 
                contList={props.contList} 
                key={contList[actualElement].ma}
                elemento = {props.elemento}
            />

            {inputFile}

            <div>
                <label htmlFor='chStatus'>Bozza</label>
                <input type="checkbox" name="chStatus" id="chStatus"
                    checked={element.s ?? false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].s = e.target.checked;
                        setContList(newValue);
                    }}
                       
                />

            </div>

            <button type="submit"
            onClick={(e) => {
                let confirm = alertConfirm('confermi salvataggio (digita si)');
                if(!confirm) e.preventDefault();
            }}
            >salva</button>
        </div>
    )

}


function ContentCourse(props){
    const [search , setSearch] = useState('');
    const [elBigNum , setElBigNum] = props.elBigNum;


    let [actualElement , setActualElement] =  props.actualElement;
    let [contList , setContList] = props.contList;

    let UserForMaster = props.UserForMaster
    
    const [listFile , setListFile] = useState(contList[actualElement]?.file?.name ?? '')
    if(listFile !== contList[actualElement]?.file?.name ) setListFile(contList[actualElement]?.file?.name);


    async function delitePublicDate(btn){
        if(!btn.classList.contains('btn-pending')){
            try{
                let btntext= btn.innerText
                btn.innerText = '';
                btn.classList.add('btn-pending');

                let response = await fetch((env?.URL_SERVER || '' ) + `/api/simulation/delite_date` , {
                    method:'PUT',
                    credentials: "include",
                    body: JSON.stringify({
                        userId: UserForMaster.current || Cookie.getCookie('user')._id,
                        simId : contList[actualElement]._id
                    }),
                    headers: {
                        Accept: "application/json",
                                "Content-Type": "application/json",
                                "Access-Control-Allow-Credentials": true,
                    },  
                })
                let data = await response.json();
                alert(data.msg)

                btn.innerText = btntext;
                btn.classList.remove('btn-pending');
            }catch(e){console.log(e)}
        }

    }


    useEffect(()=>{
        
        let elementTitle = contList.filter((e) => /element/.test(e.ltitle))
        let elementNum   = elementTitle.map((e) => {return e.ltitle.split(/ /)[1]})
    
        elementNum.map(e => {if(e > elBigNum)   setElBigNum(parseInt(e) +1) } )
    }, [])


    async function deliteElementOnServer(id){
        let response = await fetch((env?.URL_SERVER || '' ) + `/api/simulation/${id}` , {
            method:'DELETE',
            credentials: "include",
            body: JSON.stringify({
                userId: UserForMaster.current || Cookie.getCookie('user')._id,
                simId : id
            }),
            headers: {
                Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                },
            
        })
       
        let data = await response.json();
        return data;
    }
//---------------------------------------------------------------------


let altridati = []
    if(actualElement !== undefined){

        //info sul blocco
        if(contList[actualElement]?.block){
            altridati.push(<p key="blocco">la simulazione è stata momentaniamente bloccata</p>)
        }


        //info sul reset
        if(contList[actualElement]?.reset?.active){
            let startNum = Number(contList[actualElement].reset.start);
            let start = new Date(startNum * 1000);
            let fineNum = (60*60*24) * contList[actualElement]?.reset?.for + startNum;
            let fine = new Date(fineNum * 1000);


            altridati.push(
                <div key="resetDati">
                    {(contList[actualElement].reset.start)
                    ? <p>{`data inizio raccolta dati: ${start.getDate()}/${start.getMonth()+1}/${start.getFullYear()}`}</p>                     
                    :undefined
                    }
                    
                    {(contList[actualElement].reset.start)
                    ? <p>{`data reset dati: ${fine.getDate()}/${fine.getMonth()+1}/${fine.getFullYear()}`}</p>                  
                    :undefined
                    }
                    <p>
                        reset ogni {(contList[actualElement]?.reset?.for > 1) ? contList[actualElement]?.reset?.for + ' giorni' : 'giorno'} 
                    </p>
                    <button onClick={e => {
                        e.preventDefault(); 
                        let alertt = prompt(`digita "si" per cancellare tutti i dati pubblici della simulazione`)
                        if(alertt === 'si'){ 
                            let date = delitePublicDate(e.target).then(x => {return x})
                        }
                    }}>reset dati</button>
                </div>
            )
        }else{
            altridati.push(<p key="resetDati">non sono previsti reset di dati</p>)
        }
    }

    return(
    <div>
        <div className="col_2">                
            {(contList.length && actualElement !== undefined) ? <Simulation 
                                    contList={[contList , setContList]} 
                                    elemento={actualElement}
                                    listFile={[listFile, setListFile]}
                                    /> 
                                    : <p>seleziona elemento</p>}

            <div>
                <input type="search" name="searchE" id="searchE"
                    value={search}
                    onChange={(e) =>{setSearch(e.target.value)}}
                />
                <button onClick={ e => {
                    e.preventDefault();
                    let newValue = Object.values(contList)
                    newValue.push({n: `simulazione ${elBigNum}` ,  access:[] , chapter:[] , time:{o:0 , m:0} , reset:{ active:false}})
                    setContList(newValue);
                    setElBigNum(elBigNum +1);
                    setActualElement(newValue.length -1)
                }}>
                    Nuova simulazione
                </button>
                <div>
                    <ul>
                        {
                            contList.filter((e) => { if(new RegExp(search).test(e.n)) return e })

                            .map((x,b) =>{
                                return <li key={'content'+b}>
                                    <button onClick={(e) => {
                                        e.preventDefault();
                                        let newValue = Object.values(contList);
                                    
                                        if(!contList[b]['n']){
                                            newValue[b]['n'] =  `corso ${elBigNum}`;
                                            setContList(newValue);
                                            setElBigNum(elBigNum +1);
                                        }

                                        setActualElement(b);

                                    }}>{contList[b]['n']}</button>
                                    {(!isCreatorElement(x)) ? <span>non tuo</span> : undefined}


                                    {(isCreatorElement(x)) ? <button onClick={async (e) => {
                                        e.preventDefault()
                                        let confirm = alertConfirm('confermi eliminazione della simulazione (digita si)');
                                        if(confirm){
                                            if(contList[b]._id){
                                                let response = await deliteElementOnServer(contList[b]._id);
                                                if(response.success !== true){
                                                    alert('abbiamo riscontrato un problema aggiorna la pagina')
                                                }
                                            }
                                            let newValue = Object.values(contList)
                                            newValue.splice(b, 1);
    
                                            if(actualElement === newValue.length && actualElement !== 0) setActualElement(actualElement -1) 
                                            setContList(newValue);
                                        } 
                                    }}>x</button> : null}
                                </li>
                            })
                        }
                    </ul>

                </div>
                
            </div>
                                    
        </div>

        {(actualElement !== undefined) ? <div>{altridati}</div> : undefined}

    </div>
       
    )
}

function CreateSimulation(){
const [contList, setContList] = useState([])
const [actualElement , setActualElement] = useState(undefined);
const [elBigNum , setElBigNum] = useState(0);

let UserForMaster = useRef(undefined);


    useEffect(()=>{
        
        let getCourse = async () =>{

            if(Cookie.getCookie('user').grade.find(x => x === 'master')){
                try{
                    let response = await fetch((env?.URL_SERVER || '') + '/api/master/', {
                        method: "POST",
                        body: JSON.stringify({id: Cookie.getCookie('user')._id}),
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Credentials": true,
                            },
                        })
                    let data = await response.json();
                    if(!data.success) return undefined;
                    const params = new URLSearchParams(window.location.search);
                    if(params.get("user")) UserForMaster.current = params.get("user")
                    
                }catch(e){console.log(e)} 
            }



            try {
            let fetchUrl = 'modifiche'

            if(Cookie.getCookie('user').grade.find(x => x === 'master')){fetchUrl = 'simulation_user'}
            
            let response = await fetch((env?.URL_SERVER || '') + '/api/simulation/'+fetchUrl, {
                method: "POST",
                body: JSON.stringify({id: UserForMaster.current || Cookie.getCookie('user')._id}),
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
            })
            let resData = await response.json();
           

            if(resData.success){

                let newel = []
                resData.simulations.map(e => {


                    e.creator = e.access.c;
                    e.access = e.access.user || [];
                    e.s = (e.s === 'bozza') ? true : false;

                    if(e?.f){
                        let indexName = e.f.split('/').length -1;
                        e.file = {name: e.f.split('/')[indexName]}
                    }else{
                        e.f = ""
                    }

                    return newel.push(e)
                })
                
                setContList(newel);
                setElBigNum(newel.length);
            }

        }catch(e){console.log(e)}}

        getCourse();

    }, [])

    async function saveLesson(lesson){
        let dati = lesson;

        let access = {
            user: lesson.access ?? null,
            c: (dati._id) ? dati.creator : UserForMaster.current || Cookie.getCookie('user')._id
        }
        
        dati.access = access;

        let fetchUrl = '/api/simulation/create';
        let method   = 'POST';

        if(dati._id){
            fetchUrl = '/api/simulation/update';
            method   = 'PUT';
            dati.userOfModify = UserForMaster.current || Cookie.getCookie('user')._id
        }

        let response = await fetch((env?.URL_SERVER || '') + fetchUrl, {
            method: method,
            body: JSON.stringify(dati),
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            }
        })
        let resData = await response.json();
        if(!resData.success) { alert('problema nel salvataggio della simulazione:' + resData.msg)}
        window.location.reload();
    }

    return (
        <div>
            
            <form onSubmit={(e)=>{
                e.preventDefault();
                saveLesson(contList[actualElement]);
            }}>
                <ContentCourse 
                    contList={[contList, setContList]} 
                    actualElement={[actualElement, setActualElement]} 
                    elBigNum={[elBigNum, setElBigNum]}
                    UserForMaster = {UserForMaster}
                />
            </form>
            
        </div> 
            
        
    )
}


export default CreateSimulation;





