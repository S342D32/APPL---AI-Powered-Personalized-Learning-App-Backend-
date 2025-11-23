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

// Import Clerk middleware
const { verifyClerkToken } = require('./middleware/clerk');

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173', 
        'https://appl-ai-powered-personalized-learni.vercel.app',
        'https://appl-ai-powered-personalized-learning-app.onrender.com',
        'https://your-app.vercel.app',
        /\.vercel\.app$/,
        /\.onrender\.com$/
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Apply Clerk middleware to all API routes
app.use('/api', verifyClerkToken);

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    next();
});

// Routes
console.log('Loading routes...');
try {
    app.use('/api', authRoutes);
    console.log('✓ Auth routes loaded');
    app.use('/api', userRoutes);
    console.log('✓ User routes loaded');
    app.use('/api', aiRoutes);
    console.log('✓ AI routes loaded');
    app.use('/api', quizRoutes);
    console.log('✓ Quiz routes loaded');
    console.log('All routes loaded successfully');
} catch (error) {
    console.error('Error loading routes:', error);
    process.exit(1);
}

// Log all registered routes for debugging
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Registered route:', r.route.path);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug route to check if server is running
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        routes: {
            auth: '/api (auth routes)',
            user: '/api (user routes)', 
            ai: '/api (ai routes)',
            quiz: '/api (quiz routes)'
        }
    });
});

// Test user session endpoint
app.get('/api/test-user', (req, res) => {
    res.json({
        message: 'User session test',
        user: req.user,
        headers: {
            authorization: req.headers.authorization ? 'Present' : 'Missing'
        },
        timestamp: new Date().toISOString()
    });
});

// Add explicit route handlers for debugging
app.get('/api/test-routes', (req, res) => {
    res.json({
        availableRoutes: [
            'GET /api/status',
            'GET /api/test-user',
            'POST /api/sync-user',
            'GET /api/quiz-attempts/:userId',
            'POST /api/save-quiz-attempt',
            'POST /api/generate-mcq',
            'POST /api/process-pdf',
            'POST /api/summarize',
            'POST /api/chat'
        ]
    });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
        availableRoutes: [
            'GET /api/status',
            'GET /api/quiz-attempts/:userId',
            'POST /api/save-quiz-attempt',
            'POST /api/generate-mcq',
            'POST /api/process-pdf',
            'POST /api/summarize',
            'POST /api/chat'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
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