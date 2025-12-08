// routes/userRoutes

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.get('/', authenticate, authorize(['manajemen']), userController.getAllUsers);
router.put('/:id', authenticate, authorize(['manajemen']), userController.updateUser);

module.exports = router;