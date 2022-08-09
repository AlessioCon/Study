export default function InputSetting(props){

    let [variabile, setVariabile] = props.variabile // variabile da cambiare
    let nome = props.nome //nome dell' id input 
    let label= props?.label || props.nome //se non è inserita una label usa il nome (che server per l'id)
    let propInput = props.propInput  //'propietà dell'input
    let functionSave = props.fetch //data dell'elemento padre che si occupa di salvare i dati (diversa per ogni situazione )


    function changeBtn(id, state){
        let btn = document.getElementById(id);
    
        if(state === 'active'){
            if(!btn.classList.contains('active')) btn.classList.add('active');
        }else{
            if(btn.classList.contains('active')) btn.classList.remove('active');
        }
    }

    return(
    <form className='form-single' onSubmit={e => {
        e.preventDefault() ; 
        functionSave(nome , variabile , document.getElementById('btn-'+nome));
    }}>
        <label htmlFor={nome}>{label}</label>
        <div>
            <input name={nome} id={nome}  {...propInput}
                value={variabile || ''}
                onChange={e => {
                    setVariabile(e.target.value);
                    changeBtn('btn-'+nome , 'active');
                }}
            />
            <button id={'btn-'+nome} className="btn-form" onClick={e => {
            if(!e.target.classList.contains('active')) return e.preventDefault()
            changeBtn('btn-'+nome , 'disable');
            }}>
            salva
        </button>
        </div>
        
    </form>)   
}



//la funzione fetch sarà all'interno del componente padre e verrà chiamata ogni volta si invia il form

//esempio
//<SingleInput 
//    nome='username'
//    label='user' 
//    variabile={[username, setUserName]} 
//    propInput={{type: 'text', minLength:3 ,maxLength:15, required:true }}
//    fetch={saveInfo}
///>