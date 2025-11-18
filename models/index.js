// Export all models from a single file
const mongoose = require('mongoose');

// Import models directly to avoid duplicate model registration
const quizAttemptSchema = require('./quizAttempt').quizAttemptSchema;
const User = require('./user');

// Create models only once
const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = {
    QuizAttempt,
    User
}; 