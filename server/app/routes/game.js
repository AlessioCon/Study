const express = require('express');
const router = express.Router();

const gameController = require('../controller/gameController');


router.get('/getAll', gameController.getAll);//solo per modifiche
router.get('/getAllClient', gameController.getAllClient);//solo per giocare
router.post('/save_pack', gameController.savePack);
router.delete('/delete_pack', gameController.deletePack);

router.post('/find_game', gameController.findGame);//trova o crea una sessione di gioco;
router.post('/controll_game', gameController.controllGame);//controllo del giocatore a inizio game
router.post('/find_quest', gameController.findQuest);//restituisce 9 domande per giocare 
router.post('/save_response', gameController.saveResponse);//salva le risposte date dei player (con aggiornamento statistiche)
router.post('/result_game', gameController.resultGame);
router.post('/game_started' , gameController.gameStarted);
router.get('/game_classifica' , gameController.gameClassifica);

router.post('/user_game_info', gameController.userGameInfo);








module.exports = router;