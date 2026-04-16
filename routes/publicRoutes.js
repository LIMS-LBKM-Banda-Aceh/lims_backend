const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.post('/track', publicController.trackRegistration);

module.exports = router;