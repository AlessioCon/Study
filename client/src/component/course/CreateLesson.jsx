import  {useEffect, useState, useRef } from 'react';
import Cookie from '../../customHook/cookie';
import env from "react-dotenv";

/*
function arrayBufferToString( buffer, encoding, callback ) {
    var blob = new Blob([buffer],{type:'text/plain'});
    var reader = new FileReader();
    reader.onload = function(evt){callback(evt.target.result);};
    reader.readAsText(blob, encoding);
}

function stringToArrayBuffer( string, encoding, callback ) {
    var blob = new Blob([string],{type:'text/plain;charset='+encoding});
    var reader = new FileReader();
    reader.onload = function(evt){callback(evt.target.result);};
    reader.readAsArrayBuffer(blob);
}*/

//------------------------------------------

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
        
        if(!element[x]) element[x] = ['', 'copia'];

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
                    <option value="copia">copia</option>
                    <option value="modifiche">modifiche</option>
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
            newElement[actualElement].access.push(['', 'copia']);
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

function Option(props){

    const [contList, setContList] = props.contList;
    const [division, setDivision] = useState([0,10]);
    const actualElement = props.elemento;
    let element = contList[actualElement];
    let quiz    = element.quiz; 
    
    let name = (props.name) ? props.name : 'addMoreInput'
    let chapterDisplay = [];

    function buttonSu (n){
        return (<button key={"buttonsu" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            let value = newValue[actualElement].quiz[n];
            newValue[actualElement].quiz.splice(n, 1)
            newValue[actualElement].quiz.splice(n -1, 0 , value)
            setContList(newValue);
        }}>su</button>)
    }

    function buttonGiu (n){
        return (<button key={"buttongiu" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            let value = newValue[actualElement].quiz[n];
            newValue[actualElement].quiz.splice(n, 1)
            newValue[actualElement].quiz.splice(n +1, 0 , value)
            setContList(newValue);
        }}>giu</button>)
    }

    function buttonCrea (n){
        return (<button key={"buttoncrea" + n} onClick={e => {
            e.preventDefault();
            let newValue = Object.values(contList);
            newValue[actualElement].quiz.splice(n +1, 0 , {q: '' , answere: []})
            setContList(newValue);
        }}>crea</button>)
    }

    
    for(let x = division[0]; division[1] > x && element.quiz.length > x ; x++){
    
        
        let keyAnswere = -1 //serve per daro un ordine alle risposte multiple
        chapterDisplay.push(
            <li key={`${name}${x}`}>
                <label htmlFor={`${name}${x}`}>{`${name} ${x+1}`}</label>
                <input type="text" name={`${name}${x}`} id={`${name}${x}`}  placeholder={`inserisci nome ${name}`} required
                    value={(quiz[x].q) ? quiz[x].q : ''}
                    onChange={(e)=>{
                        
                        let newValue = Object.values(contList);
                        newValue[actualElement]['quiz'][x].q = e.target.value;
                        setContList(newValue);
                    }}
                />

                <button onClick={(e) => {
                    e.preventDefault();
                    let newValue = Object.values(contList);
                    newValue[actualElement].quiz.splice(x, 1)
                    
                    setContList(newValue);
                }}>X</button>
                {(x !== 0) ? buttonSu(x) : undefined}
                {(x !== (element.quiz.length - 1)) ? buttonGiu(x): undefined}
                {buttonCrea(x)}

                <div>
                    {quiz[x]['answere'].map((e)=>{
                        keyAnswere++
                        let position = keyAnswere
                        let nameAnswere = "answere-"+x+'-'+keyAnswere;

                        return(
                            <div key={nameAnswere}>
                                <label htmlFor={nameAnswere}>risposta</label>
                                <input name={nameAnswere} id={nameAnswere} required
                                    value={(e.t) ? (e.t) : ''}
                                    onChange={(e) =>{
                                        let newValue = Object.values(contList);
                                        newValue[actualElement].quiz[x].answere[position].t = e.target.value;
                                        setContList(newValue)
                                    }}
                                />

                                <label htmlFor={nameAnswere +'C'}>corretta</label>
                                <input type='checkbox' name={nameAnswere +'C'} id={nameAnswere +'C'} 
                                    checked={e.c ?? false}
                                    onChange={(e)=>{
                                        let newValue = Object.values(contList);
                                        newValue[actualElement].quiz[x].answere[position].c = e.target.checked;
                                        setContList(newValue)
                                    }}/>
                                

                            </div>
                        )
                    })}

                    <button onClick={(e)=>{
                        e.preventDefault(); 
                        let newValue = Object.values(contList) ; 
                        newValue[actualElement].quiz[x].answere.push({})
                        setContList(newValue)
                    }}>+</button>

                    <button onClick={(e)=>{
                        e.preventDefault(); 
                        if(quiz[x].answere.length > 0){
                            let newValue = Object.values(contList) ; 
                            newValue[actualElement].quiz[x].answere.pop()
                            setContList(newValue)
                        }   
                    }}>-</button>

                    <label htmlFor={`comment-${x}`}>commento al quiz</label>
                        <textarea name={`comment-${x}`} id={`comment-${x}`} 
                            value={(quiz[x]['c']) ? (quiz[x]['c']) : ''}
                            onChange={(e) =>{
                                let newValue = Object.values(contList);
                                newValue[actualElement].quiz[x].c = e.target.value;
                                setContList(newValue)
                        }}
                        />
                </div>
                
            </li>
        )
        keyAnswere = 0
    }


    function buttonSection(count, div){
        

        let li = []
        let n = Math.ceil(count / div);


        for(let x = 0 ; x < n ; x++){
            li.push(
                <li key={'li'+x}>
                    <button onClick={(e) =>{
                        e.preventDefault();
                        setDivision([x*10, (x+1)*10])
                    }}>{`${x*10+1}-${(x+1)*10}`}</button>
                </li>
            )
        } 

        return li
        

    }

    return(
        <div>

            <ul>
                {chapterDisplay}
            </ul>

            <button onClick={(e) => { 
                e.preventDefault(); 
                let newValue = Object.values(contList) ; 
                newValue[actualElement].quiz.push({
                    q: '',
                    answere:[]
                });
                setContList(newValue);
            }}>+</button>


            <button onClick={(e) => { 
                e.preventDefault(); 
                if(element.quiz.length > 0){
                    let newValue = Object.values(contList) ; 
                    newValue[actualElement].quiz.pop()
                    setContList(newValue);
                }
                
            }}>-</button>

            <ul>
                {buttonSection(element.quiz.length, 10)}
            </ul>

        </div>
    )

}

