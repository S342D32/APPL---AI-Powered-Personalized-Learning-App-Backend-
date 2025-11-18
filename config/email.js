// // config/email.js
// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Email configuration
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // Utility function to send verification email
// async function sendVerificationEmail(email, token) {
//     const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
//     await transporter.sendMail({
//         to: email,
//         subject: 'Verify your email',
//         html: `Click <a href="${verificationLink}">here</a> to verify your email.`
//     });
// }

// // Utility function to send password reset email
// async function sendPasswordResetEmail(email, token) {
//     const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
//     await transporter.sendMail({
//         to: email,
//         subject: 'Password Reset Request',
//         html: `
//             <h2>Password Reset Request</h2>
//             <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
//             <a href="${resetLink}">Reset Password</a>
//             <p>If you didn't request this, please ignore this email.</p>
//         `
//     });
// }

// module.exports = {
//     transporter,
//     sendVerificationEmail,
//     sendPasswordResetEmail
// };