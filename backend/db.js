require('dotenv').config(); // Load environment variables
const mysql = require('mysql2');

// Create the connection pool using safe environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Cloud Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to Aiven Cloud MySQL Database successfully!');
        connection.release();
    }
});

module.exports = db;