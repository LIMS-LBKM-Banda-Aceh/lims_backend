// models/testModel.js
const prisma = require('../config/prisma');

const TestModel = {
    async createTest(registration_id, data) {
        const status = data.nilai ? 'completed' : 'pending';

        const test = await prisma.registration_tests.create({
            data: {
                registration_id: Number(registration_id),
                parameter_name: data.parameter_name,
                nilai: data.nilai || null,
                satuan: data.satuan || null,
                range_normal: data.range_normal || null,
                status: status
            }
        });
        return test;
    },

    async getByRegistration(registration_id) {
        return await prisma.registration_tests.findMany({
            where: { registration_id: Number(registration_id) },
            orderBy: { id: 'asc' }
        });
    },

    async updateTest(testId, data) {
        const updateData = { ...data };
        delete updateData.id; // Hindari update ID

        return await prisma.registration_tests.update({
            where: { id: Number(testId) },
            data: updateData
        });
    },

    async findById(testId) {
        return await prisma.registration_tests.findUnique({
            where: { id: Number(testId) }
        });
    },

    async validateTest(testId, data) {
        return await prisma.registration_tests.update({
            where: { id: Number(testId) },
            data: {
                validation_status: data.validation_status,
                validated_by: data.validated_by,
                validation_note: data.validation_note || null,
                validated_at: new Date()
            }
        });
    },

    async getTestsByRegistrationId(registrationId) {
        const tests = await prisma.registration_tests.findMany({
            where: { registration_id: Number(registrationId) },
            include: {
                users: { select: { username: true } },
                registrations: { select: { jenis_kelamin: true } } // Ambil Gender Pasien
            },
            orderBy: { id: 'asc' }
        });

        return tests.map(t => ({
            ...t,
            validator_name: t.users?.username || null,
            jenis_kelamin: t.registrations?.jenis_kelamin || 'L', // Mapping ke root
            users: undefined,
            registrations: undefined
        }));
    },

    async areAllTestsValidated(registrationId) {
        const tests = await prisma.registration_tests.findMany({
            where: { registration_id: Number(registrationId) },
            select: { validation_status: true }
        });

        const total = tests.length;
        const approved = tests.filter(t => t.validation_status === 'approved').length;
        const rejected = tests.filter(t => t.validation_status === 'rejected').length;

        return { total, approved, rejected };
    }
};

module.exports = TestModel;