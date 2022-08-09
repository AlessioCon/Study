export default function Input(props){

    let [variabile, setVariabile] = props.variabile // variabile da cambiare
    let nome = props.nome //nome dell' id input
    let label= props?.label || props.nome //se non è inserita una label usa il nome (che server per l'id)
    let propInput = props.propInput  //'propietà dell'input


    return(
        <div className={'input_container'}>
            <input name={nome} id={nome}  placeholder=' ' {...propInput}
                value={variabile || ''}
                onChange={e => {
                    setVariabile(e.target.value);
                }}
            />
             <label htmlFor={nome}>{label}</label>
        </div>
   )   
}


//esempio
//<Input 
//    nome='username'
//    label='user' 
//    variabile={[username, setUserName]} 
//    propInput={{type: 'text', minLength:3 ,maxLength:15, required:true }}
///>