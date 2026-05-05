const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'grievances.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
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
        
        db.run(`CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT UNIQUE,
            name TEXT,
            email TEXT,
            department TEXT,
            password TEXT
        )`, (err) => {
            if (err) console.error('Error creating students table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'admin'
        )`, (err) => {
            if (err) console.error('Error creating admins table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE,
            head_of_department TEXT
        )`, (err) => {
            if (err) console.error('Error creating departments table', err.message);
        });
    }
});

module.exports = db;
