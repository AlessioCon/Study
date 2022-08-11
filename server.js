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

/*ONLINE IMPLEMENTATION*/

//app.use(cors({
//    origin: [process.env.URL_CLIENT || 'http://localhost:3000' , 'http://localhost:5000'],
//    methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH', "OPTIONS", "HEAD"],
//    credentials: true
//}));


if (process.env.NODE_ENV === 'production') {
    // Serve any static files
    app.use(express.static(path.join(__dirname  , '/client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, "client" , "build" , "index.html"))
    })
}

/*ONLINE IMPLEMENTATION*/

/* ROUTERS */
const signRouter = require('./app/routes/sign');
const userRouter = require('./app/routes/user');
const corsiRouter = require('./app/routes/corsi');
const lessonRouter = require('./app/routes/lesson');
const stripeRouter = require('./app/routes/stripe');
const masterRouter = require('./app/routes/master')

/* MIDDLEWARE*/
const checkUserLogin = require('./app/middleware/check-user-login');


app.use(signRouter);
app.use('/api/corsi', corsiRouter);
app.use('/api/lesson', lessonRouter)
app.use('/user', checkUserLogin() ,userRouter);
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

const user = []; //tiene conto di tutti gli utenti di tutte le ROOM
const lastMsg = [] //tiene conto dell' ultimo utente che ha inviato il msg nella relativa ROOM
io.on("connection", (socket) => {
    socket.join(socket.handshake.query.room);

    if(socket.handshake.query.user === 'undefined') socket.handshake.query.user = undefined

    user.push({idUser: socket.id , name: socket.handshake.query.user || 'User-'+socket.id});

    socketUserOnline(user.length, socket.handshake.query.room)
    
    socket.on("disconnect", () => {
        let index ;
        user.map((e, indexE) => {
            if(e.idUser === socket.id) return index = indexE;
        })
        user.splice(index , 1);

        socketUserOnline(user.length, socket.handshake.query.room)
    });

    socket.on("send_msg", (data) => {
        let userName = user.find(e => e.idUser === socket.id)
        io.to(data.room).emit('new_msg', {msg: data.msg , user: userName.name })
        lastMsg[data.room] = socket.id
    });

//
    //socket.onAny((event, ...args) => {
    //    console.log(event, args);
    //  });
    function socketUserOnline(number, room){ io.to(room).emit('userOnline', number) }
})

serverIo.listen(process.env.PortIo, () => console.log(`SocketIo on port ${process.env.PortIo}`));