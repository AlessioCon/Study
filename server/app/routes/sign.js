const express = require('express');
const router = express.Router();

const passport = require('../config/passport-config');
const userController = require('../controller/userController');


router.get('/login' , (req, res) =>{
    if(req.isAuthenticated()) return res.json({
        success:true, 
        data: {_id: req.user._id, user: req.user.user , grade: req.user.grade}
    })
    res.json({success: false});
})


router.post('/login', [userController.userLogin ,passport.authenticate('local-login')],
    (req, res) => {
        res.json({success:true});
    });



/*inizio fase nuova*/

router.get('/register' , (req, res) => { res.status(200).send()})

router.post('/register', userController.userNew)



router.get('/logout' , (req, res) => {
    req.logout( (err) => {
        if (err) return res.json({success:false}); 
        res.json({success: true});
      });
})

module.exports = router;