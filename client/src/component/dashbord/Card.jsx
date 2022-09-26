import { useState ,  useEffect , useRef } from "react";

import env from "react-dotenv";
import Cookie from "../../customHook/cookie";
import { Elements, PaymentElement, useStripe, useElements} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise  = loadStripe('pk_test_51LLMdvHq8ifjUZsHgfMxSN7pZRlpa8xzi5nYAb3Fs71wSbevteSERApmF9gAvLAH9o3fYxwFlyqLxwXaiReX6II100yaJyL8fK');

function CheckoutForm(prop){
    const stripe = useStripe();
    const elements = useElements();
  
    const [errorMessage, setErrorMessage] = useState(null);
  
    const handleSubmit = async (event) => {
      // We don't want to let default form submission happen here,
      // which would refresh the page.
      event.preventDefault();
  
      if (!stripe || !elements) {
        // Stripe.js has not yet loaded.
        // Make sure to disable form submission until Stripe.js has loaded.
        return;
      }
  
      const {error} = await stripe.confirmPayment({
        //`Elements` instance that was used to create the Payment Element
        elements,
        confirmParams: {
            return_url: window.location.origin  + "/stripe/itemStatus/?idItems="+prop.idDeck
        },
      });
  
  
      if (error) {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Show error to your customer (for example, payment
        // details incomplete)
        setErrorMessage(error.message);
      } else {
        // Your customer will be redirected to your `return_url`. For some payment
        // methods like iDEAL, your customer will be redirected to an intermediate
        // site first to authorize the payment, then redirected to the `return_url`.
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <button disabled={!stripe}>Invia</button>
        {/* Show error message to your customers */}
        {errorMessage && <div>{errorMessage}</div>}
      </form>
    )
}

async function downloadFile(href , set){
    try{
        let response = await fetch((env?.URL_SERVER || '') + '/api/download', {
            method: "POST",
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({
                href: href,
            })
        })
        let blobImg = await response.blob();
        const reader = new FileReader();

        reader.onload = () =>{                           
            set(['name', reader.result, false]);
        }
        
        reader.readAsDataURL(blobImg);
         
     }catch(e){console.log('errore download')}
};




export default function Decks(){
    const [decks, setDecks] = useState('load');
    const [deckSearch, setDeckSearch] = useState(''); //cerca tra tutti i deck
    const [cardSearch, setCardSearch] = useState(''); //cerca tra tutte le catre del singolo deck

    const [currentDeck, setCurrentDeck] = useState(undefined);
    const [currentCard , setCurrentCard] = useState(false);//permette la modifica della card
    const [currentDeckShop , setCurrentDeckShop] = useState(null);//permette la visualizzazione della schermata delle card in vendita

    const [listDecks ,setListDecks] = useState([])//tutti i deck in formato html (react)
    const [listCards ,setListCards] = useState([])//tutte le card in formato html (react)
    const [listDecksShop , setListDecksShop] = useState([])//tutti i deck in vendita in formato html (react)

    const [titleCard, setTitleCard] = useState('');
    const [bodyCard, setBodyCard] = useState('');
    const [cardimg, setCardimg] = useState(null);

    const [retroCard, setRetroCard] = useState('');
    const [retroCardimg, setRetroCardimg] = useState(null);
    const [colorCard, setColorCard] = useState('#ff11ff')
    const [change, setChange] = useState(false); //controllo stato salvataggio decks

    const [deckShop, setDeckShop] = useState(undefined); //i deck in vendita


    //vendita
    let isCardV = useRef(Cookie.getCookie('user').grade.includes('card'));//se l'user è un venditore
    let [prezzo , setPrezzo] = useState(0);
    let [sconto , setSconto] = useState(0);
    let [bozza , setBozza] = useState(true);

    let [from , setFrom] = useState(0); //da dove partire nel db per la ricerca delle card
    let [continueFrom, setContinueFrom] = useState(true) //indica se sono finiti i deck in vendita
    let [master, setMaster] = useState('verifica') //indica se sono finiti i deck in vendita

    const [clientSecret ,setClientSecret] = useState(null);
    const [itemIdBuy, setItemIdBuy] = useState(null)
//const [idMaster , setIdMaster] = useState

    //id utente
    let userId = useRef(Cookie.getCookie('user')._id);

   //master
    if(master === 'verifica'){
        if(Cookie.getCookie('user').grade.includes('master')){    
            fetch((env?.URL_SERVER || '') + '/api/master/', {
                method: "POST",
                body: JSON.stringify({id: Cookie.getCookie('user')._id}),
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                .then((datejson) => datejson.json())
                .then(dati => {
                    if(!dati.success) return undefined;
                    const params = new URLSearchParams(window.location.search);
                    if(params.get("user")) userId.current = params.get("user")
                    setMaster(true)
                    isCardV.current = true
                }); 
        }else{
            setMaster(false)
        }
    }
    
   

    //getAlldecks
    useEffect(() => {
        if(master === 'verifica') return
        fetch((env?.URL_SERVER || '')+'/api/card/getDeckUser',{
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({userId: userId.current})
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(dati.success){
                setDecks(dati?.decks || [])
            }else{setDecks(null)}
        });

    },[userId, master])

    //getAlldecksInShop
    useEffect(() => {
        if(master === 'verifica') return
        let btn = document.getElementById("btn-load");
      
        if(btn){
            btn.classList.add('btn-load');
            btn.innerHTML = ''
        }
        fetch((env?.URL_SERVER || '')+'/api/card/getDeckSeller', {
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({from: from , userId: userId.current})
        })
        .then((datejson) => datejson.json())
        .then(dati => {
            if(btn){
                btn.classList.remove('btn-load');
                btn.innerHTML = 'carica altri decks';
            }

            if(dati.decks.length < 10) setContinueFrom(false);
            if(!dati.success) return setDeckShop([]);
            if(deckShop === undefined) return setDeckShop(dati.decks);
            deckShop.push(...dati.decks);
            return setDeckShop([...deckShop]);
        })

    }, [from, master])

    //lista dei deck
    useEffect(() => {
        if(!Array.isArray(decks)) return 
        
        let filter = decks?.filter(deck => { 
            let regExpfilter = new RegExp(`^${deckSearch}`, 'g')  //regExp non va fuori dal ciclo ,
            if(regExpfilter.test(deck.t)) return true});          //anche se la parola è giusta una volta da true e l'altra false
            
        let list = []
        filter.map((deck , deckIndex) => {  
            list.push(
                <li key={deck.t+deckIndex}>
                    <button onClick={(e) => {
                        e.preventDefault(); 
                        
                        if(currentDeck != deckIndex) setCurrentDeck(deckIndex)}}
                    >
                        <p>{deck.t}</p>
                        <p>{deck?.cards?.length || 0}</p>
                    </button>
                    {deck.c === userId.current 
                    ?<button title="cancella deck"
                        onClick={(e) => {
                            e.preventDefault(); 
                            delietDeck(deck , deckIndex)
                        }}
                    >❌</button>
                    :undefined
                }
                    
                </li>
                
            )
        })
        setListDecks(list);
    },[decks, deckSearch, currentDeck])

    //display All card of deck
    useEffect(() => {

        function leftBtn(index){
            if(index === 0) return undefined
            return (
                <button title="sposta la carta a sinistra" onClick={(e) =>{

                    let card = decks[currentDeck].cards[index]
                    decks[currentDeck].cards.splice(index , 1)
                    decks[currentDeck].cards.splice(index-1 , 0 , card)
                  
                    setDecks([...decks])


                }}>
                      👈 
                </button>
            )
        }
        function rigthBtn(index){
            if(index >= decks[currentDeck].cards.length) return undefined;
            return (
                <button title="sposta la carta a destra" onClick={() =>{

                    let card = decks[currentDeck].cards[index]
                    decks[currentDeck].cards.splice(index , 1)
                    decks[currentDeck].cards.splice(index + 1 , 0 , card)
                
                    setDecks([...decks])
                }}>
                  👉
                </button>
            )
        }



        if(!Array.isArray(decks)) return ;
        //cambia i dati di vendita
        if(isCardV.current){
            let deck =  decks[currentDeck];
            setPrezzo(deck?.stripe?.sale?.p || 0.5);
            setSconto(deck?.stripe?.sale?.o || 0);
            setBozza((deck?.s === true) ? false : true);
        }

        let filter = decks[currentDeck]?.cards.filter(card => { 
            let regExpfilter = new RegExp(`^${cardSearch}`, 'g')  //regExp non va fuori dal ciclo ,
            if(regExpfilter.test(card.t)) return true}) || [];

        let list = []
        filter.map((card , cardIndex) => {  
            list.push(
                <div key={card.t+cardIndex} style={{backgroundColor: card?.cc || '#ffffff'}}>
                    <p>{card.t}</p>
                    <p>{card.b}</p>
                    
                    {decks[currentDeck].c === userId.current ? leftBtn(cardIndex) : null}
                    <button title={decks[currentDeck].c === userId.current ?'modifica' : 'zoom +'} onClick={(e) => {
                       e.preventDefault();
                        setTitleCard(card.t);
                        setBodyCard(card.b);
                        setRetroCard(card.bb);
                        setColorCard(card?.cc || '#ffffff');
                        setCardimg(card?.fimg || null);
                        setRetroCardimg(card?.bimg || null);
                        setCurrentCard(cardIndex);
                    }}>
                    {decks[currentDeck].c === userId.current ?'⚙️' : '🔎'}
                    </button>
                    {decks[currentDeck].c === userId.current ? rigthBtn(cardIndex) : null}

                    
                    
                       
                </div>
                
            )
        })
        setListCards(list);
    },[currentDeck , cardSearch, decks])
    
    //display all card of deckShop
    useEffect(() => {
        if(!Array.isArray(decks)) return 
             
        let list = []
        deckShop?.map((deck , deckIndex) => {  
            deck.outlet = deck.outlet.toString().replace('.',',');
            deck.price = deck.price.toString().replace('.',',');

            list.push(
                <div key={deck.t+deckIndex}>
                    <p>{deck.t}</p>
                    {deck.outlet > 0 
                    ?<p>prezzo:{deck.price} € , scontato ora a : {deck.price} €</p>
                    :<p>prezzo:{deck.price} €</p>}
                    <p>quantità cards: {deck.nCard}</p>
                    <button title="vedi cards" onClick={(e) => setCurrentDeckShop(deckIndex)}>🔎</button>
                    <button title="compra deck" onClick={async (e) => {setItemIdBuy(deck._id); await buyItems(deck.idStripe)}}>🛒</button>
                </div>
                
            )
        })
        setListDecksShop(list);
    },[deckShop])


    async function buyItems(id){
    try{
        let response = await fetch((env?.URL_SERVER || '' ) + '/api/stripe/buy-deck', {
            method: 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({idStripe: id , idUser: userId.current})
        })

        let data = await response.json();

        if(!data.success) return false;
        setClientSecret(data.clientSecret);

    }catch(e){if(e) console.log(e)}
    }

    function newDeck(){
        let allTitle = [1]
        decks.map(deck => {
            if(/^(deck )+[0-9]{1,}$/g.test(deck.t)){
                allTitle.push(Number(/[0-9]{1,}/g.exec(deck.t)[0])+1)
            }
            
        })
        let bigNum = Math.max(...allTitle);
        
        //costruzione nuovo deck
       decks.push({
            t:`deck ${bigNum}`, 
            c:Cookie.getCookie('user')._id,
            cards:[],
            s: false
        })
        setDeckSearch('');
        setDecks([...decks]);
        setCurrentDeck(decks.length -1);
        if(!change) setChange(true);
    }

    function newCard(){
        let cards = decks[currentDeck]?.cards || 0;
        let allTitle = [0]
        cards.map(card => {
            if(/^(card )+[0-9]{1,}$/g.test(card.t)){
                allTitle.push(Number(/[0-9]{1,}/g.exec(card.t)[0])+1)
            }
        })
        let bigNum = Math.max(...allTitle)

        //costruzione nuovo deck
        decks[currentDeck].cards.push({
            t:`card ${bigNum}`, 
            b: 'nuova card...',
            bb: 'retro...',
            cc: '#ffffff',
            fImg:'',
            bImg:'',
        })
        setCardSearch('');
        setDecks([...decks]);
        if(!change) setChange(true);
    }

    async function saveDeck(deckToSave = decks[currentDeck]){
        //deckToSave e il deck da salvare , in caso non si stia salvando una card è inutile passarlo alla funzione
        if(!Boolean(decks[currentDeck]?.cards.length)) return alert('devi creare almeno una card per salvare il deck')

        if(decks[currentDeck]?.stripe?.id){
            decks[currentDeck].stripe.sale = {p:prezzo , o:sconto};
            decks[currentDeck].s = (bozza) ? false : true;
            setDecks([...decks])
        }

        let response = await fetch('/api/card/save_deck', {
            method : 'POST',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify({
                userId: userId.current,
                deck: deckToSave,
            })
        })
        let dati = await response.json();
        alert(dati.msg)
        if(dati.success){
            if(dati.id){
                decks[currentDeck]._id = dati.id;
                setDecks([...decks]);
            };

            if(dati.stripeId){
                decks[currentDeck].stripe.id = dati.stripeId;
                setDecks([...decks]);
            }
            if(change) setChange(false);
        }


       
    }

    async function delietDeck(deck , index){

        let promptR = prompt('sicuro di vole cancellare il deck , digita "si"')
        if(!promptR || promptR.toLowerCase() !== 'si') return ;

        let isOnStripe= deck?.stripe?.id || false;
        let dati = {success:true, msg:'deck cancellato'}
        if(deck._id){
            let response = await fetch('/api/card/delete_deck', {
                method : 'DELETE',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                },
                body: JSON.stringify({
                    deckId: deck._id,
                    isOnStripe: isOnStripe,
                })
            })
            dati = await response.json();
        }
        if(dati.success){
            decks.splice(index , 1);
            setDecks([...decks])
            setCurrentDeck(undefined)
            if(change) setChange(false);
        }
        alert(dati.msg)


       
    }

    async function sellDeck(btn){
        let textbtn = btn.innerHTML;
        btn.innerHTML = ''
        if(!btn.classList.contains('btn-pending')){
            btn.classList.add('btn-pending');

            if(!decks[currentDeck]?.stripe) decks[currentDeck].stripe = {sale: {p: prezzo , o:sconto} , s: false};
            decks[currentDeck].stripe.sale = {p:prezzo , o:sconto};
            decks[currentDeck].s = (bozza) ? false : true;
            setDecks([...decks])

            if(!Boolean(decks[currentDeck]?.cards?.length)){ 
                btn.classList.remove('btn-pending');
                btn.innerHTML = textbtn;
                
                return alert('per vendere questo deck devi aggiungere delle carte')
            }else{
                let response = await fetch('/api/card/save_deck', {
                    method : 'POST',
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Credentials": true,
                    },
                    body: JSON.stringify({
                        userId: userId.current,
                        deck:decks[currentDeck],
                        sell: true,
                    })
                })
                let dati = await response.json();
                if(dati.success){
                    if(dati.id){   
                        decks[currentDeck]._id = dati.id;
                        setDecks([...decks]);
                    };
        
                    if(dati.stripeId){
                        decks[currentDeck].stripe.id = dati.stripeId;
                        setDecks([...decks]);
                    }
                    if(change) setChange(false);
                }
                alert(dati.msg)
                if(dati.success){ if(change) setChange(false);}
            }

        
            btn.classList.remove('btn-pending');
            btn.innerHTML = textbtn;
        }
    }

    const options = {
        // passing the client secret obtained in step 2
        clientSecret: clientSecret,
        // Fully customizable with appearance API.
        appearance: {theme: 'stripe'},
    };

    let body =[];
    if(decks === 'load'){
        body.push(<p key="load-decks">caricamento pagina</p>)
    }else if(!Array.isArray(decks)){
        body.push(<p key="error-decks">errore ricarica la pagina o torna più tardi</p>)
    }else{

        let modifayCard = []
        if(currentCard !== false){
            if(decks[currentDeck]?.c === userId.current){
                if(cardimg && typeof cardimg === 'string') {
                       downloadFile(cardimg, setCardimg)
                }
                if(retroCardimg && typeof retroCardimg === 'string') {
                    downloadFile(retroCardimg, setRetroCardimg)
             }
                //console.log(retroCardimg)

                modifayCard.push(
                    <form onSubmit={(e) => {e.preventDefault(); saveDeck()}} key="modifica-Card">
                        <button type='button' title='torna indietro' onClick={(e) => {
                            e.preventDefault();
                            setCurrentCard(false);
                        }}>
                                ⬅️
                        </button>
                        <div>
                            <label htmlFor="colorCard">colore card</label>
                            <input type='color' id='colorCard' name="colorCard" required={true} minLength={3} maxLength={64}
                                value={colorCard}
                                onChange={(e) => {setColorCard(e.target.value); setChange(true)}}
                            />
                        </div>
                        <div className="card" style={{backgroundColor: colorCard || '#ffffff'}}>
                            <div className="front">
                                <div>
                                    <label htmlFor="titleCard">modifica il titolo</label>
                                    <input type='text' id='titleCard' name="titleCard" required={true} minLength={3} maxLength={64}
                                        value={titleCard}
                                        onChange={(e) => {setTitleCard(e.target.value); setChange(true)}}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="bodyCard">modifica body</label>
                                    <textarea type='text' id='bodyCard' name="bodyCard"  maxLength={1000} required={true}
                                        value={bodyCard}
                                        onChange={(e) => {setBodyCard(e.target.value); setChange(true)}}
                                    />
                                </div>



                                <div>
                                    <label htmlFor='filesFront'>inserisci immagine</label>
                                    <input type="file" id="filesFront" name="filesFront" accept=".png, .jpeg, .jpg" style={{display:'none'}}
                                        onChange={(e) => {
                                            for (const key in e.target.files){
                                                if(!isNaN(key)){
                                            
                                                if(e.target.files[key].size < (1*1048576)){
                                                    //nome file ottenuto
                                                    let reader = new FileReader();
                            
                                                    reader.onload = () =>{                       
                                                        setCardimg([e.target.files[key].name, reader.result]);
                                                        setChange(true);
                                                    }
                                                    reader.readAsDataURL(e.target.files[key]);
                                                }else{ 
                                                    alert('inserire file minori di 1mb');
                                                }
                                            }}
                                        }}
                                    />
                        
                                    <img src={cardimg ? cardimg[1] : '../public/img-load.jpg'} style={{maxWidth:"100px" , maxHeight:"100px"}}/>
                                    <button
                                        style={{display:(cardimg) ? 'inline' : 'none'}}
                                        onClick={e => {
                                            e.preventDefault();
                                            setChange(true);
                                            setCardimg(null);
                                        }}
                                    >X</button>
                                </div>

                               
                            </div>
                            <div className="back">
                                <div>
                                    <label htmlFor="retroCard">modifica retro</label>
                                    <textarea type='text' id='retroCard' name="retroCard"  maxLength={1000} required={true}
                                        value={retroCard}
                                        onChange={(e) => {setRetroCard(e.target.value); setChange(true)}}
                                    />
                                </div>

                                <div>
                                    <label htmlFor='filesBack'>inserisci immagine</label>
                                    <input type="file" id="filesBack" name="filesBack" accept=".png, .jpeg, .jpg" style={{display:'none'}}
                                        onChange={(e) => {
                                            for (const key in e.target.files){
                                                if(!isNaN(key)){
                                            
                                                if(e.target.files[key].size < (1*1048576)){
                                                    //nome file ottenuto
                                                    let reader = new FileReader();
                            
                                                    reader.onload = () =>{                                    
                                                        setRetroCardimg([e.target.files[key].name, reader.result]);
                                                        setChange(true);
                                                    }
                                                    reader.readAsDataURL(e.target.files[key]);
                                                }else{ 
                                                    alert('inserire file minori di 1mb');
                                                }
                                            }}
                                        }}
                                    />
                                    
                                    <img src={retroCardimg ? retroCardimg[1] : '../public/img-load.jpg'} style={{maxWidth:"100px" , maxHeight:"100px"}}/>
                                    <button
                                        style={{display:(cardimg) ? 'inline' : 'none'}}
                                        onClick={e => {
                                            e.preventDefault();
                                            setChange(true);
                                            setCardimg(null);
                                        }}
                                    >X</button>
                                </div>
                            </div>
                                
                        </div>
                        

                        <button type='submit' title='salva'
                            onClick={(e) => {
                                e.preventDefault(); 
                                decks[currentDeck].cards[currentCard].t = titleCard;
                                decks[currentDeck].cards[currentCard].b = bodyCard;
                                decks[currentDeck].cards[currentCard].bb = retroCard;
                                decks[currentDeck].cards[currentCard].cc = colorCard;
                                decks[currentDeck].cards[currentCard].fileFront = cardimg
                                decks[currentDeck].cards[currentCard].fileBack = retroCardimg;
                        
                                setDecks([...decks]);
                                setCurrentCard(false);
                                if(change) setChange(false);
                                saveDeck(decks[currentDeck])}}
                        >💾</button>
                        <button type='button' title='ellimina' 
                            onClick={(e) => {
                                e.preventDefault(); 
                                let prom = prompt('vuoi cancellare la card? digita "si"')
                                if(!prom || prom.toLowerCase() !== 'si') return

                                decks[currentDeck].cards.splice(currentCard , 1)
                                setDecks([...decks]);
                                setCurrentCard(false);
                                if(change) setChange(false);
                                saveDeck(decks[currentDeck])}}
                        >❌</button>
    
                    </form>
                )
            }else{
                modifayCard.push(<div key="espandi-Card">
                        <button type='button' title='torna indietro' onClick={(e) => {
                            e.preventDefault();
                            setCurrentCard(false);
                        }}>
                                ⬅️
                        </button>
                        <div className="card" style={{backgroundColor: colorCard}}
                            onClick={(e)=> {
                              e.currentTarget.classList.toggle('retro')
                          }}>
                            <div>
                                <p>{titleCard}</p>
                                <p>{bodyCard}</p>
                            </div>
                            <div>
                                <p>{retroCard}</p>
                            </div>
                           

                        </div>
                    </div>)
            }
            
        }

        body.push(
            <div key="corpo-card">
                <div style={{display:'flex'}}>
                    <div style={{minWidth:'300px'}}>
                        <div>
                            <label htmlFor="cercaDeck">cerca deck</label>
                            <input type='text' id="cercaDeck" name="cercaDeck"
                                value={deckSearch}
                                onChange={e => {setDeckSearch(e.target.value)}}
                            />
                        </div>
                        <button onClick={e => {e.preventDefault(); newDeck();}}>nuovo deck +</button>
                        <ul>
                            {listDecks}
                        </ul>
                    </div>
                    {(currentDeck === undefined) 
                        ? <div><p>seleziona un deck...</p></div>
                        :<div style={{maxHeight:'100%'}}>
                            {decks[currentDeck]?.c === userId.current
                            ?<div>
                                <div>
                                    <label htmlFor="titleDeck">Cambia nome al deck</label>
                                    <input type='text' id='titleDeck' name="titleDeck" required={true} minLength={3} maxLength={64}
                                        value={decks[currentDeck].t}
                                        onChange={(e) => {
                                            decks[currentDeck].t = e.target.value;
                                            setDecks([...decks])
                                        }
                                        }
                                    />
                                </div>
                                <button onClick={(e)=> {e.preventDefault(); newCard()}}>aggiungi card+</button>
                                <button type='button' title='salva tutto il deck' onClick={(e) => {
                                        e.preventDefault();
                                        saveDeck();
                                    }}>
                                            💾
                                    </button>
                             </div>
                            
                                
                            :<p>deck acquistato</p>
                            }
                            <div>
                                <label htmlFor="cercaCard">cerca card</label>
                                <input type='text' id="cercaCard" name="cercaCard"
                                    value={cardSearch}
                                    onChange={e => {setCardSearch(e.target.value)}}
                                />
                            </div>
                            <div  style={{display:'flex'}}>
                                {listCards}
                            </div>
                        </div> 
                    }
                </div>
                <div>                    
                    {modifayCard}
                </div>

                {(isCardV.current && decks[currentDeck]?.c === userId.current)? 
                    <form onSubmit={e => {e.preventDefault() ; sellDeck(e.target.elements['selldeck-btn'])}}>
                        <div>
                            <label htmlFor="prezzo">Prezzo</label>
                            <input type='number' value={prezzo} required={true}  min={'0,50'}
                                    id='number' name='number'
                                    onChange={e => setPrezzo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="sconto">Sconto</label>
                            <input type='number' value={sconto} min={0} id='sconto' name='sconto'
                                    onChange={e => setSconto(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="bozza">Bozza</label>
                            <input type='checkbox' checked={bozza || false} 
                                    id='bozza' name='bozza'
                                    onChange={e => { setBozza(e.target.checked)}}
                            />
                        </div>
                        {(decks[currentDeck].block) 
                        ? <p>questo deck è stato bloccato per la vendita</p>
                        :undefined
                        }
                        <button name='selldeck-btn'>vendi Deck</button>
                    </form>
                
                :undefined}
            </div>
                    
          
                    
           
        )
    }


    return (
        <div>
            {(master === 'verifica') 
            ?<p>caricamento...</p>
            :
            <div>
                {body}
                {(listDecksShop.length < 1 )
                 ? <p>al momento non ci sono deck in vendita</p>
                 :
                    <div>
                        <p>compra i deck che fanno al caso tuo</p>
                        {listDecksShop}
                        {currentDeckShop !== null
                        ?
                        <div>
                            <button title='esci' onClick={e => setCurrentDeckShop(false)}>⬅️</button>
                        {deckShop[currentDeckShop].cards.map((card , cardIndex) => {
                            return (
                                <div key={card.t+cardIndex}>
                                    <p>{card.t}</p>
                                    <p>{card.b}</p>
                                </div>)
                        })}
                        <div>
                            + {deckShop[currentDeckShop].nCard - 2}
                        </div>

                        </div> 
                        : undefined}
                        {continueFrom ? <button id="btn-load" onClick={e => {
                            if(e.target.classList.contains('btn-pending')) return;
                            setFrom(from + 10)}}>carica altri decks</button> : undefined}
                    </div>
                }
                
                
                {clientSecret ?
                <Elements stripe={stripePromise} options={options}>
                    <CheckoutForm idDeck={itemIdBuy}/>
                </Elements>
                :undefined
                }
            
            </div>
        
            }
        </div>
       
    )
}


