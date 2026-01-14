// controllers/userController.js

const UserModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;

        if (!username || !password || !fullname) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, dan fullname diperlukan'
            });
        }

        // Cek apakah user sudah ada
        const existing = await UserModel.findByUsername(username);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Username sudah digunakan'
            });
        }

        const user = await UserModel.createUser({ username, password, fullname, role });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password diperlukan'
            });
        }

        const user = await UserModel.findByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const match = await UserModel.comparePassword(password, user.password);
        if (!match) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullname: user.fullname,
                    role: user.role
                }
            }
        });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = req.user;
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Error getting profile:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const user = await UserModel.updateUser(id, data);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting self (Optional but recommended)
        if (req.user.id == id) {
            return res.status(400).json({
                success: false,
                message: 'Tidak dapat menghapus akun sendiri saat sedang login'
            });
        }

        await UserModel.deleteUser(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};