const express = require('express');
const router = express.Router();

const lessonController = require('../controller/lessonController');


router.post('/', lessonController.getAll);

router.post('/save' , lessonController.save);

router.put('/update' , lessonController.update);

router.delete('/:id', lessonController.deleteLesson);



module.exports = router;