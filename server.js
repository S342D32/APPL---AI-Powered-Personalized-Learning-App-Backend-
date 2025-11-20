// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const aiRoutes = require('./routes/ai');
const quizRoutes = require('./routes/quiz');

// Import database configurations
// const { connectMySQL } = require('./config/database');
const { connectMongoDB } = require('./config/database');
const { testApiConnection } = require('./services/ai');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Create uploads/pdfs directory if it doesn't exist
const pdfUploadsDir = path.join(__dirname, 'uploads', 'pdfs');
if (!fs.existsSync(pdfUploadsDir)){
    fs.mkdirSync(pdfUploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173', 
        'https://appl-ai-powered-personalized-learni.vercel.app',
        'https://your-app.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
console.log('Loading routes...');
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', aiRoutes);
app.use('/api', quizRoutes);
console.log('Routes loaded successfully');

// Debug route to check if server is running
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Initialize connections and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Initialize database connections
        await Promise.all([
            // connectMySQL(),
            connectMongoDB()
        ]);
        
        app.listen(PORT, async () => {
            console.log(`Server starting on port ${PORT}...`);
            const isConnected = await testApiConnection();
            if (isConnected) {
                console.log('Server is ready to handle requests');
                console.log(`Available routes: /api/quiz-attempts, /api/save-quiz-attempt`);
            } else {
                console.log('Server started but API connection test failed - check your API key');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();