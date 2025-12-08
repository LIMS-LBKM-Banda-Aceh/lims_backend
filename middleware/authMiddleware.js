// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();
const UserModel = require('../models/userModel');

exports.authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token diperlukan'
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Ambil user dari database untuk memastikan masih ada
        const user = await UserModel.findById(payload.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        req.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        next();
    } catch (err) {
        console.error('Auth error:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token telah kadaluarsa'
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Autentikasi gagal'
        });
    }
};

exports.authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Tidak terautentikasi'
            });
        }

        if (allowedRoles.length === 0) {
            return next();
        }

        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Role tidak diizinkan.'
        });
    };
};