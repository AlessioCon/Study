import {useState , useEffect, useRef} from 'react';
import Cookie from "../../customHook/cookie";
import env from "react-dotenv";


import Section from '../Section'


function alertConfirm(msg){
    let alertConfirm = prompt(msg);
    if(alertConfirm === 'si') return true;
    return false
}

function AddOneInput(props){
    let [contList , setContList] = props.contList
    let actualElement = props.actualElement

    let element = (contList[actualElement].access) ? (contList[actualElement].access) : [];

    let name = (props.name) ? props.name : 'addOneInput';
    let inputProf= [];


    for(let x = 0; element.length > x ; x++){
        
        if(!element[x]) element[x] = ['', 'modifiche'];

        inputProf.push(
            <div key={`${name}${x+1}`}>

                <label htmlFor={`${name}${x+1}`}>{`${name} ${x+1}`}</label>
                <input type="text" id={`${name}${x+1}`} name={`${name}${x+1}`} placeholder='inserisci il nome utente' required
                    value={(element[x]) ? element[x][0] : ''} 
                    onChange={(e) => {
                        let newElement = Object.values(contList)
                        newElement[actualElement].access[x][0] = e.target.value; 
                        setContList(newElement);
                        }
                    }
                />
                <select id={`grado${x+1}`} value={element[x][1]}
                    onChange={(e) => {
                        let newElement = Object.values(contList)
                        newElement[actualElement].access[x][1] = e.target.value; 
                        setContList(newElement);
                    }}
                >
                    <option title="l'utente può solo modificare il corso" value="modifiche">modifiche</option>
                    <option title="l'utente ha pieno controllo del corso"value="illimitato">illimitato</option>
                </select>
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
            newElement[actualElement].access.push(['', 'modifiche']);
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

function CreateList(props){
    let listLesson = props.listLesson;
    let nMateria = props.nMateria;

    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let nCapitolo = props.nCapitolo;
    let capitolo = contList[actualElement].chapter[nMateria].li_ma[nCapitolo];
    
    let list = [];

    
    let dataList=[
        <datalist key="list" id="listlesson">
            {listLesson.map(e=>{ return <option key={e._id} value={e.n}/>})}
        </datalist> 
    ];

    function levettaSu(posto){

        return (
            <button onClick={(e) => {
                e.preventDefault()
                let newValue = Object.values(contList);
                let value = capitolo.lesson[posto];
                newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(posto , 1);
                newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(posto -1, 0, value);
                setContList(newValue)
            }}>
            sù
            </button>
        )
    }

    function levettaGiu(posto){

        return (
            <button onClick={(e) => {
                e.preventDefault()
                let newValue = Object.values(contList);
                let value = capitolo.lesson[posto];
                newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(posto , 1);
                newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(posto +1,0, value);
                setContList(newValue);
            }}>
            giù
            </button>
        )
    }

//sestemazione order per levette

    for(let x = 0; capitolo.lesson?.length > x ; x++){
        list.push(  
            <div key={"list"+capitolo.t+x}>
                <input list="listlesson" id={"list"+capitolo.t+x}
                    value={capitolo.lesson[x][0] ?? ''}
                    onChange={(e)=>{
                        let newValue = Object.values(contList);
                        let id = listLesson.find(le => le.n === e.target.value )?._id;
                        newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson[x] = [e.target.value, id];
                        setContList(newValue);
                    }}
                />
                 {dataList}

                <button onClick={(e) => {
                    e.preventDefault();
                    console.log(contList)
                    let newValue = Object.values(contList);
                    newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(x, 1);
                    setContList(newValue)
                }}>X</button>
                {(x >0) ? levettaSu(x) : null}
                {(x !== capitolo.lesson.length -1) ? levettaGiu(x) : null}

                <button onClick={(e) => {
                   e.preventDefault()
                   let newValue = Object.values(contList);
                   newValue[actualElement].chapter[nMateria].li_ma[nCapitolo].lesson.splice(x+1, 0, '');
                   setContList(newValue);
                }}>
            nuovo
            </button>
        </div>
        ) 
    }
    return list
}

function AddChupter(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let elemento = contList[actualElement];



    let name = (props.name) ? props.name : 'addMoreInput'
    let chapterDisplay = [];

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
                    }}>X</button>
                    <div>

                        {capitolo?.li_ma?.map((cap , index) => (
                            <div key={'capitolo'+index}>
                                <label htmlFor={`${cap.t}${index}`}>{`capitolo ${index+1}`}</label>
                                <input type="text" name={`${cap.t}${index}`} id={`${cap.t}${index}`}  placeholder='inserisci nome capitolo' required
                                    value={cap.t ?? ''}
                                    onChange={(e)=>{
                                        let newValue = Object.values(contList);
                                        newValue[actualElement].chapter[x].li_ma[index].t = e.target.value;
                                        setContList(newValue);
                                    }}
                                />

                                <label htmlFor={`${name}lock${x}`}>blocco</label>
                                <input type="number" name={`${name}lock${x}`} id={`${name}lock${x}`}  min="0" placeholder='sblocco a...'
                                    value={cap.u ?? 0}
                                    onChange={(e)=>{
                                        let newValue = Object.values(contList);
                                        newValue[actualElement].chapter[x].li_ma[index].u = e.target.value;
                                        setContList(newValue);
                                }}
                    />
                                <CreateList
                                    nMateria={x}
                                    nCapitolo={index} 
                                    elemento={props.elemento} 
                                    contList={props.contList} 
                                    listLesson={props.listLesson}
                                />

                                <button onClick={(e)=>{
                                    e.preventDefault(); 
                                    let newValue = Object.values(contList) ;
                                    if(!capitolo?.li_ma[index].lesson) newValue[actualElement].chapter[x].li_ma[index].lesson = [];
                                    newValue[actualElement].chapter[x].li_ma[index].lesson.push('') ;
                                    setContList(newValue);
                                }}>+ less</button>
            
                                <button onClick={(e)=>{
                                    e.preventDefault(); 
                                    if(capitolo?.li_ma[index]?.lesson?.length > 0){
                                        let newValue = Object.values(contList) ; 
                                        newValue[actualElement].chapter[x].li_ma[index].lesson.splice(capitolo.li_ma[index].lesson.length -1, 1)
                                        setContList(newValue);
                                    }   
                                }}>- less</button>
        
                            </div>
                                    
                        ))}
    
    

                        <button onClick={(e)=>{
                            e.preventDefault(); 
                            let newValue = Object.values(contList) ;
                            if(!capitolo?.li_ma) newValue[actualElement].chapter[x].li_ma = [];
                            newValue[actualElement].chapter[x].li_ma.push({t: '' , lesson: []}) ;
                            setContList(newValue);
                         
                        }}>+ cap</button>
    
                        <button onClick={(e)=>{
                            e.preventDefault(); 
                            if(capitolo?.li_ma?.length > 0){
                                let newValue = Object.values(contList) ; 
                                newValue[actualElement].chapter[x].li_ma.splice(capitolo.li_ma.length -1, 1)
                                setContList(newValue);
                            }   
                        }}>- cap</button>
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

               }}>+ mat</button>

            <button onClick={(e) => { 
                e.preventDefault(); 
                if(elemento.chapter.length > 0){

                    let newValue = Object.values(contList);
                    newValue[actualElement].chapter.splice(elemento.chapter.length -1, 1);
                    setContList(newValue);
                }  
            }}>- mat</button>
        </div>
    )
