require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('node:path');
const cors = require('cors');
const fs = require('node:fs'); // SATU DEKLARASI FS SAJA

const userRoutes = require('./routes/userRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const testRoutes = require('./routes/testRoutes');
const masterRoutes = require('./routes/masterRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    // origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files - pastikan direktori public ada
const publicDir = path.join(__dirname, 'public');
const resultsDir = path.join(publicDir, 'results');

// Buat direktori jika belum ada
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

// Serve static files dengan benar
app.use('/public', express.static(publicDir));
app.use('/results', express.static(resultsDir));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/master', masterRoutes);
app.use('/api', testRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'LIMS Backend',
        uptime: process.uptime()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'LIMS Backend API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            registrations: '/api/registrations',
            tests: '/api',
            master: '/api/master',
            health: '/health'
        },
        docs: 'Lihat dokumentasi lengkap di README.md'
    });
});

// Route untuk download PDF
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(resultsDir, filename);

    if (fs.existsSync(filepath)) {
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({
                    success: false,
                    message: 'Error downloading file'
                });
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
});

// Handle 404 - menggunakan app.all('*') yang benar
app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: ['/api/users', '/api/registrations', '/api/master', '/api', '/health']
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    // Jika error JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    // Jika error token expired
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Jika error koneksi database
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            success: false,
            message: 'Database connection failed'
        });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📁 Public directory: ${publicDir}`);
    console.log(`📁 Results directory: ${resultsDir}`);
    console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});