function Lesson(props){
    let [contList , setContList] = props.contList;
    let actualElement = props.elemento;
    let element = contList[actualElement];
    let [listFile , setListFile] = props.listFile;

    function calcoloPunteggio(){
        let punti = contList[actualElement].point;
        let basso = Math.round(punti/3);
        let medio = Math.round(punti/2);

        let MSGQUIZ =`
        se la lezione è un quiz i punti saranno assegnati in base alla percentuale di risposte esatte date
        secondo i dati attuali:
        punteggio massimo = ${punti}
        percentuale di risposte esatte  maggiore dell\' 80% verranno dati ${punti} punti
        percentuale di risposte esatte  maggiore del 60% verranno dati ${medio} punti
        percentuale di rispostre esatte maggiore del 40% verrà dato ${basso} punto 
        da notare che il calcolo verrà sempre approssimato per eccesso`

        return MSGQUIZ

    }


    let inputFile = [
        <div key='file'>
            <label htmlFor='files'>risorse esterne</label>
            <input type="file" id="files" name="files" accept=".pdf" style={{display:'none'}}
                onChange={(e) => {
                let newValue = Object.values(contList);
    
                for (const key in e.target.files){
                    if(!isNaN(key)){
                        if(e.target.files[key].size < (3*1048576)){
                            //nome file ottenuto
                            let reader = new FileReader();
    
                            reader.onload = () =>{
                                newValue[actualElement].file = {name: e.target.files[key].name, file: reader.result};
                                setListFile(e.target.files[key].name)
                            }
                            reader.readAsDataURL(e.target.files[key]);
                        }else{ 
                            alert('inserire file minori di 3mb');
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
            <span title="se inserisci un file e la lezione contiene dei quiz , questi verranno eliminati">
                info
            </span>
        </div>]

    let video= [
        <div key="video">
            <label htmlFor='linkVideo'>Link Video</label>
            <input type='text' name="linkVideo" id="linkVideo" 
                value={(element.link) ? element.link : ''}
                onChange={(e) => {
                    let newValue = Object.values(contList);
                    newValue[actualElement].link = e.target.value
                    setContList(newValue)}}
            />
        </div>
    ]

    return(
        <div>
            <div>
                <label htmlFor='tLession'>Titolo lezione</label>
                <input type="text" name="tLession" id="tLession" required
                    value={element.ltitle}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].ltitle = e.target.value
                        setContList(newValue)}}
                />
            </div>

            <div>
            <label htmlFor='tdescription'>Descrizione lezione</label>
                <textarea type="text" name="tdescription" id="tdescription"
                    value={(element.description) ? element.description : ''}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].description = e.target.value
                        setContList(newValue)}}
                />
            </div>
            <div>
                <label htmlFor='chLesson'>Quiz</label>
                <input type="checkbox" name="chLesson" id="chLesson"
                    checked={(element.type) ? element.type : false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].type = e.target.checked;
                        if(!newValue[actualElement].quiz) newValue[actualElement].quiz = [];
                        setContList(newValue)}}
                />
            </div>

            <div>
                <label htmlFor='time'>durata</label>
                <input type="number" name="timeOre" id="timeOre" step='1' min="0"
                    value={element.time}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].time = e.target.value
                        setContList(newValue)}}
                />

                <input type="radio" value="ore"  name="unitaM" id="oreTime"
                    checked={(element.timeText === 'ore') ? true : false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].timeText = e.target.value
                        setContList(newValue)}}
                />
                <label htmlFor='oreTime'>ore</label>

                <input type="radio" value="minuti" name="unitaM" id="minutiTime" 
                    checked={(element.timeText === 'minuti') ? true : false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].timeText = e.target.value
                        setContList(newValue)
                    }}
                />
                 <label htmlFor='minutiTime'>minuti</label>

                 
            </div>

            {inputFile}

            <AddOneInput 
                name="utente" 
                msg="inserisci i nomi utente che avranno accesso ai quiz"
                contList={[contList , setContList]}
                actualElement = {props.elemento}
            />



            {(element.type === true)  ? <Option name="domanda" key={contList[actualElement].ltitle}   contList={props.contList} elemento={actualElement}/> : video}
            
            <div>
                <label htmlFor='point'>Punti completamento</label>
                <input type="number" name="point" id="point" min="0"
                    value={element.point ?? 0}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].point = e.target.value;
                        setContList(newValue)}}
                />
                <span title={calcoloPunteggio()}> info </span>
                    
                
            </div>
            
            
            
            <div>
                <label htmlFor='chStatus'>Bozza</label>
                <input type="checkbox" name="chStatus" id="chStatus"
                    checked={(element.bozza) ? element.bozza : false}
                    onChange={(e) => {
                        let newValue = Object.values(contList);
                        newValue[actualElement].bozza = e.target.checked;
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

function ContentLesson(props){
    const [search , setSearch] = useState('');
    const [elBigNum , setElBigNum] = props.elBigNum;

    let [actualElement , setActualElement] =  props.actualElement;
    let [contList , setContList] = props.contList;
    let UserForMaster = props.UserForMaster
   
    const [listFile , setListFile] = useState(contList[actualElement]?.file?.name ?? '')
    if(listFile !== contList[actualElement]?.file?.name ) setListFile(contList[actualElement]?.file?.name)

    //vedere se funziona nel caso di un corso da modificare e partire con un elBigNum maggiore dell più grande element 'n' (numero)
    useEffect(()=>{
        
        let elementTitle = contList.filter((e) => /element/.test(e.ltitle))
        let elementNum   = elementTitle.map((e) => {return e.ltitle.split(/ /)[1]})
    
        elementNum.map(e => {if(e > elBigNum)   setElBigNum(parseInt(e) +1) } )
    }, [])
    
    //----------------------------------------------

    async function deliteLessonOnServer(id){
        let response = await fetch((env?.URL_SERVER || '') + `/api/lesson/${id}` , {
            method:'DELETE',
            credentials: "include",
            body: JSON.stringify({userId: UserForMaster.current || Cookie.getCookie('user')._id, lessonId: contList[actualElement]._id }),
            headers: {
                Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                },
            
        })
        let data = await response.json();
        if(data.success !== true) alert('problema nella cancellazione della lezione , ricarica la pagina');
        window.location.reload();
        return data;
    }


    /*identificazione corso non tuo*/
    function isLessonCreator(lesson){
        let res = lesson.access?.find(e => e[0] === Cookie.getCookie('user').user)
        if(!res) return true;
        return false;
    }


    return(
        <div className="col_2">
                    
                {(contList.length) ? <Lesson 
                                        contList={[contList , setContList]} 
                                        elemento={actualElement}
                                        listFile={[listFile, setListFile]}
                                        /> 
                                        : <p>seleziona elemento</p>}

                <div>
                    <input type="search" name="searchE" id="searchE" placeholder='cerca titolo lezione'
                        value={search}
                        onChange={(e) =>{setSearch(e.target.value)}}
                    />
                    <button onClick={ e => {
                        e.preventDefault();
                        let newValue = Object.values(contList)
                        newValue.push({ltitle: `elemento ${elBigNum}` , type:false , access:[] , time:0})
                        setContList(newValue);
                        setElBigNum(elBigNum +1);
                        setActualElement(newValue.length -1)
                    }}>
                        nuova lezione
                    </button>
                
                    <ul style={{overflowY: 'auto' , maxHeight: '200px'}}>
                        {
                            contList.filter((e) => { if(new RegExp(search).test(e.ltitle)) return e })

                            .map((x,b) =>{
                                
                                return (<li key={'content'+b}>
                                    <button onClick={(e) => {
                                        e.preventDefault();
                                        let newValue = Object.values(contList);
                                     
                                        setListFile(newValue[b]?.file?.name ?? '');
                                        if(!contList[b]['ltitle']){
                                            newValue[b]['ltitle'] =  `elemento ${elBigNum}`;
                                            setContList(newValue);
                                            setElBigNum(elBigNum +1);
                                        }

                                        setActualElement(b);

                                    }}>{contList[b]['ltitle']}</button>
                                    {!(isLessonCreator(x)) ? <span>non tua</span> : undefined}


                                    {(isLessonCreator(x)) ? <button onClick={async (e) => {
                                        e.preventDefault()
                                        let confirm = alertConfirm('confermi eliminazione lezione (digita si)');
                                        if(confirm){
                                            if(contList[b]._id){
                                                let response = await deliteLessonOnServer(contList[b]._id);
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
                                </li>)
                            })
                        }
                    </ul>
                    
                        
                </div>
                        
        </div>
    )
}

function CreateLesson(){
const [contList, setContList] = useState([])
const [actualElement , setActualElement] = useState(0);
const [elBigNum , setElBigNum] = useState(0);

let UserForMaster = useRef(undefined);

    useEffect(()=>{


        let getLesson = async () =>{

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
            let fetchUrl = '';
            if(Cookie.getCookie('user').grade.find(x => x === 'master')) fetchUrl = 'lesson_user';

            let response = await fetch((env?.URL_SERVER || '') + '/api/lesson/'+fetchUrl, {
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
                resData.data.map(e => {
                   
                    let access = e.access.prof.map(el => {
                        return [el.n, el.g]
                    })

                    if (e.ti.match(/[a-z]/)[0] === 'm') e.timeText = 'minuti';
                    if (e.ti.match(/[a-z]/)[0] === 'o') e.timeText = 'ore';

                    e.creator = e.access.c
                    e.access = access
                    e.ltitle = e.n
                    e.description = e.d 
                    e.link = e.l
                    e.bozza = (e.s === 'bozza') ? true : false;
                    e.time = (parseInt(e.ti)) ?  parseInt(e.ti) : 0 ;
                    e.type = (Boolean(e.quiz.length)) ? true : false;
                    e.point = e.p ?? 0;

                    if(e.f){
                        let NameArr = e.f.split(/\\/g);
                        e.file = {name: NameArr[NameArr.length -1]}
                    }

                    

                    delete e.n ; delete e.d ; delete e.l; delete e.s; delete e.ti; delete e.p;

                    return newel.push(e)
                })

                setContList(newel);
                setElBigNum(newel.length);
                
            }

        }catch(e){console.log(e)}}

        getLesson();

    }, [])


    async function saveLesson(lesson){

        //elliminare video
        if(lesson.type){
            lesson.link = '';
            lesson.file = [];

        }else{lesson.quiz = [];}

        if(Boolean(lesson.file?.length)){ lesson.link = '';}

        let dati = lesson;

        let access = {
            prof: lesson.access ?? null,
            creator: (dati._id) ? dati.creator : UserForMaster.current || Cookie.getCookie('user')._id
        }
        
        dati.access = access;

        let fetchUrl = '/api/lesson/save';
        let method   = 'POST';

        if(dati._id){
            fetchUrl = '/api/lesson/update';
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


    return (
        <form onSubmit={(e)=>{
            e.preventDefault();
            saveLesson(contList[actualElement]);
        }}>
            <ContentLesson 
                contList={[contList, setContList]} 
                actualElement={[actualElement, setActualElement]} 
                elBigNum={[elBigNum, setElBigNum]}
                UserForMaster ={UserForMaster}
            />
        </form>
    )
}





export default CreateLesson;