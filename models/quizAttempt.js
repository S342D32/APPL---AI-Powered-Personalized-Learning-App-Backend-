const mongoose = require('mongoose');

// Define the schema only once
const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    topic: {
        type: String,
        required: true
    },
    subTopic: String,
    questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        userAnswer: String,
        isCorrect: Boolean
    }],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: Number,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed'],
        default: 'in_progress'
    },
    startTime: Date,
    endTime: Date,
    pdfContent: String
}, {
    timestamps: true
});

// Export both the schema and the model
module.exports = {
    quizAttemptSchema,
    QuizAttempt: mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema)
};