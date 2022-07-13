import React from 'react';



export default function Paymants(){

    async function pagamento(e){
        e.preventDefault();

    }



    return(
        <button
            onClick={(e)=>{pagamento(e)}}
        
        >paga</button>
    )
}






