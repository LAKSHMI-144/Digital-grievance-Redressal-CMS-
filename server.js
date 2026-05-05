const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the root directory
app.use(express.static(__dirname));

// API: Create a new complaint
app.post('/api/complaints', (req, res) => {
    const { id, name, email, category, title, description, image, status } = req.body;
    
    const sql = `INSERT INTO complaints (id, name, email, category, title, description, image, status, assignedDepartment, departmentResponse) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, name, email || '', category, title, description || '', image || '', status || 'Pending', null, null];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: { id, name, category, title, status }
        });
    });
});

// API: Get all complaints
app.get('/api/complaints', (req, res) => {
    const sql = `SELECT * FROM complaints ORDER BY createdAt DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: rows
        });
    });
});

// API: Get complaint by ID
app.get('/api/complaints/:id', (req, res) => {
    const sql = `SELECT * FROM complaints WHERE id = ?`;
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.json({ message: 'success', data: row });
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    });
});

// API: Update complaint status & assignment
app.patch('/api/complaints/:id/status', (req, res) => {
    const { status, assignedDepartment, departmentResponse } = req.body;
    
    // Dynamically build setup based on provided fields
    let setClauses = [];
    let params = [];
    
    if (status !== undefined) { setClauses.push("status = ?"); params.push(status); }
    if (assignedDepartment !== undefined) { setClauses.push("assignedDepartment = ?"); params.push(assignedDepartment); }
    if (departmentResponse !== undefined) { setClauses.push("departmentResponse = ?"); params.push(departmentResponse); }
    
    if (setClauses.length === 0) {
        return res.status(400).json({ error: "No update fields provided." });
    }
    
    params.push(req.params.id);
    const sql = `UPDATE complaints SET ${setClauses.join(", ")} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            changes: this.changes
        });
    });
});

// ==========================================
// STUDENT AUTHENTICATION ENDPOINTS
// ==========================================

// API: Register a new student
app.post('/api/students/register', (req, res) => {
    const { name, studentId, password, email, phone, department, semester } = req.body;
    
    if (!name || !studentId || !password) {
        return res.status(400).json({ error: 'Name, Student ID, and Password are required' });
    }
    
    const sql = `INSERT INTO students (id, name, studentId, password, email, phone, department, semester) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const id = 'STU-' + Date.now();
    const params = [id, name, studentId.toUpperCase(), password, email || '', phone || '', department || '', semester || ''];
    
    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Student ID already registered' });
            }
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({
            message: 'registration_success',
            data: { id, studentId: studentId.toUpperCase(), name }
        });
    });
});

// API: Login student
app.post('/api/students/login', (req, res) => {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
        return res.status(400).json({ error: 'Student ID and Password are required' });
    }
    
    const sql = `SELECT * FROM students WHERE studentId = ? AND password = ?`;
    
    db.get(sql, [studentId.toUpperCase(), password], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(401).json({ error: 'Invalid Student ID or Password' });
        }
        
        // Update last login time
        const updateSql = `UPDATE students SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(updateSql, [row.id]);
        
        res.json({
            message: 'login_success',
            data: {
                id: row.id,
                name: row.name,
                studentId: row.studentId,
                email: row.email,
                phone: row.phone,
                department: row.department,
                semester: row.semester,
                role: 'student'
            }
        });
    });
});

// API: Get student profile
app.get('/api/students/:id', (req, res) => {
    const sql = `SELECT id, name, studentId, email, phone, department, semester, createdAt, lastLogin FROM students WHERE id = ?`;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({ message: 'success', data: row });
    });
});

// API: Update student profile
app.patch('/api/students/:id', (req, res) => {
    const { email, phone, department, semester } = req.body;
    
    let setClauses = [];
    let params = [];
    
    if (email !== undefined) { setClauses.push("email = ?"); params.push(email); }
    if (phone !== undefined) { setClauses.push("phone = ?"); params.push(phone); }
    if (department !== undefined) { setClauses.push("department = ?"); params.push(department); }
    if (semester !== undefined) { setClauses.push("semester = ?"); params.push(semester); }
    
    if (setClauses.length === 0) {
        return res.status(400).json({ error: "No update fields provided." });
    }
    
    params.push(req.params.id);
    const sql = `UPDATE students SET ${setClauses.join(", ")} WHERE id = ?`;
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({
            message: 'success',
            changes: this.changes
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