//}
}

function AddSimulation(props){
    let siomulatioList = props.siomulatioList;

    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;

    let list = [];

    let dataList= [
        <datalist key="list" id="list">
            {siomulatioList.map(e=>{ return <option key={e._id} value={e.n}/>})}
        </datalist> 
    ];

    

//sestemazione order per levette

    for(let x = 0; contList[actualElement].simu.length > x ; x++){
        list.push(  
            <div key={"simulation"+x}>
                <input list="list" id={"list"+x}
                    value={contList[actualElement].simu[x][0] ?? ''}
                    onChange={(e)=>{
                        let newValue = Object.values(contList);
                        let id = siomulatioList.find(sim => sim.n === e.target.value )?._id;
                        newValue[actualElement].simu[x] = [e.target.value, id];
                        setContList(newValue);
                    }}
                />
                 {dataList}

                <button onClick={(e) => {
                    e.preventDefault();
                    let newValue = Object.values(contList);
                    newValue[actualElement].simu.splice(x, 1);
                    setContList(newValue)
                }}>X</button>
        </div>
        ) 
    }
    
    return (
        <div>
            {list}
            <button onClick={(e) => {
                e.preventDefault()
                let newValue = Object.values(contList);
                newValue[actualElement].simu.push(['',''])
                setContList(newValue);
            }}>
            +simu
            </button>
        </div>
    )

}

