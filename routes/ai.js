const express = require('express');
const router = express.Router();
const { generateQuestionBatch, summarizeText, testApiConnection, generateTextResponse } = require('../services/ai');
const fs = require('fs').promises;
const path = require('path');
const { QuizAttempt } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { pdfUpload } = require('../config/upload');
const { extractTextFromPDF } = require('../services/pdf');

// MCQ generation endpoint
router.post('/generate-mcq', async (req, res) => {
    const { topic, subTopic, numberOfQuestions } = req.body;

    if (!topic || !subTopic || !numberOfQuestions) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const questions = await generateQuestionBatch(topic, subTopic, numberOfQuestions);
        res.json({ questions });
    } catch (error) {
        console.error('MCQ Generation Error:', error);
        res.status(500).json({
            error: 'Failed to generate MCQ questions',
            details: error.message
        });
    }
});

// Endpoint to summarize text
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    const summary = await summarizeText(text);
    res.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    res.status(500).json({ message: 'Failed to summarize text', error: error.message });
  }
});

// Helper function to conditionally apply middleware
const optionalVerifyToken = (req, res, next) => {
    if (req.headers.authorization) {
        return verifyToken(req, res, next);
    }
    // If no token, continue without user authentication
    req.user = null;
    next();
};

// Process PDF and generate questions
router.post('/process-pdf', pdfUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log('File received:', req.file); // Debug log
        console.log('File path:', req.file.path);

        const { numQuestions = 5, difficulty = 'medium' } = req.body;
        console.log('Request parameters:', { numQuestions, difficulty });

        // Check if file exists
        try {
            await fs.access(req.file.path);
            console.log('File exists and is accessible');
        } catch (error) {
            console.error('File access error:', error);
            return res.status(500).json({ 
                error: 'File access error', 
                details: error.message 
            });
        }

        // Extract text from the PDF
        try {
            console.log('Extracting text from PDF...');
            const text = await extractTextFromPDF(req.file.path);
            console.log('Extracted text length:', text.length); // Debug log

            if (!text || text.length < 10) {
                throw new Error('Extracted text is too short or empty');
            }

            // Clean and truncate the text
            const cleanedText = text
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 4000); // Limit text length

            console.log('Cleaned text length:', cleanedText.length);
            console.log('Generating questions...');

            // Validate text before generating questions
            if (!cleanedText || cleanedText.trim().length < 50) {
                throw new Error('PDF text is too short to generate meaningful questions');
            }

            // Generate questions with proper topic/subtopic format
            const questions = await generateQuestionBatch(
                'Document Analysis',
                `Based on this content: ${cleanedText.substring(0, 500)}...`,
                parseInt(numQuestions)
            );

            console.log('Generated questions:', questions.length);

            // Clean up: Delete the uploaded file (optional)
            // await fs.unlink(req.file.path);

            // Send response
            res.json({ questions });

        } catch (error) {
            console.error('PDF processing error:', error);
            // Clean up on error
            if (req.file && req.file.path) {
                await fs.unlink(req.file.path).catch(console.error);
            }
            throw error;
        }

    } catch (error) {
        console.error('Error in /process-pdf:', error);
        res.status(500).json({ 
            error: 'Failed to process PDF file', 
            details: error.message 
        });
    }
});

// Add a new endpoint to save quiz results
router.post('/save-quiz-result', verifyToken, async (req, res) => {
    try {
        const { quizId, answers, score } = req.body;
        
        // Find and update the quiz attempt
        const quizAttempt = await QuizAttempt.findById(quizId);
        
        if (!quizAttempt) {
            return res.status(404).json({ error: 'Quiz attempt not found' });
        }

        // Update quiz with user's answers and score
        quizAttempt.questions = quizAttempt.questions.map((question, index) => ({
            ...question,
            userAnswer: answers[index],
            isCorrect: question.correctAnswer === answers[index]
        }));

        quizAttempt.score = score;
        quizAttempt.status = 'completed';
        quizAttempt.endTime = new Date();
        
        await quizAttempt.save();
        
        res.json({ 
            message: 'Quiz results saved successfully',
            quizAttempt 
        });
    } catch (error) {
        console.error('Error saving quiz results:', error);
        res.status(500).json({ 
            error: 'Failed to save quiz results', 
            details: error.message 
        });
    }
});

// Add Gemini API chat endpoint
router.post('/chat', async (req, res) => {
  console.log('Chat endpoint hit:', req.body);
  const { message, context, category, interactionCount = 0 } = req.body;
  
  if (!message) {
    console.log('Chat request missing message');
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    console.log(`Processing chat request for category: ${category}`);
    
    // Format the prompt to get natural, conversational responses
    const prompt = `${context || ''}
    
    User message: ${message}
    
    Respond in a natural, conversational way as if this is a casual chat between friends.
    Keep your response genuine and human-like without sounding like an AI assistant.
    Use natural speech patterns, casual language, and avoid overly formal structures.
    Don't label your response or use phrases like "As an AI" or "I'm happy to help."
    Just answer directly and naturally like a human friend would.`;
    
    // Call Gemini API with the formatted prompt
    const response = await generateTextResponse(prompt);
    
    // Log and send response
    console.log(`Generated natural response for ${category} question`);
    res.json({ 
      response,
      category,
      interactionCount
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;