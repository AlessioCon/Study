import { useEffect, useState } from 'react';
import {useParams} from 'react-router-dom';


async function downloadFile(href){
   try{
    let response = await fetch('/api/download', {
        method: "POST",
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify({
            href: href,
        })
      })
    let data = await response.json();
    

    let fileTypeIndex = href.split('/').length -1;
    let fileType = href.split('/')[fileTypeIndex]

    const link = document.createElement("a");
    link.href = data.url;
    link.setAttribute("download", fileType); //or any other extension
    document.body.appendChild(link);
    link.click()    
    


    }catch(e){console.log(e)}
        //.then(response => {
        //  response.arrayBuffer().then(function(buffer) {
        //    const url = window.URL.createObjectURL(new Blob([buffer]));
        //    const link = document.createElement("a");
        //    link.href = url;
        //    link.setAttribute("download", "image.png"); //or any other extension
        //    document.body.appendChild(link);
        //    link.click();
        //  });
        //})
};



export default function Corso(){
    const [corso , setCorso] = useState(0);
    
    let param = useParams();
    
    useEffect(()=>{
        let getCourse = async () =>{
            if(corso) return ;
            try{
                let response = await fetch(`/api/corsi/${param.name}`, {
                    method: "GET",
                    headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Credentials": true,
                    },
                })
                let data = await response.json();
                if(!data.success || data.data.s === 'true') return;
                return setCorso(data.data);
    
            }catch(e){console.log(e);}
        }
        getCourse();
    })
   
    function displayCourse(){

        return(
            <div>
                <h1>{corso.t}</h1>
                <p>{corso.d}</p>
                <p>prezzo = {corso.sale.p} €</p>
                {(corso.sale.o) ? <p>scontato adesso a = {corso.sale.o} €</p> : null}
                <div>
                    <h3>cosa contiene il corso</h3>
                    <ul>
                    {corso.chapter.map((capitolo) =>{
                        return (<li key={capitolo.t}>
                           {capitolo.t}
                            <ul>
                                {capitolo.lesson.map((lesson) =>{
                                    return <li key={lesson}>{lesson}</li>
                                })}
                            </ul>
                        </li>)
                    })}
                    </ul>
                    
                </div>
                <a href="" onClick={e => {
                    e.preventDefault()
                    downloadFile(corso.img)}} >scarica foto corso</a>
            </div>
           

        )
    }

    return (
        <main>
        {(corso) ? displayCourse() : <h1> caricamento...</h1>  }
        
        </main>  
    )
    
    
}