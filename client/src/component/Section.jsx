export default function Sezioni(props){
    let [posto , setPostoSezioni]  = props.postoSezioni;
    
    let elementi = (props.elementi) ? props.elementi : [];    //elementi da mostrare
    let divisione = (props.divisione) ? props.divisione : 10; //quanti elementi insieme
    let down = props.down  ;                                  //buleano, indica se i tastini devono stare sotto


    let navDivisione = []
    for (let x = 1 ; x <= (Math.ceil(elementi.length/divisione)) ; x++){
        navDivisione.push(
            <li key={"list"+x}>   
                <button onClick={(e) => {e.preventDefault() ; setPostoSezioni(x)}}>{x}</button>
            </li>
        )
    }
  
    let sliceElement   = elementi.slice((posto-1)*divisione, posto*divisione);

    return (
        <div>
            <ul>{navDivisione}</ul>
            <ul>{sliceElement}</ul>
            {(down) ? <ul>{navDivisione}</ul> : null}
        </div>
    )
}