export default function Sezioni(props){
    let [posto , setPostoSezioni]  = props.postoSezioni;
    
    let elementi = (props.elementi) ? props.elementi : [];    //elementi da mostrare
    let divisione = (props.divisione) ? props.divisione : 10; //quanti elementi insieme
    let down = props.down  ;                                  //buleano, indica se i tastini devono stare sotto
    let index = props.index;                                   //index della sezione

    let navDivisione = []
    for (let x = 1 ; x <= (Math.ceil(elementi.length/divisione)) ; x++){
        navDivisione.push(
            <li key={"list"+x}>   
                <button onClick={(e) => {
                    e.preventDefault() ; 
                    let posti = [...posto];
                    posti[index] = x;
                    setPostoSezioni(posti)
                }}>{x}</button>
            </li>
        )
    }
  
    let sliceElement   = elementi.slice((posto[index]-1)*divisione, posto[index]*divisione);

    return (
        <div className='section'>
            <ul className='count'>{navDivisione}</ul>
            <ul className='element'>{sliceElement}</ul>
            {(down) ? <ul className='count'>{navDivisione}</ul> : null}
        </div>
    )
}




/*
<MultiSection
elementi= {item} //lista elementi
divisione= {5}   //numero di elementi per sezione
down = {true}
postoSezioni = {[posto , setPostoSezioni]} arry per posti
index= {x}
/>
*/