function Course(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let element = contList[actualElement];
    let [listFile , setListFile] = props.listFile;
    let [limiti, setLimiti] = props.limiti;


    let inputFile = [
        <div key='file'>
            <label htmlFor='files'>immagine corso</label>
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
                <label htmlFor='tCourse'>Titolo Corso</label>
                <input type="text" name="tCourse" id="tCourse" required
                    value={element?.t ?? ''}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].t = e.target.value
                        setContList(newValue)}}
                />
            </div>

            <div>
            <label htmlFor='cdescription'>Descrizione Corso</label>
                <textarea type="text" name="cdescription" id="cdescription"
                    value={element.d ?? ''}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].d = e.target.value
                        setContList(newValue)}}
                />
            </div>

            <div>
                <label htmlFor="prezzo">Prezzo €</label>
                <input type="number" id="prezzo" name="prezzo" placeholder='0' min='0' required 
                        value={element.sale?.p ?? 0} 
                        onChange={(e) =>{
                            let newValue = Object.values(contList);
                            if(! newValue[actualElement].sale)  newValue[actualElement].sale = {};
                            newValue[actualElement].sale.p = e.target.value;
                            setContList(newValue)
                        }}
                        
                />
            </div>
            <div>
                <label htmlFor="endPay">attivare pagamento a rate (3 mesi) </label>
                <input type="checkbox" id="endPay" name="endPay" 
                    checked={element.sale?.e ?? false}
                    onChange={(e)=>{
                        let newValue = Object.values(contList);
                        if(! newValue[actualElement].sale)  newValue[actualElement].sale = {};
                        newValue[actualElement].sale.e = e.target.checked;
                        setContList(newValue)
                    }}
                />
            </div>
    
            <div>
                <label htmlFor="sconto">Sconto €</label>
                <input type="number" id="sconto" name="sconto" placeholder='0' min='0' 
                    value={element.sale?.o ?? 0} 
                    onChange={(e) =>{
                        let newValue = Object.values(contList);
                        if(! newValue[actualElement].sale)  newValue[actualElement].sale = {};
                        newValue[actualElement].sale.o = e.target.value;
                        setContList(newValue)
                    }}
                />
            </div>

            {(!limiti) ?  <AddOneInput 
                name="utente" 
                msg="inserisci i nomi utente che avranno accesso al corso"
                contList={[contList , setContList]}
                actualElement = {props.elemento}
            /> : undefined}

            <AddSimulation name="simulation" 
                contList={props.contList} 
                siomulatioList={props.simulationList}
                elemento = {props.elemento}
            />
           

            <AddChupter name="list" 
                contList={props.contList} 
                listLesson={props.listLesson}
                elemento = {props.elemento}
            />

            <div>
                <label htmlFor="slug">nome per link</label>
                    <input type="text" id="slug" name="slug" placeholder="Inserisci lo slug da mostrare"  maxLength={16}
                        value={element.sl ?? ''}
                        onChange={(e) => {
                            let newValue = Object.values(contList);
                            newValue[actualElement].sl = e.target.value.replace(/ /g, '-').toLowerCase();
                            setContList(newValue)
                        }}
                    />
            </div>

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
    let [limiti, setLimiti] = props.limiti;
    let UserForMaster = props.UserForMaster
    
    const [listFile , setListFile] = useState(contList[actualElement]?.file?.name ?? '')
    if(listFile !== contList[actualElement]?.file?.name ) setListFile(contList[actualElement]?.file?.name);


    useEffect(()=>{
        
        let elementTitle = contList.filter((e) => /element/.test(e.ltitle))
        let elementNum   = elementTitle.map((e) => {return e.ltitle.split(/ /)[1]})
    
        elementNum.map(e => {if(e > elBigNum)   setElBigNum(parseInt(e) +1) } )
    }, [])
    
