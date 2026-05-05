// models/userModel.js
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const UserModel = {
    async createUser({ username, password, fullname, role = 'input', instalasi_id = null }) {
        const hash = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: {
                username,
                password: hash,
                fullname,
                role,
                instalasi_id: instalasi_id ? Number(instalasi_id) : null
            }
        });
        return { id: user.id, username, fullname, role, instalasi_id };
    },

    async findByUsername(username) {
        return await prisma.users.findFirst({
            where: { username }
        });
    },

    async findById(id) {
        return await prisma.users.findUnique({
            where: { id: Number(id) },
            select: { id: true, username: true, fullname: true, role: true, instalasi_id: true, created_at: true }
        });
    },

    async comparePassword(plain, hashed) {
        return await bcrypt.compare(plain, hashed);
    },

    async getAllUsers() {
        return await prisma.users.findMany({
            select: { id: true, username: true, fullname: true, role: true, instalasi_id: true, created_at: true },
            orderBy: { created_at: 'desc' }
        });
    },

    async updateUser(id, data) {
        const updateData = {};
        if (data.fullname !== undefined) updateData.fullname = data.fullname;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.role !== undefined) updateData.role = data.role;

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        if (data.instalasi_id !== undefined) {
            updateData.instalasi_id = data.instalasi_id ? Number(data.instalasi_id) : null;
        }

        if (Object.keys(updateData).length === 0) return this.findById(id);

        await prisma.users.update({
            where: { id: Number(id) },
            data: updateData
        });

        return this.findById(id);
    },

    async deleteUser(id) {
        return await prisma.users.delete({
            where: { id: Number(id) }
        });
    }
};

module.exports = UserModel;