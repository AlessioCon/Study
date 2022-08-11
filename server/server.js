const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const fs = require('fs');
const cors = require('cors');
const path = require('path')





const app = express();

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
app.use(bodyParser.json({limit: '5mb'}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // to accept json data

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
const lessonRouter = require('./app/routes/lesson');
const stripeRouter = require('./app/routes/stripe');
const masterRouter = require('./app/routes/master')

/* MIDDLEWARE*/
const checkUserLogin = require('./app/middleware/check-user-login');

app.use('/api/sign', signRouter);
app.use('/api/corsi', corsiRouter);
app.use('/api/lesson', lessonRouter)
app.use('/api/user', checkUserLogin() ,userRouter);
app.use('/api/stripe' , stripeRouter);
app.use('/api/master', masterRouter);

app.post('/api/download' , (req,res) => {

    let href= req.body.href
    let base64Image = fs.readFileSync('app'+href, {encoding: 'UTF-8'} ,(err) => {if(err) console.log(err)})
    return res.json({url:base64Image})

    res.static()
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



app.get('/', (req, res) => {
    console.log('ciao')
    res.send('api in funzione...')
})


serverIo.listen(process.env.PortIo, () => console.log(`SocketIo on port ${process.env.PortIo}`));



// --------------------------deployment------------------------------

if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname  , '../client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, "client" , "build" , "index.html"))
    })
}
//--------------------------------------------------------------------------