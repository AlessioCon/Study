const express = require('express');
const router = express.Router();


const corsiController = require('../controller/corsiController');

//middleware
const checkUserLogin = require('../middleware/check-user-login');



router.get('/' , corsiController.getAllCourse);

router.post('/modifica' , corsiController.getModifyCourse);
router.post('/findLesson', corsiController.findLesson);
router.post('/answersControl' , corsiController.answersControl);
router.post('/saveProgress' , corsiController.saveProgress);

router.get('/:slug' , corsiController.getOneCourse);
router.put('/:id', checkUserLogin(), corsiController.updateCourse);
router.delete('/:id', checkUserLogin(), corsiController.deleteCourse);
router.post('/create', checkUserLogin(), corsiController.createCourse);





module.exports = router;