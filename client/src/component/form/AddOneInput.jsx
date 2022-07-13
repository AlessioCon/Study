import {useState} from 'react';



function AddOneInput(props){

    const [nElement, setNElement ] = useState(0);
    const [element, setElement] = useState([]);


    let name = (props.name) ? props.name : 'addOneInput';
    let inputProf= [];

    for(let x= 0; nElement > x ; x++){
        if(!element[x]) element[x] = ['', 'solo modifiche'];

        inputProf.push(
            <div key={`${name}${x+1}`}>

                <label htmlFor={`${name}${x+1}`}>{`${name} ${x+1}`}</label>
                <input type="text" id={`${name}${x+1}`} name={`${name}${x+1}`} placeholder='inserisci il nome utente' required
                    value={(element[x]) ? element[x][0] : ''} 
                    onChange={(e) => {
                        let newElement = Object.values(element)
                        newElement[x][0] = e.target.value; 
                        setElement(newElement);
                        }
                    }
                />
                <select id={`grado${x+1}`} value={element[x][1]}
                    onChange={(e) => {
                        let newElement  = Object.values(element);
                        newElement[x][1]= e.target.value;
                        setElement(newElement);
                    }}
                >
                    <option value="solo modifiche">solo modifiche</option>
                    <option value="illimitato">illimitato</option>
                </select>
                <button onClick={(e) => {
                    e.preventDefault();
                    let newElement = Object.values(element);
                    newElement.splice(x , 1);
                    setElement(newElement)
                    setNElement(nElement - 1)
                }}>X</button>
            </div>
        )

    }

    return (
        <div id="profForm">
            <p>{props.msg}</p>

        {inputProf}

        <button onClick={(e)=> {e.preventDefault() ; setNElement(nElement + 1)}}>+</button>
        <button onClick={(e)=> {e.preventDefault() ; 
            if(nElement > 0)  {
                setNElement(nElement - 1);
                let newElement = Object.values(element);
                newElement.splice(nElement -1 , 1);

                setNElement(nElement - 1);
                setElement(newElement)
            }
            }}>-
            </button>
        </div>
    )
}

export default AddOneInput



/* recupero dati 

let profAccess = document.getElementById('profForm').getElementsByTagName('input');
        let prof= [];
        
        for(let x = 0 ; profAccess.length > x; x++){
            prof.push(
                {
                    name:  profAccess[x].value,
                    grade: data[`grado${x+1}`].value
                }
            )
        };

        let access= {
            c: Cookie.getCookie('user').user, //creatore
            prof: prof
        }
        */