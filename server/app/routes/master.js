const express = require('express');
const router = express.Router();

const masterControll = require('../controller/masterController')




router.post('/' , masterControll.isMaster);
router.post('/new_seller', masterControll.newSeller);
router.post('/all_seller', masterControll.allSeller);
router.post('/block_seller', masterControll.blockSeller);
router.post('/block_course', masterControll.blockCourse);
router.post('/block_deck', masterControll.blockDeck);
router.post('/delite_user_course', masterControll.deliteUserCourse);

router.post('/new_simulator', masterControll.newCreatorSimulator);
router.post('/all_creatorSimulatior', masterControll.allCreatorSimulator);
router.post('/block_creator_simulaton', masterControll.blockCreatorSimulator);
router.post('/block_simulation', masterControll.blockSimulation);


router.post('/all_cardSimulator', masterControll.allCreatorCards);

router.post('/send_msg_master' , masterControll.sendMsgGlobal);//manda un msg globale


module.exports = router