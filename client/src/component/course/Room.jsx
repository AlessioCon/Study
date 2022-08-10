import { useEffect, useRef, useState } from 'react';

import socketIo from "socket.io-client";
import Cookie from "../../customHook/cookie"
import env from "react-dotenv";

export default function Prova(props){
  const socketRef = useRef();
  const scroll= useRef(false)

  const [users, setUsers] = useState([]);
  const [messages , setMessages] = useState([])
  const [msgInput , setMsgInput] = useState('');

  let save = useRef({user: 'no' , msg:[]});
  let nameRoom = props.room || 'Chat-Globale'

  useEffect(() => {
    socketRef.current = socketIo( env.URL_ROOM ||'http://localhost:3030/' ,{
        query: { 
          user: Cookie.getCookie('user')?.user,
          room: nameRoom
        },
      });

  }, []);

  useEffect(()=>{
    socketRef?.current?.on('new_msg' , (message) => { setMessages((messages) => [...messages, message]);})
    socketRef?.current?.on('userOnline' , (number) => {setUsers(number)} )
  }, [])


/*list msg generation */
let listMsg = [];


for(let x = 0 ; x < messages.length ; x++){
  console.log('prova')
  if(messages[x].user !== save.current.user){
    if(Boolean(save.current.msg.length)){
      listMsg.push(
        <div key={"msg"+x} className="cont_chat-msg">
          <p className="chat-user_msg">{save.current['user']}</p>
          {save.current['msg'].map((e, index) => (
            <p key={"index"+index} className='chat_msg'>{e}</p>
          ))}
        </div>
      )
      save.current.msg = [];
    }
    save.current.user = messages[x].user
    save.current.msg.push(messages[x].msg)  
    
  }else{
    save.current.msg.push(messages[x].msg)
  }
  scroll.current = true
}
  
if(save.current.user === messages?.[messages.length -1]?.user){
  listMsg.push(
    <div key={"msg_ultimo"} className="cont_chat-msg">
      <p className="chat-user_msg">{save.current['user']}</p>
      {save.current['msg'].map((e, index) => (
        <p key={"index"+index} className='chat_msg'>{e}</p>
      ))}
    </div>
  )
  scroll.current = true
}

save.current = {user: 'no' , msg:[]}


function scrollY(){
  let div = document.getElementById('scroll-chat') 
  if(div){div.scrollTop = div.scrollHeight }
  scroll.current = false
}

useEffect(()=>{
  scrollY()
}, [messages])





/*///////////////////////////////////////////////////////*/
  return (
    <div className='cont_chat'>
      <div className='cont_chat-view'>
        <h2 className='chat_title'>{nameRoom}</h2>
        <p>utenti attivi: {users}</p>

        <div className='cont_chat-Allmsg' id="scroll-chat">
          {listMsg}  
        </div>
      </div>

      <form className='form-chat' onSubmit={e =>{
          e.preventDefault();
          socketRef?.current?.emit('send_msg', {msg: msgInput , room: nameRoom});
          setMsgInput('');
      }}>
        <div className='cont_input-chat'>
          <label>Messaggio</label>
          <input name="msgInput" id="msgInput" placeholder='Messaggio' required
            value={msgInput || ''}
            onChange={e => setMsgInput(e.target.value)}
          />
        </div>
        
        <button 
          className={(Boolean(msgInput)) ? 'btn btn-chat' : 'btn btn-chat btn-chat-off'}
        >invia</button>
      </form>
    </div>
  )



}