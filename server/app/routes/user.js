const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const stripeController  = require('../controller/stripeController');




router.post('/getuser',  userController.getUser)
router.post('/payCourse' , userController.payCourse);//utente ha pagato il corso con successo
router.post('/payDeck' , userController.payDeck);//utente ha pagato il deck con successo

router.get('/haveCourse/:id/:idCourse' , userController.haveCourse); //controllare se ha il corso
router.post('/getseller' , userController.getUserSeller);

router.post('/seller/strip_update_info' , stripeController.updateInfoSeller)
router.post('/seller/stripe_login' , stripeController.stripeLogin)

router.post('/fromIdToUser' , userController.fromIdToUser)
router.post('/fromUserToId' , userController.fromUserToId)

router.put('/update' , userController.updateUser)

router.post('/get_user_course' , userController.getUserCourse)//tutti i corsi acquistati dall'utente

router.post('/send_msg' , userController.sendMsg)//invia msg all'utente
router.post('/have_msg' , userController.haveMsg)//controlla se ha qualche msg non visto 
router.post('/get_user_msg' , userController.getUserMsg)//prendi tutti i msg dell'utente 
router.delete('/delete_user_msg' , userController.deleteUserMsg)


router.get('/dashbord', (req, res) => {
    res.json({})
})

router.get('/dashbord-2', (req, res) => {

    res.json({})
})






/*--------------- */





module.exports = router;