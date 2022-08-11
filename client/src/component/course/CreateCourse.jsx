import {useState , useEffect} from 'react';
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

    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let nCapitolo = props.nCapitolo;
    let capitolo = contList[actualElement].chapter[nCapitolo];


    let list = [];

    
    let dataList=[
        <datalist key="list" id="list">
            {listLesson.map(e=>{ return <option key={e._id} value={e.n}/>})}
        </datalist> 
    ];

    function levettaSu(posto){

        return (
            <button onClick={(e) => {
                e.preventDefault()
                let newValue = Object.values(contList);
                let value = capitolo.lesson[posto];
                newValue[actualElement].chapter[nCapitolo].lesson.splice(posto , 1);
                newValue[actualElement].chapter[nCapitolo].lesson.splice(posto -1, 0, value);
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
                newValue[actualElement].chapter[nCapitolo].lesson.splice(posto , 1);
                newValue[actualElement].chapter[nCapitolo].lesson.splice(posto +1,0, value);
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
                <input list="list" id={"list"+capitolo.t+x}
                    value={capitolo.lesson[x][0] ?? ''}
                    onChange={(e)=>{
                        let newValue = Object.values(contList);
                        let id = listLesson.find(le => le.n == e.target.value )?._id;
                        newValue[actualElement].chapter[nCapitolo].lesson[x] = [e.target.value, id];
                        setContList(newValue);
                    }}
                />
                 {dataList}

                <button onClick={(e) => {
                    e.preventDefault();
                    let newValue = Object.values(contList);
                    newValue[actualElement].chapter[nCapitolo].lesson.splice(x, 1);
                    setContList(newValue)
                }}>X</button>
                {(x >0) ? levettaSu(x) : null}
                {(x !== capitolo.lesson.length -1) ? levettaGiu(x) : null}

                <button onClick={(e) => {
                   e.preventDefault()
                   let newValue = Object.values(contList);
                   newValue[actualElement].chapter[nCapitolo].lesson.splice(x+1, 0, '');
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
                    <label htmlFor={`${name}${x}`}>{`capitolo ${x+1}`}</label>
                    <input type="text" name={`${name}${x}`} id={`${name}${x}`}  placeholder='inserisci nome capitolo' required
                        value={capitolo.t ?? ''}
                        onChange={(e)=>{
                            let newValue = Object.values(contList);
                            newValue[actualElement].chapter[x].t = e.target.value;
                            setContList(newValue);
                        }}
                    />
    
                    <button onClick={(e) => {
                        e.preventDefault();
                        let newValue = Object.values(contList);
                        newValue[actualElement].chapter.splice(x , 1);
                        setContList(newValue);
                    }}>X</button>
    
                    <label htmlFor={`${name}lock${x}`}>blocco</label>
                    <input type="number" name={`${name}lock${x}`} id={`${name}lock${x}`}  min="0" placeholder='sblocco a...'
                        value={capitolo.u ?? 0}
                        onChange={(e)=>{
                            let newValue = Object.values(contList);
                            newValue[actualElement].chapter[x].u = e.target.value;
                            setContList(newValue);
                        }}
                    />
    
                    <div>

                        {<CreateList
                            nCapitolo={x} 
                            elemento={props.elemento} 
                            contList={props.contList} 
                            listLesson={props.listLesson}
                        />}
    
    
                        <button onClick={(e)=>{
                            e.preventDefault(); 
                            let newValue = Object.values(contList) ;
                            if(!capitolo.lesson) newValue[actualElement].chapter[x].lesson = [];
                            newValue[actualElement].chapter[x].lesson.push('') ;
                            setContList(newValue);
                        }}>+</button>
    
                        <button onClick={(e)=>{
                            e.preventDefault(); 
                            if(capitolo.lesson?.length > 0){
                                let newValue = Object.values(contList) ; 
                                newValue[actualElement].chapter[x].lesson.splice(capitolo.lesson.length -1, 1)
                                setContList(newValue);
                            }   
                        }}>-</button>
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

               }}>+</button>

            <button onClick={(e) => { 
                e.preventDefault(); 
                if(elemento.chapter.length > 0){

                    let newValue = Object.values(contList);
                    newValue[actualElement].chapter.splice(elemento.chapter.length -1, 1);
                    setContList(newValue);
                }  
            }}>-</button>
        </div>
    )
}

function Course(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let element = contList[actualElement];
    let [listFile , setListFile] = props.listFile;

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
                    value={element.t ?? ''}
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

            <AddOneInput 
                name="utente" 
                msg="inserisci i nomi utente che avranno accesso ai quiz"
                contList={[contList , setContList]}
                actualElement = {props.elemento}
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
                        setContList(newValue)}}
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

    const [listFile , setListFile] = useState(contList[actualElement]?.file?.name ?? '')
    if(listFile !== contList[actualElement]?.file?.name ) setListFile(contList[actualElement]?.file?.name);


    useEffect(()=>{
        
        let elementTitle = contList.filter((e) => /element/.test(e.ltitle))
        let elementNum   = elementTitle.map((e) => {return e.ltitle.split(/ /)[1]})
    
        elementNum.map(e => {if(e > elBigNum)   setElBigNum(parseInt(e) +1) } )
    }, [])
    
//da cambiare e reindirizzare all'eliminazione del corso
    async function deliteElementOnServer(id, idStripe){
        let response = await fetch((env.URL_SERVER || '') + `/api/corsi/${id}` , {
            method:'DELETE',
            credentials: "include",
            body: JSON.stringify({userId:Cookie.getCookie('user')._id , idStripe: idStripe}),
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


    return(
        <div className="col_2">
                        
                {(contList.length) ? <Course 
                                        contList={[contList , setContList]} 
                                        elemento={actualElement}
                                        listFile={[listFile, setListFile]}
                                        listLesson= {props.listLesson}
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
                        newValue.push({t: `corso ${elBigNum}` , type:false , access:[] , chapter:[] })
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
                                        
                                            if(!contList[b]['t']){
                                                newValue[b]['t'] =  `corso ${elBigNum}`;
                                                setContList(newValue);
                                                setElBigNum(elBigNum +1);
                                            }
    
                                            setActualElement(b);
    
                                        }}>{contList[b]['t']}</button>
    
    
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
    let [listUser, setListUser] = useState('');
    const [postoSezioni, setPostoSezioni] = useState(1); //per far funzionare section
    
    
    let userList = props.userList;


    async function fromIdToUser(list){
        let response = await fetch((env.URL_SERVER || '') + '/api/user/fromIdToUser' , {
            method: 'POST',
            headers:{
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({listId: list})
        })
        let data = await response.json()
        if(!data.success) return userList = undefined;
        setListUser(data.userList)
    }

    if(userList && !Boolean(listUser)){
        fromIdToUser(userList);
        return(
            <ul>
                caricamento lista...
            </ul>
        )
    }else if(userList && Boolean(listUser)){
        let user = []
        for(let x = 0 ; x < listUser.length ; x++){
            user.push(
                <p key={listUser[x].user} title={userList[x]}>{listUser[x].user}</p>
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

    }else{ return null}

}





function CreateCourse(){
const [contList, setContList] = useState([])
const [actualElement , setActualElement] = useState(0);
const [elBigNum , setElBigNum] = useState(0);
const [listLesson, setListLesson] = useState([])
const [regalaCorso, setRegalaCorso] = useState("");
const [ msgRegalo ,setMsgRegalo] = useState('');
const [stripeAmount, setStripeAmount] = useState(null);


    useEffect(()=>{

        let getCourse = async () =>{
            try {
            let response = await fetch((env.URL_SERVER || '') + '/api/corsi/modifica', {
                method: "POST",
                body: JSON.stringify({id:Cookie.getCookie('user')._id}),
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
            

            if(resData.success){
               
                let newel = []
                resData.data.map(e => {
                    let access = e.access.prof.map(el => {
                        return [el.n, el.g]
                    })

                    e.creator = e.access.c;
                    e.access = access;
                    e.s = (e.s === 'true') ? true : false;

                    if(e.img){
                        let indexName = e.img.split('/').length -1;
                        e.file = {name: e.img.split('/')[indexName]}
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
            creator: (dati._id) ? dati.creator : Cookie.getCookie('user')._id
        }

        if(!dati.sl){
            dati.sl = dati.t.toLowerCase().replaceAll(' ','-');
        }
        
        dati.access = access;

        let fetchUrl = '/api/corsi/create';
        let method   = 'POST';

        if(dati._id){
            fetchUrl = '/api/corsi/update';
            method   = 'PUT';
            dati.userOfModify = Cookie.getCookie('user')._id
        }


        let response = await fetch((env.URL_SERVER || '') + fetchUrl, {
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


        let response = await fetch((env.URL_SERVER || '') + '/api/user/payCourse', {
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

        let response = await fetch((env.URL_SERVER || '') + '/api/stripe/amount_product' , {
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
    if(Boolean(contList[actualElement]?.idStripe) && stripeAmount ) getStripeAmount();

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
                />
            </form>
            <div>
                {(contList?.[actualElement]?.block) ?<p>CORSO ATTUALMENTE BLOCCATO</p> : null}
                <p>statistiche corso</p>
                    <p>corsi venduti : {contList?.[actualElement]?.ven?.n ?? 0}</p>
                    <p>ricavo stripe: {stripeAmount}</p>
                    <p>ricavo paypal: 0</p>
                    <p>totale: 0</p>
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

                <ListUserBuyCourse userList={contList?.[actualElement]?.ven?.ul}/>
            </div>
        </div>
        
    )
}


export default CreateCourse;