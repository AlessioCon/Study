const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const stripeController  = require('../controller/stripeController');




router.post('/getuser',  userController.getUser)
router.post('/payCourse' , userController.payCourse);//utente ha pagato il corso con successo

router.get('/haveCourse/:id/:idCourse' , userController.haveCourse); //controllare se ha il corso
router.post('/newseller', userController.userSeller);
router.post('/getseller' , userController.getUserSeller);

router.post('/seller/strip_update_info' , stripeController.updateInfoSeller)
router.post('/seller/stripe_login' , stripeController.stripeLogin)

router.post('/fromIdToUser' , userController.fromIdToUser)



router.get('/dashbord', (req, res) => {
    res.json({})
})

router.get('/dashbord-2', (req, res) => {

    res.json({})
})






/*--------------- */





module.exports = router;