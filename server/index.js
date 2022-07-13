const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const fs = require('fs');

 

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



app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use


/* ROUTERS */
const signRouter = require('./app/routes/sign');
const userRouter = require('./app/routes/user');
const corsiRouter = require('./app/routes/corsi');
const lessonRouter = require('./app/routes/lesson');

/* MIDDLEWARE*/
const checkUserLogin = require('./app/middleware/check-user-login');

app.use(signRouter);
app.use('/api/corsi', corsiRouter);
app.use('/api/lesson', lessonRouter)
app.use('/user', checkUserLogin() ,userRouter);




app.get('/', (req, res) => {
    res.json({});
});

app.post('/api/download' , (req,res) => {

    let href= req.body.href
    let base64Image = fs.readFileSync('app'+href, {encoding: 'UTF-8'} ,(err) => {if(err) console.log(err)})
    return res.json({url:base64Image})

    res.static()
    
})