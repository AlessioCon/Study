const express = require('express');
const router = express.Router();

const simulationController = require('../controller/simulationController')

router.get('/' , simulationController.getAllSimulation);
router.post('/simulations/:name' , simulationController.getSingleSimulation);

router.post('/create', simulationController.createSimulation) //crea simulazione
router.put('/update', simulationController.updateSimulation) //modifica simulazione
router.post('/modifiche', simulationController.getModifySimulation) //tutte le simulazioni di un dato creatore
router.delete('/:id', simulationController.deleteSimulation);

router.put('/delite_date', simulationController.deletePublicDate); //ellimina tutti i dati pubblici della simulazione

router.post('/simulation_user' , simulationController.getAllUserSimulation);//prendi solo le simulazione create dall'utente (per master)
router.post('/correction' , simulationController.correctionSimulation);//prendi solo le simulazione create dall'utente (per master)
router.put('/save_answere' , simulationController.saveAnswereSimulation); //salva domanda specifica durante una simulazione
router.post('/get_save_answere' , simulationController.getSaveAnswere) 
router.post('/get_user_simulations', simulationController.getUserSimulations)
router.post('/get_user_simulation_info', simulationController.getUserSimulationInfo)

module.exports = router;