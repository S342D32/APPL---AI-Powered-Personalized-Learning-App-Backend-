const express = require('express');
const router = express.Router();
const { QuizAttempt } = require('../models');

// Get user-specific quiz attempts
router.get('/quiz-attempts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const quizAttempts = await QuizAttempt.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate user statistics
    const totalAttempts = quizAttempts.length;
    const completedAttempts = quizAttempts.filter(q => q.status === 'completed');
    const totalScore = completedAttempts.reduce((sum, q) => sum + q.score, 0);
    const averageScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0;

    // Topic performance
    const topicStats = {};
    completedAttempts.forEach(attempt => {
      if (!topicStats[attempt.topic]) {
        topicStats[attempt.topic] = { total: 0, correct: 0, attempts: 0 };
      }
      topicStats[attempt.topic].total += attempt.totalQuestions;
      topicStats[attempt.topic].correct += attempt.score;
      topicStats[attempt.topic].attempts += 1;
    });

    const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      attempts: stats.attempts
    }));

    res.json({
      quizAttempts,
      statistics: {
        totalAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        topicPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

// Save quiz attempt with user ID
router.post('/save-quiz-attempt', async (req, res) => {
  try {
    const quizData = req.body;
    
    // Ensure userId is provided
    if (!quizData.userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const quizAttempt = new QuizAttempt({
      ...quizData,
      status: 'completed',
      endTime: new Date()
    });

    await quizAttempt.save();
    
    res.json({ 
      message: 'Quiz attempt saved successfully',
      quizAttempt 
    });
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz attempt',
      details: error.message 
    });
  }
});

module.exports = router;