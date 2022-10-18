import { useState ,  useEffect } from "react";
import Cookie from "../../customHook/cookie";
import env from "react-dotenv";

import MultiSection from "../MultiSection"

export default function Decks(){
    const [pack, setPack] = useState('load');
    const [packSearch, setPackSearch] = useState(''); //cerca tra tutti i deck
    const [currentPack, setCurrentPack] = useState(undefined);
    const [listPack , setListPack] = useState(null);
    const [questionPost, setQuestionPost] = useState([]);

  
    //getAllPackGame
    useEffect(() => {
        if(pack === 'load'){
            fetch((env?.URL_SERVER || '')+'/api/game/getAll',{
                method : 'GET',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
            })
            .then((datejson) => datejson.json())
            .then(dati => {
                if(dati.success){
                    setPack(dati?.pack || [])
                    
                }else{setPack(null)}
            });
        }
    })
    
    useEffect(()=>{
        if(currentPack === undefined) return 
        setQuestionPost(new Array(pack[currentPack].mat.length).fill(1))
    }, [currentPack])


    //lista dei pack
    useEffect(() => {
        if(!Array.isArray(pack)) return 
        
        let filter = pack?.filter(packOne => { 
            let regExpfilter = new RegExp(`^${packSearch}`, 'g')  //regExp non va fuori dal ciclo ,
            if(regExpfilter.test(packOne.t)) return true});          //anche se la parola è giusta una volta da true e l'altra false
            
        let list = []
        filter.map((packOne , packIndex) => {  
            list.push(
                <li key={packOne.t+packIndex}>
                    <button onClick={(e) => {
                        e.preventDefault(); 
                        
                        if(currentPack != packIndex) setCurrentPack(packIndex)}}
                    >
                        <p>{packOne.t}</p>
                    </button>
                    
                    <button title="cancella pack"
                        onClick={(e) => {
                            e.preventDefault(); 
                            delietPack(packOne , packIndex)
                        }}
                    >❌</button>                  
                </li>
                
            )
        })
        setListPack(list);
    },[pack, packSearch, currentPack])


    function newPack(){
        let allTitle = [1]
        pack.map(packNew => {
            if(/^(pack )+[0-9]{1,}$/g.test(packNew.t)){
                allTitle.push(Number(/[0-9]{1,}/g.exec(packNew.t)[0])+1)
            }
            
        })
        let bigNum = Math.max(...allTitle);
        
        //costruzione nuovo deck
       pack.push({
            t:`pack ${bigNum}`, 
            mat:[],
            s: false
        })
        setPackSearch('');
        setPack([...pack]);
        setCurrentPack(pack.length -1);
    }

   
    async function savePack(packToSave = pack[currentPack]){

        //deckToSave e il deck da salvare , in caso non si stia salvando una card è inutile passarlo alla funzione
        if(!Boolean(pack[currentPack]?.mat.length)) return alert('devi creare almeno una materia per salvare il pack di domande');
        if(!Boolean(pack[currentPack]?.mat[0].quiz.length)) return alert('devi creare almeno una domanda per salvare il pack di domande')

        let response = await fetch('/api/game/save_pack', {
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                pack: packToSave,
            })
        })
        let dati = await response.json();
        alert(dati.msg)
        if(dati.success) window.location.reload();
        


       
    }

    async function delietPack(packToDelite , index){

        let promptR = prompt('sicuro di vole cancellare il pack , digita "si"')
        if(!promptR || promptR.toLowerCase() !== 'si') return ;

        let dati = {success:true, msg:'pack cancellato'}
        if(packToDelite._id){
            let response = await fetch('/api/game/delete_pack', {
                method : 'DELETE',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    packId: packToDelite._id,
                })
            })
            dati = await response.json();
        }
        if(dati.success){
            pack.splice(index , 1);
            setPack([...pack]);
            setCurrentPack(undefined);
        }
        alert(dati.msg);       
    }



    let body =[];
    if(pack === 'load'){
        body.push(<p key="load-pack">caricamento pagina</p>)
    }else if(!Array.isArray(pack)){
        body.push(<p key="error-pack">errore ricarica la pagina o torna più tardi</p>)
    }else{

        let packList = []
        if(pack[currentPack]?.mat.length > 0){
            pack[currentPack].mat.map((cat , catIndex) => {
                let listDomande = []
  
                cat.quiz.map((dom , domIndex)=> {
                    let rispList = [];
                    dom.answere.map((ris , risIndex)=> {
                        rispList.push(
                        <li key={"ris"+risIndex+"-dom"+domIndex+"-cat"+catIndex}>
                            <div>
                                <label htmlFor={"ris"+risIndex+"-dom"+domIndex+"-cat"+catIndex}>{"risposta "+(risIndex+1)+" :" }</label>
                                <input type="text" value={ris.t} id={"ris"+risIndex+"-dom"+domIndex+"-cat"+catIndex}
                                    onChange={e=>{
                                        pack[currentPack].mat[catIndex].quiz[domIndex].answere[risIndex].t = e.target.value
                                        setPack([...pack]);
                                    }}
                                />
                            </div>
                            <div>
                                <label htmlFor={"cor"+risIndex+"-dom"+domIndex+"-cat"+catIndex}>corretta</label>
                                <input type="checkbox" id={"cor"+risIndex+"-dom"+domIndex+"-cat"+catIndex}
                                    checked={ris?.c || false}
                                    onChange={e=>{
                                        e.preventDefault()
                                        pack[currentPack].mat[catIndex].quiz[domIndex].answere[risIndex].c = e.target.checked;
                                        setPack([...pack]);
                                    }}
                                    />
                            </div>
                            
                            <button onClick={e=>{
                                e.preventDefault()
                                pack[currentPack].mat[catIndex].quiz[domIndex].answere.splice(risIndex,1)
                                setPack([...pack])
                            }}>❌</button>
                        </li>)
                    })
                    
                    listDomande.push(
                    <li key={"dom"+domIndex+"-cat"+catIndex}>
                        <div>
                            <label htmlFor={"dom"+domIndex+"-cat"+catIndex}>domanda:</label>
                            <input type="text" value={dom.q}  id={"dom"+domIndex+"-cat"+catIndex}
                                onChange={e=>{
                                    pack[currentPack].mat[catIndex].quiz[domIndex].q = e.target.value;
                                    setPack([...pack]);
                                }}/>
                        </div>
                        <button title="cancella domanda" 
                        onClick={e=>{
                            e.preventDefault();
                            pack[currentPack].mat[catIndex].quiz.splice(domIndex, 1);
                            setPack([...pack]);
                        }}
                        >dom❌</button>
                        <ul>
                            {rispList}

                            <button onClick={e=>{
                                    e.preventDefault()
                                    pack[currentPack].mat[catIndex].quiz[domIndex].answere.push({t:''})
                                    setPack([...pack])
                                }}>+ris</button>
                            {dom.answere.length > 1 ? 
                                <button onClick={e=>{
                                    e.preventDefault()
                                    pack[currentPack].mat[catIndex].quiz[domIndex].answere.splice(-1,1)
                                    setPack([...pack])
                                }}>-ris</button>
                            : null}
                        </ul>
                        <div>
                            <label htmlFor={"com"+domIndex+"-cat"+catIndex}>commento:</label>
                            <input type="text" value={dom.c}  id={"com"+domIndex+"-cat"+catIndex}
                                onChange={e=>{
                                    pack[currentPack].mat[catIndex].quiz[domIndex].c = e.target.value;
                                    setPack([...pack]);
                                }}/>
                        </div>
                    </li>)
                })


                packList.push(
                <li key={'cat'+catIndex}>
                    <div>
                        <label htmlFor={"cat"+catIndex}>categoria: </label>
                        <input type="text" id={"cat"+catIndex} value={cat.t} onChange={e =>{
                            pack[currentPack].mat[catIndex].t = e.target.value;
                            setPack([...pack])
                        } }/>
                    </div>
                    <button title="cancella categoria" 
                        onClick={e=>{
                            e.preventDefault();
                            pack[currentPack].mat.splice(catIndex, 1);
                            setPack([...pack]);
                            questionPost.splice(catIndex, 1);
                            setQuestionPost([...questionPost]);
                        }}
                    >❌</button>
                    <MultiSection
                        elementi= {listDomande}
                        divisione= {5}  
                        down = {true}
                        postoSezioni = {[questionPost , setQuestionPost]}
                        index= {catIndex}
                        />

                    <button onClick={e=>{
                        e.preventDefault();
                        let allTitle = [1];
                        pack[currentPack].mat[catIndex].quiz.map(domNew => {
                            if(/^(domanda )+[0-9]{1,}$/g.test(domNew.q)){
                                allTitle.push(Number(/[0-9]{1,}/g.exec(domNew.q)[0])+1)
                            }
                            
                        })
                        let bigNum = Math.max(...allTitle);
                        pack[currentPack].mat[catIndex].quiz.push({q:'domanda '+bigNum , c:'' , answere:[{t:''} , {t:''}, {t:''}]})
                        setPack([...pack]);
                        }}
                    >dom +</button>
                    {pack[currentPack].mat[catIndex].quiz.length > 0 
                    ?<button onClick={e=>{
                        e.preventDefault();
                        pack[currentPack].mat[catIndex].quiz.splice( pack[currentPack].mat[catIndex].quiz.length -1, 1)
                        setPack([...pack]);
                        }}
                    >dom -</button>
                    :null}
                    
                </li>)
            })
        }else{
            packList.push(<p key="packList">aggiungi una categoria</p>)
        }

        body.push(
            <div key="corpo-card">
                <div style={{display:'flex'}}>
                    <div style={{minWidth:'300px'}}>
                        <div>
                            <label htmlFor="cercaDeck">cerca Pack</label>
                            <input type='text' id="cercaDeck" name="cercaDeck"
                                value={packSearch}
                                onChange={e => {setPackSearch(e.target.value)}}
                            />
                        </div>
                        <button onClick={e => {e.preventDefault(); newPack();}}>aggiungi pack</button>
                        <ul>
                            {listPack}
                        </ul>
                    </div>
                    {(currentPack === undefined) 
                        ? <div><p>seleziona un pack...</p></div>
                        :<div style={{maxHeight:'100%'}}>
                           
                            <div>
                                <div>
                                    <label htmlFor="titleDeck">Cambia nome al pack</label>
                                    <input type='text' id='titleDeck' name="titleDeck" required={true} minLength={3} maxLength={64}
                                        value={pack[currentPack].t}
                                        onChange={(e) => {
                                            pack[currentPack].t = e.target.value;
                                            setPack([...pack])
                                        }
                                        }
                                    />
                                </div>
                                <button type='button' title='salva tutto il deck' onClick={(e) => {
                                        e.preventDefault();
                                        savePack();
                                    }}>
                                            salva 💾
                                </button>
                                <div>
                                    <label htmlFor="bozzaPack">onLine</label>
                                    <input type='checkbox' id='bozzaPack' name="bozzaPack"
                                        checked={pack[currentPack].s ?? false}
                                        onChange={(e) => {
                                            pack[currentPack].s = e.target.checked;
                                            setPack([...pack])
                                        }
                                        }
                                    />
                                </div>
                                
                            </div>
                            
                            <div>
                               <button onClick={e=>{
                                e.preventDefault();
                                let allTitle = [1];
                                pack[currentPack]?.mat.map(matNew => {
                                    if(/^(categoria )+[0-9]{1,}$/g.test(matNew.t)){
                                        allTitle.push(Number(/[0-9]{1,}/g.exec(matNew.t)[0])+1)
                                    }
                                    
                                })
                                let bigNum = Math.max(...allTitle);
                                pack[currentPack].mat.push({
                                    t: 'categoria '+   bigNum,
                                    quiz: []
                                })
                                setPack([...pack])
                                questionPost.push(1);
                                setQuestionPost([...questionPost])
                               }}>aggiungi categoria</button>
                            </div>
                            <div  style={{display:'flex'}}>
                                {<ul key="packList">
                                    {packList}
                                </ul>} 
                            
                            </div>
                        </div> 
                    }
                </div>
            </div>
                    
          
                    
           
        )
    }


    return (
        <div>
            {body}              
        </div>
    )
}