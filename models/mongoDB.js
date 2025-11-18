// models/mongoDB.js
const mongoose = require('mongoose');

// Question Schema
const questionSchema = new mongoose.Schema({
    topic: String,
    subTopic: String,
    question: String,
    options: [String],
    correctAnswer: String,
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model('Question', questionSchema);

// Quiz Attempt Schema
const quizAttemptSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    topic: String,
    subTopic: String,
    totalQuestions: Number,
    score: Number,
    questions: [{
        question: String,
        options: [String],
        correctAnswer: String,
        userAnswer: String,
        isCorrect: Boolean
    }],
    createdAt: { type: Date, default: Date.now }
});

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    userId: String,
    rating: Number,
    comment: String,
    category: String,
    createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = {
    Question,
    QuizAttempt,
    Feedback
};