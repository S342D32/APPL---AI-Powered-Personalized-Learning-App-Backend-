// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    console.log('verifyToken middleware called');
    
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);
    
    if (!authHeader) {
        console.log('No Authorization header found');
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Check if the header has the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        console.log('Invalid Authorization header format');
        return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const token = parts[1];
    if (!token) {
        console.log('No token found in Authorization header');
        return res.status(401).json({ message: 'No token provided' });
    }
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ message: 'Failed to authenticate token', error: err.message });
        }
        
        console.log('Token verified successfully for user:', decoded.id);
        req.user = decoded;
        next();
    });
};

module.exports = {
    verifyToken
};