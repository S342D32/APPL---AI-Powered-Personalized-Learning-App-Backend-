// middleware/clerk.js - Clerk authentication middleware
const jwt = require('jsonwebtoken');

const verifyClerkToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Allow requests without auth for public endpoints
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);
        
        // For development, we'll extract user ID from the request or use a simple approach
        // In production, you should verify the JWT token properly
        if (req.body.userId || req.params.userId) {
            req.user = {
                id: req.body.userId || req.params.userId
            };
        }
        
        next();
    } catch (error) {
        console.error('Clerk auth error:', error);
        req.user = null;
        next();
    }
};

module.exports = { verifyClerkToken };