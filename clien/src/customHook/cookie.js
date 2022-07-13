class Cookie {

    static setCookie(name, value , day){

        let Svalue = JSON.stringify(value);

        const d = new Date();
        d.setTime(d.getTime() + (day*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = `${name}=${Svalue}; ${expires}; path='/'`;
    }
    
    static getCookie(name) {
        let xname = name  + "=";
        let array = document.cookie.split(';');
        let reg = new RegExp(`${xname}+{`, 'i')
        let filter = array.find(value => reg.test(value));
        if (filter !== undefined){
            let str = filter.slice(xname.length);
            return JSON.parse(str)
        }
        
        return undefined
    }

    static deliteCookie(name){
        document.cookie = `${name}= ; expires=${new Date().toUTCString()};path=/;`;
    }
    


}







export default Cookie