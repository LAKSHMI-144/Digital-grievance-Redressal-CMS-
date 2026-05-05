const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'grievances.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create Students table
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT,
            studentId TEXT UNIQUE,
            password TEXT,
            email TEXT,
            phone TEXT,
            department TEXT,
            semester TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            lastLogin DATETIME
        )`, (err) => {
            if (err) {
                console.error('Error creating students table', err.message);
            }
        });
        
        // Create Complaints table
        db.run(`CREATE TABLE IF NOT EXISTS complaints (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            category TEXT,
            title TEXT,
            description TEXT,
            image TEXT,
            status TEXT,
            assignedDepartment TEXT,
            departmentResponse TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating complaints table', err.message);
            }
        });
    }
});

module.exports = db;
