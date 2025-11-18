// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { pool } = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/email');
require('dotenv').config();

// User signup route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        await pool.execute(
            'INSERT INTO registered_users (name, email, password, verification_token) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, verificationToken]
        );

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'User created. Please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.execute('SELECT * FROM registered_users WHERE email = ?', [email]);

        if (!users || users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.email_verified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Email verification route
router.get('/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        await pool.execute(
            'UPDATE registered_users SET email_verified = true, verification_token = NULL WHERE email = ?',
            [decoded.email]
        );

        res.redirect(`${process.env.FRONTEND_URL}/verification-success`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL}/verification-failed`);
    }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await pool.execute('SELECT * FROM registered_users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.execute(
            'UPDATE registered_users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?',
            [resetToken, resetExpires, email]
        );

        // Send password reset email
        await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const [users] = await pool.execute(
            'SELECT * FROM registered_users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute(
            'UPDATE registered_users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?',
            [hashedPassword, token]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;