// services/ai.js
const axios = require('axios');
require('dotenv').config();

// Get API key
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

// Correct API URL format for Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// Test API connection
async function testApiConnection() {
    try {
        console.log('Testing Gemini API connection...');
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: "Test connection"
                    }]
                }]
            }
        );
        console.log('API Test successful:', {
            status: response.status,
            hasData: !!response.data
        });
        return true;
    } catch (error) {
        console.error('API Test failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            error: error.response?.data?.error,
            message: error.message
        });
        return false;
    }
}

// Generate batch of questions with retry logic
async function generateQuestionBatch(topic, subTopic, batchSize) {
    // Validate inputs
    if (!topic || !subTopic || !batchSize) {
        throw new Error('Missing required parameters: topic, subTopic, or batchSize');
    }
    
    if (typeof subTopic !== 'string' || subTopic.trim().length === 0) {
        throw new Error('Invalid subTopic: must be a non-empty string');
    }

    const prompt = `Generate exactly ${batchSize} multiple choice questions about ${subTopic} in ${topic}.

IMPORTANT: Return ONLY valid JSON array, no explanations or markdown.

Format:
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A"
  }
]

Generate ${batchSize} questions now:`;

    // Retry logic for API calls
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`API attempt ${attempt}/${maxRetries}`);
            
            const response = await axios.post(
                GEMINI_API_URL,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 1,
                        maxOutputTokens: 1000,
                        topK: 40,
                        topP: 0.8
                    }
                },
                {
                    timeout: 30000 // Reduced timeout
                }
            );
            
            // If successful, break out of retry loop
            return await processApiResponse(response, batchSize, topic, subTopic);
            
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error.response?.status, error.message);
            
            // Don't retry on certain errors
            if (error.response?.status === 400 || error.response?.status === 401) {
                throw error;
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All retries failed - return fallback questions
    console.log('All API attempts failed, using fallback questions');
    return createFallbackQuestions('', batchSize, topic, subTopic);
}

// Fallback function to create questions when parsing fails
function createFallbackQuestions(text, batchSize, topic, subTopic) {
    console.log('Creating fallback questions...');
    
    const fallbackQuestions = [];
    
    for (let i = 0; i < batchSize; i++) {
        fallbackQuestions.push({
            question: `What is a key concept in ${subTopic}?`,
            options: [
                `Basic concept ${i + 1}`,
                `Advanced topic ${i + 1}`,
                `Related field ${i + 1}`,
                `Alternative approach ${i + 1}`
            ],
            correctAnswer: `Basic concept ${i + 1}`
        });
    }
    
    console.log(`Generated ${fallbackQuestions.length} fallback questions`);
    return fallbackQuestions;
}

// Helper function to process API response
async function processApiResponse(response, batchSize, topic, subTopic) {

    let questionsText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!questionsText || typeof questionsText !== 'string') {
        throw new Error('No valid text response from AI service');
    }
    
    // Clean and extract JSON from response
    console.log('Raw AI Response:', questionsText.substring(0, 500) + '...');
    
    // Try multiple extraction methods
    let jsonString = null;
    
    // Method 1: Extract JSON array
    const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        jsonString = jsonMatch[0];
    } else {
        // Method 2: Look for questions between ```json blocks
        const codeBlockMatch = questionsText.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1];
        } else {
            // Method 3: Fallback - create questions from text patterns
            console.log('No JSON found, trying text parsing fallback...');
            return createFallbackQuestions(questionsText, batchSize, topic, subTopic);
        }
    }
    
    // Clean the JSON string
    jsonString = jsonString
        .replace(/```json|```/g, '') // Remove code blocks
        .replace(/\n\s*\/\/.*$/gm, '') // Remove comments
        .replace(/,\s*}/g, '}') // Fix trailing commas
        .replace(/,\s*]/g, ']') // Fix trailing commas in arrays
        .trim();
    
    console.log('Cleaned JSON:', jsonString.substring(0, 200) + '...');

    try {
        const batchQuestions = JSON.parse(jsonString);
        
        // Validate each question has required properties
        const validatedQuestions = batchQuestions.map(q => {
            if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
                throw new Error('Invalid question format');
            }
            return {
                question: q.question.trim(),
                options: q.options.map(opt => opt.trim()),
                correctAnswer: q.correctAnswer.trim()
            };
        });

        // Verify batch size
        if (validatedQuestions.length !== batchSize) {
            throw new Error(`Generated ${validatedQuestions.length} questions instead of ${batchSize}`);
        }

        return validatedQuestions;
    } catch (parseError) {
        console.error('JSON parsing failed:', parseError.message);
        console.log('Trying fallback question generation...');
        return createFallbackQuestions(questionsText, batchSize, topic, subTopic);
    }
}

// Summarize text
async function summarizeText(text) {
    const prompt = `Summarize the following text concisely while maintaining the key points and insights:
    
    ${text}`;

    const response = await axios.post(
        GEMINI_API_URL,
        {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
            }
        },
        {
            timeout: 30000
        }
    );

    const summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return summary;
}

// Generate text response for chat
async function generateTextResponse(prompt) {
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
          topK: 40,
          topP: 0.95
        }
      },
      {
        timeout: 30000
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    return text;
  } catch (error) {
    console.error('Gemini Text Response Error:', error.response?.data || error.message);
    throw error;
  }
}

// services/ai.js should export these functions
module.exports = {
    generateQuestionBatch,
    summarizeText,
    testApiConnection,
    generateTextResponse
};