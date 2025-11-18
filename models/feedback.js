const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: true,
        enum: ['app', 'content', 'quiz', 'other']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Feedback = mongoose.model('feedback', feedbackSchema);

module.exports = Feedback;