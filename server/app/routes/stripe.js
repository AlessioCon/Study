const express = require('express');
const router = express.Router();


const stripeController = require('../controller/stripeController')

//middleware
const checkUserLogin = require('../middleware/check-user-login');


router.post('/create-subscription' , checkUserLogin(), stripeController.CreateSubscription)
router.post('/amount_product' , stripeController.amountProduct)



//webhook
router.post('/webhook', express.raw({type: 'application/json'}), stripeController.webHook)











module.exports = router;