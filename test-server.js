// test-server.js - Simple script to test server endpoints
const axios = require('axios');

const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';

async function testEndpoints() {
    console.log(`Testing server at: ${BASE_URL}`);
    
    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            url: `${BASE_URL}/health`
        },
        {
            name: 'Status Check',
            method: 'GET',
            url: `${BASE_URL}/api/status`
        },
        {
            name: 'Test Routes',
            method: 'GET',
            url: `${BASE_URL}/api/test-routes`
        },
        {
            name: 'Quiz Attempts (Test User)',
            method: 'GET',
            url: `${BASE_URL}/api/quiz-attempts/test_user_123`
        },
        {
            name: 'Chat Endpoint',
            method: 'POST',
            url: `${BASE_URL}/api/chat`,
            data: {
                message: 'Hello, this is a test message',
                category: 'general'
            }
        }
    ];

    for (const test of tests) {
        try {
            console.log(`\n🧪 Testing: ${test.name}`);
            
            const config = {
                method: test.method,
                url: test.url,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (test.data) {
                config.data = test.data;
            }
            
            const response = await axios(config);
            console.log(`✅ ${test.name}: ${response.status} ${response.statusText}`);
            
            if (response.data) {
                console.log('Response:', JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.response?.status || 'ERROR'} ${error.response?.statusText || error.message}`);
            
            if (error.response?.data) {
                console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

// Run tests
testEndpoints().catch(console.error);