//da cambiare e reindirizzare all'eliminazione del corso
    async function deliteElementOnServer(id, idStripe){
        let response = await fetch((env?.URL_SERVER || '' ) + `/api/corsi/${id}` , {
            method:'DELETE',
            credentials: "include",
            body: JSON.stringify({
                userId: UserForMaster.current || Cookie.getCookie('user')._id , 
                idStripe: idStripe,
                id: id
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


    /*identificazione corso non tuo*/
    function isCreatorElement(element){
        let res = element.access?.find(e => e[0] === Cookie.getCookie('user').user)
        if(!res) return true;
        return false;
    }


    function checkLimiti(element){
 
        if(element?.creator === Cookie.getCookie('user')._id || element?.creator === UserForMaster.current ) return setLimiti(false);
       
        if(element?.access?.find(x => x[0] === Cookie.getCookie('user').user && x[1] === 'illimitato')){
            return setLimiti(false)
        }else{return setLimiti(true)}
    }


    return(

        <div className="col_2">
                        
                {(contList.length && actualElement !== undefined) ? <Course 
                                        contList={[contList , setContList]} 
                                        elemento={actualElement}
                                        listFile={[listFile, setListFile]}
                                        listLesson= {props.listLesson}
                                        simulationList= {props.simulationList}
                                        limiti ={[limiti, setLimiti]}
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
                        newValue.push({t: `corso ${elBigNum}` , type:false , access:[] , chapter:[] , simu:[]})
                        setContList(newValue);
                        setElBigNum(elBigNum +1);
                        setActualElement(newValue.length -1)
                    }}>
                        nuovo corso
                    </button>
                    <div>
                        <ul>
                            {
                                contList.filter((e) => { if(new RegExp(search).test(e.ltitle)) return e })
    
                                .map((x,b) =>{
                                    return <li key={'content'+b}>
                                        <button onClick={(e) => {
                                            e.preventDefault();
                                            let newValue = Object.values(contList);
                                            checkLimiti(x);
                                        
                                            if(!contList[b]['t']){
                                                newValue[b]['t'] =  `corso ${elBigNum}`;
                                                setContList(newValue);
                                                setElBigNum(elBigNum +1);
                                            }
    
                                            setActualElement(b);
    
                                        }}>{contList[b]['t']}</button>
                                        {(!isCreatorElement(x)) ? <span>non tuo</span> : undefined}
    
    
                                        {(isCreatorElement(x)) ? <button onClick={async (e) => {
                                            e.preventDefault()
                                            let confirm = alertConfirm('confermi eliminazione corso (digita si)');
                                            if(confirm){
                                                if(contList[b]._id){
                                                    let response = await deliteElementOnServer(contList[b]._id , contList[b].idStripe);
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
    )
}

function ListUserBuyCourse(props){
    const [postoSezioni, setPostoSezioni] = useState(1); //per far funzionare section
    
    
    let userList = props.userList;

    if(userList?.length === 0){ 
        
        return <p>nessuno ha comprato il corso</p>

    }else{
        let user = []
        for(let x = 0 ; x < userList?.length ; x++){
            user.push(
                <p key={userList[x] + x} title={userList[x]}>{userList[x]}</p>
            )
        }
        return(
            <div>
                lista utenti
                <Section 
                    elementi={user} 
                    divisione={10} 
                    down={true}
                    postoSezioni={[postoSezioni, setPostoSezioni]}
                />
            </div>
        )

    }

}

function CreateCourse(){
const [contList, setContList] = useState([])
const [actualElement , setActualElement] = useState(undefined);
const [elBigNum , setElBigNum] = useState(0);
const [listLesson, setListLesson] = useState([]);
const [simulationList, setSimulationList] = useState([]);
const [regalaCorso, setRegalaCorso] = useState("");
const [ msgRegalo ,setMsgRegalo] = useState('');
const [stripeAmount, setStripeAmount] = useState(undefined);
const [limiti , setLimiti] = useState(true) 
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
            let fetchUrl = 'modifica';
            if(Cookie.getCookie('user').grade.find(x => x === 'master')) fetchUrl = 'corsi_user';

            let response = await fetch((env?.URL_SERVER || '') + '/api/corsi/'+fetchUrl, {
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
            
            if(resData.lesson){
                let newlessonList = [];
                for(let e in resData.lesson){ newlessonList.push(resData.lesson[e])}
                setListLesson(newlessonList);
            }

            if( resData?.simulation && resData?.simulation?.length !== 0){ 
                setSimulationList([...resData.simulation]);}
            
            

            if(resData.success){
               
                let newel = []
                resData.data.map((e , index) => {
                    let access = e.access.prof.map(el => {
                        return [el.n, el.g]
                    })

                    e.creator = e.access.c;
                    e.access = access;
                    e.s = (e.s === 'true') ? true : false;

                    if(e.img){
                        let NameArr = e.img.split(/\\/g);
                        e.file = {name: NameArr[NameArr.length -1]}
                    }
                    
                    //inserimento simulazione nome e id  
                    if(resData?.simulatioName){
                        e.simu = resData.simulatioName[index]
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

        let dati = JSON.parse(JSON.stringify(lesson));

        let access = {
            prof: lesson.access ?? null,
            creator: (dati._id) ? dati.creator : UserForMaster.current || Cookie.getCookie('user')._id
        }


        if(!dati.sl){
            dati.sl = dati.t.toLowerCase().replaceAll(' ','-');
        }
        
        dati.access = access;

        //controllo simulazioni uguali
        let simulation = [];
        lesson.simu.map(x => {
            if(simulation.findIndex(y => y[0] === x[0]) === -1) simulation.push(x[1])
        })
        dati.simu = simulation

        let fetchUrl = '/api/corsi/create';
        let method   = 'POST';

        if(dati._id){
            fetchUrl = '/api/corsi/update';
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
        if(!resData.success === true) { alert('problema nel salvataggio della lezione , ricarica la pagina')}
        window.location.reload();
    }

    async function saveRegalaCorso(e){
        e.preventDefault()

        let btn = document.getElementById('btnRegalo');
        btn.classList.add('btn-pending')
        let btnText= btn.innerText
        btn.innerText = ''


        let response = await fetch((env?.URL_SERVER || '') + '/api/user/payCourse', {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                idCourse: contList?.[actualElement]?._id,
                user:  regalaCorso,
                subId: 'regalo'
            })
        })
        let data = await response.json();

        if(!data.success){ 
            setMsgRegalo(data.msg);
        }else{
            setMsgRegalo('corso inviato correttamente');
        }
            btn.classList.remove('btn-pending')
            btn.innerText = btnText

        
    }

  
    async function getStripeAmount(){
       

        let response = await fetch((env?.URL_SERVER || '') + '/api/stripe/amount_product' , {
            method: 'POST',
            headers:{
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({idStripe: contList[actualElement].idStripe})
        })
        let data = await response.json();
        if(data.success)  setStripeAmount(data.amount);
    }

    useEffect(() => {
        if(Boolean(contList[actualElement]?.idStripe)) getStripeAmount();
    },[actualElement])
    
    async function sendMsgForUserSeller(form){
        let btn = form.elements['btn-msgForUser']
        if(btn.classList.contains('btn-pending')) return ;
        btn.innerText = '';
        btn.classList.add('btn-pending');

        let msg = {
            type: 'for_user_buy_course', 
            body: [contList[actualElement].t , form.elements['msgForUser'].value]
        }
        try{
            let response = await fetch((env?.URL_SERVER || '') + '/api/user/send_msg_course' , {
                method: 'POST',
                headers:{
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    idCourse: contList[actualElement]._id,
                    msg: msg
                })
            })
            let data = await response.json();
            if(data.success) return alert(data.msg);
            
            alert('errore , ricarica la pagina o prova più tardi')
        }catch(e){
            alert('errore , ricarica la pagina o prova più tardi')
        }finally{
            btn.classList.remove('btn-pending');
            btn.innerText = 'invia';
            form.elements['msgForUser'].value = '';
        }
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
                    listLesson={listLesson}
                    simulationList={simulationList}
                    limiti={[limiti, setLimiti]}
                    UserForMaster = {UserForMaster}
                />
            </form>
            
            
           {(!limiti) ? <div>
                {(contList?.[actualElement]?.block) ?<p>CORSO ATTUALMENTE BLOCCATO</p> : null}
                <p>statistiche corso</p>
                    <p>corsi venduti : {contList?.[actualElement]?.ven?.ul?.length ?? 0}</p>
                    <p>ricavo stripe: {stripeAmount}</p>
                    <p>ricavo paypal: 0</p>
                    <p>totale: {stripeAmount}</p>
                <form onSubmit={(e) => saveRegalaCorso(e)}>
                    <div>
                        <label htmlFor='regalaCorso'>inserisci nome utenti a cui vuoi regalare il corso</label>
                        <input type="text" name="regalaCorso" id="regalacorso" required
                            value={regalaCorso}
                            onChange={(e) => {
                                setRegalaCorso(e.target.value);
                                if(Boolean(msgRegalo)) setMsgRegalo('')
                            }}
                        />
                    </div>
                    <button type='submit' id="btnRegalo">invia corso</button>
                    {(Boolean(msgRegalo)) ? <p>{msgRegalo}</p> : null}
                </form>

                <ListUserBuyCourse userList={contList?.[actualElement]?.ven}/>
                
                <form onSubmit={(e) => {e.preventDefault() ; sendMsgForUserSeller(e.target)}}>
                    <label>manda un messaggio a tutti gli utenti che hanno acquistato il corso</label>
                    <textarea minLength={10} maxLength={2000} id='msgForUser'/>
                    <button type='submit' title="invia messaggio" id='btn-msgForUser'>invia</button>
                </form>
                
                

            </div> : undefined}
        </div> 
            
        
    )
}


export default CreateCourse;