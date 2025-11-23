// quick-test.js - Quick server test
const express = require('express');
require('dotenv').config();

console.log('🔍 Quick Server Test\n');

// Test environment variables
console.log('Environment Variables:');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('- PORT:', process.env.PORT || 'Using default 5000');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// Test route imports
console.log('\nTesting Route Imports:');
try {
    const authRoutes = require('./routes/auth');
    console.log('✅ Auth routes imported');
} catch (error) {
    console.log('❌ Auth routes error:', error.message);
}

try {
    const userRoutes = require('./routes/user');
    console.log('✅ User routes imported');
} catch (error) {
    console.log('❌ User routes error:', error.message);
}

try {
    const aiRoutes = require('./routes/ai');
    console.log('✅ AI routes imported');
} catch (error) {
    console.log('❌ AI routes error:', error.message);
}

try {
    const quizRoutes = require('./routes/quiz');
    console.log('✅ Quiz routes imported');
} catch (error) {
    console.log('❌ Quiz routes error:', error.message);
}

// Test database connection
console.log('\nTesting Database Connection:');
const { connectMongoDB } = require('./config/database');

connectMongoDB()
    .then(() => {
        console.log('✅ MongoDB connection successful');
        process.exit(0);
    })
    .catch((error) => {
        console.log('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    });