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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
