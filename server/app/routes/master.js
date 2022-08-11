const express = require('express');
const router = express.Router();

const masterControll = require('../controller/masterController')




router.post('/' , masterControll.isMaster);
router.post('/new_seller', masterControll.newSeller);
router.post('/all_seller', masterControll.allSeller);
router.post('/block_seller', masterControll.blockSeller);
router.post('/block_course', masterControll.blockCourse);


module.exports = router