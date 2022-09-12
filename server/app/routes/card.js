const express = require('express');
const router = express.Router();

const cardController = require('../controller/cardController');


router.post('/getDeckUser', cardController.getDeckUser);
router.post('/getDeckSeller', cardController.getDeckSeller);//trova i deck in vendita 
router.post('/getDeckForMaster', cardController.getDeckForMaster);

router.post('/save_deck', cardController.saveDeck);//salva il deck e tutte le carte
router.delete('/delete_deck', cardController.deleteDeck);//cancella deck






module.exports = router;