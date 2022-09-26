const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const passport = require('passport');
const fs = require('fs/promises');
const fsStream = require('fs').createReadStream
const cors = require('cors');
const path = require('path')
let userModel = require('./app/model/userModel');




const app = express();
app.use(helmet());
app.use(fileUpload());

require('dotenv').config();
const port = process.env.PORT || 8080;


//DB CONNECTION 

const DbConnect = require('./app/config/db-connection');
const dbConnect = new DbConnect;
dbConnect.connection();

dbConnect.on('DBConnect', ()=>{
    app.listen(port, () => console.log(`server active on port ${port}`))
})

//---- ------------------    ---------------------------
//codifica richieste
app.use('/api/stripe/webhook', express.raw({type: 'application/json'}))
app.use(express.json({limit: 5000000})); // to accept json data

/*Passport*/
app.use(require('express-session')({ 
    secret: process.env.SESSION_SECRET || 'SuperSecret', 
    resave: true, 
    proxy: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 48,
        httpOnly: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
      },
}));
app.use(passport.initialize());
app.use(passport.session());

//app.use(cors({
//    origin: [process.env.URL_CLIENT || 'http://localhost:3000' , 'http://localhost:5000'],
//    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH', "OPTIONS", "HEAD"],
//    credentials: true
//}));


/* ROUTERS */
const signRouter = require('./app/routes/sign');
const userRouter = require('./app/routes/user');
const corsiRouter = require('./app/routes/corsi');
const cardRouter = require('./app/routes/card');
const lessonRouter = require('./app/routes/lesson');
const simulationRouter = require('./app/routes/simulation');
const stripeRouter = require('./app/routes/stripe');
const masterRouter = require('./app/routes/master')

/* MIDDLEWARE*/
const checkUserLogin = require('./app/middleware/check-user-login');

app.use('/api/sign'  ,  signRouter);
app.use('/api/corsi' ,  corsiRouter);
app.use('/api/lesson',  lessonRouter);
app.use('/api/simulation',  simulationRouter);
app.use('/api/card',  cardRouter);
app.use('/api/user'  ,  checkUserLogin() ,userRouter);
app.use('/api/stripe'  , stripeRouter);
app.use('/api/master', masterRouter);

app.post('/api/download' , async (req,res) => {
 try{
    let read = fsStream(req.body.href);
    //nome
    
    let NameArr = req.body.href.split(/\\/g);
    let attName = NameArr[NameArr.length -1];
    
    read.on('open', () => {
        res.attachment(attName);
        read.pipe(res)
    });
    read.on('error' , err => console.log(err))
 }catch(e){console.log('errore server ooo '+e), res.json({success:'error'})};
   
})

//----------------------------------------------------

const serverIo = require("http").createServer(app);
const io = require("socket.io")(serverIo , 
    {
    cors: {
        origin: process.env.URL_CLIENT || 'http://localhost:3000',
        methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
        credentials: true
      }
}
)

const rooms = {}; //tiene conto di tutti gli utenti di tutte le ROOM
const lastMsg = [] //tiene conto dell' ultimo utente che ha inviato il msg nella relativa ROOM
io.on("connection", (socket) => {
    socket.join(socket.handshake.query.room);
    let room = socket.handshake.query.room

    //controlla la stanza e l'utente
    if(rooms?.[`${room}`]){
        let index = rooms?.[`${room}`]['users'].findIndex(u => u.name === socket.handshake.query.user)
        if(index !== -1){
            rooms[`${room}`]['users'][index] = {idUser: socket.id , name: socket.handshake.query.user || 'User-'+socket.id}
        }else{
            rooms[`${room}`]['users'].push({idUser: socket.id , name: socket.handshake.query.user || 'User-'+socket.id})
        }

    }else{ rooms[`${room}`] = { 
        users: [{idUser: socket.id , name: socket.handshake.query.user || 'User-'+socket.id}],
        lastMsg: ''
    }}


    socket.on("disconnect", (data) => {

        let index = rooms?.[`${room}`]?.['users'].findIndex(e => e.idUser === socket.id )
        rooms?.[`${room}`]?.['users'].splice(index , 1);
                
       
        if(rooms?.[`${room}`]?.['users'].length === 0){ delete rooms[`${room}`];}

        socketUserOnline(rooms?.[`${room}`]?.['users'].length || 0 , socket.handshake.query.room)
    });

    socket.on("send_msg", (data) => {
        if(Boolean(rooms?.[`${room}`]?.['users'])){
            let userName = rooms?.[`${room}`]['users'].find(e => e.idUser === socket.id);
            io.to(data.room).emit('new_msg', {msg: data.msg , user: userName.name });
            rooms[`${room}`].lastMsg = socket.id;
        }
    });


    socketUserOnline(rooms?.[`${room}`]['users'].length || 0 , socket.handshake.query.room)
//
    //socket.onAny((event, ...args) => {
    //    console.log(event, args);
    //  });
    function socketUserOnline(number, room){ io.to(room).emit('userOnline', number) }
})

serverIo.listen(process.env.PortIo, () => console.log(`SocketIo on port ${process.env.PortIo}`));






// --------------------------deployment------------------------------

if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname  , '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client" , "build" , "index.html"))
    })
}


app.get('/', (req, res) => {
    console.log('ciao')
    res.send('api in funzione...')
})
//--------------------------------------------------------------------------