const express = require('express');
const router = express.Router();



const stripeController = require('../controller/stripeController')

//middleware
const checkUserLogin = require('../middleware/check-user-login');


router.post('/create-subscription' , checkUserLogin(), stripeController.CreateSubscription);
router.post('/buy-deck' , checkUserLogin(), stripeController.BuyDeck);
router.post('/amount_product' , stripeController.amountProduct);



//webhook
router.post('/webhook', stripeController.webHook)











module.exports = router;