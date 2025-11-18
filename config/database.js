// config/database.js
const mysql = require('mysql2');
const mongoose = require('mongoose');
require('dotenv').config();

// MySQL connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// async function connectMySQL() {
//     try {
//         const connection = await pool.getConnection();
//         console.log('MySQL database connected successfully');
//         connection.release();
//         return true;
//     } catch (error) {
//         console.error('Error connecting to MySQL database:', error);
//         throw error;
//     }
// }

// MongoDB connection
async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_platform');
        console.log('MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = {
    pool,
    connectMongoDB,
    mongoose
};