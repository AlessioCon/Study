class validator {

    res;

    //chiamata delle varie funzioni
    controll(inputs, options){
        for(let input in inputs ){
            let allOption = options[input];
            let option = allOption.split('|');
            for (let singleOption of option){
                let nameFunction = singleOption.split(':')[0];
                let optionFunction = singleOption.split(':');
                optionFunction.shift();

                let res = this[nameFunction](inputs[input] ,optionFunction);
                if (res['err']) return res;
            }
        }
        return {err: false, msg: ''}
    }



//funzioni
    type(input , option){
        if (option[0] == 'email'){
            let regEmail = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z]+(\.[a-zA-Z]+)*$/
            if(!regEmail.test(input)) return {err: true, 'input': input ,msg: 'formato email non valido'}
            return {err: false, msg: ''}; 
        }

        if (option[0] == 'password'){
            let regPassLow = /[a-z]/;
            let regPassUp  = /[A-Z]/;
            let regPassNum = /[0-9]/;
            let regPassSim = /[!"£$%&/=?*@]/
           
            if(
                input.match(regPassLow) == null ||
                input.match(regPassUp)  == null || 
                input.match(regPassNum) == null ||
                input.match(regPassSim) == null  
            ) return {err: true, msg:'password: aggiungi tutti i caratteri richiesti'}
          
            return {err: false, msg: ''}; 
        }

        if (option[0] == 'birth'){
            let regBirth = /(?<!.)((?<!\d)((19|20)\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$)/;
            if (! regBirth.test(input)) return {err: true, 'input': input, msg: 'formato data non valido'};
            return {err: false, msg: ''}; 

        }

        if (option[0] == 'textOnly'){
            let regText = /[a-zA-Z]/g
            if (input.match(regText).length != input.length) return {err: true, 'input': input , msg: 'inserire solo testo'};
            return {err:false, msg:''}
        }

        if (option[0] == 'numberOnly'){
            let regText = /[0-9]/g
            if (typeof parseInt(input) != 'number') return {err: true, msg: 'inserire solo numeri'}
            let numberS = input + '';
            if (numberS.match(regText).length != numberS.length) return {err: true, 'input': input ,msg: 'inserire solo numeri'};
            return {err:false, msg:''}
        }

        if (option[0] == 'txc'){
            let rehTxc = /^(([A-Z]{6})+([0-9]{2})+([A-Z]{1})+([0-9]{2})+([A-Z]{1})+([0-9]{3})+([A-Z]{1}))(?!.)/
            if (! rehTxc.test(input)) return {err: true, 'input': input, msg: 'formato codice fiscale non valido'};
            return {err:false, msg:''}
        }
        
        if (typeof input != option[0]) return {err: true, 'input': input, msg: input + ' è un formato valore non tollerato'}
        return {err: false, msg: ''};
    }
    
    length(input , option){
        let string = option[1];
        if(typeof input === 'number') input = input.toString();

        if (typeof option[1] == 'number') string.toString();
        if (option[0].toString() == '>' && input.length < option[1]) return {err: true, 'input': input, msg: '  lunghezza stringa insifficiente'}
        if (option[0].toString() == '<' && input.length > option[1]) return {err: true, 'input': input, msg: '  lunghezza stringa massima superata'}
        if (option[0].toString() == '=' && input.length != option[1]) return {err: true,'input': input, msg: '  lunghezza stringa non raggiunta'}
        
        return {err: false, msg: ''}
    }

    value(input , option){
        if (option[0] == '>' && input < option[1]) return {err: true, 'input': input, msg: 'valore troppo piccolo'}
        if (option[0] == '<' && input > option[1]) return {err: true, 'input': input, msg: 'valore troppo grande'}
        if (option[0] == '=' && input != option[1]) return {err: true,'input': input, msg: 'il valore non è uguale a ' + option[1]}
        
        return {err: false, msg: ''}
    }

} 


module.exports = validator


/*

type: number , string , boolean ecc...
      email 
      password     
      birth      (controlla se il formato data è giusto YYYY/MM/DD)
      textOnly 
      numberOnly
      txc        (codice fiscale)
      

length:comparazione > < = per somma delle lettere
value: comparazione > < = per numeri




*/