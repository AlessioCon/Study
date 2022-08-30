const express = require('express');
const router = express.Router();

const lessonController = require('../controller/lessonController');


router.post('/', lessonController.getAll);
router.get('/:id', lessonController.getSingleLesson);

router.post('/save' , lessonController.save);

router.put('/update' , lessonController.update);

router.delete('/:id', lessonController.deleteLesson);

router.post('/lesson_user' , lessonController.getAllUserLesson);//prendi solo le lezioni create dall'utente (per master)



module.exports = router;