// verify-deployment.js - Check deployment configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
const requiredEnvVars = ['MONGODB_URI', 'PORT'];
const optionalEnvVars = ['FRONTEND_URL', 'NODE_ENV'];

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar}: Set`);
    } else {
        console.log(`❌ ${envVar}: Missing (Required)`);
    }
});

optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`✅ ${envVar}: ${process.env[envVar]}`);
    } else {
        console.log(`⚠️  ${envVar}: Not set (Optional)`);
    }
});

// Check file structure
console.log('\n📁 File Structure:');
const requiredFiles = [
    'server.js',
    'routes/auth.js',
    'routes/user.js', 
    'routes/ai.js',
    'routes/quiz.js',
    'config/database.js',
    'models/index.js'
];

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: Exists`);
    } else {
        console.log(`❌ ${file}: Missing`);
    }
});

// Check package.json scripts
console.log('\n📦 Package.json Scripts:');
const packageJson = require('./package.json');
const requiredScripts = ['start'];

requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
        console.log(`❌ ${script}: Missing`);
    }
});

// Check dependencies
console.log('\n📚 Key Dependencies:');
const keyDeps = ['express', 'cors', 'mongoose', 'dotenv'];

keyDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
        console.log(`❌ ${dep}: Missing`);
    }
});

console.log('\n🚀 Deployment Tips:');
console.log('1. Make sure MONGODB_URI is set in your hosting platform');
console.log('2. Set PORT environment variable (or use default 5000)');
console.log('3. Set FRONTEND_URL to your deployed frontend URL');
console.log('4. Check that your hosting platform supports Node.js');
console.log('5. Verify your start script points to server.js');

console.log('\n✨ Verification complete!');