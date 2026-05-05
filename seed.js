const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, 'grievances.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

const generateId = () => crypto.randomBytes(4).toString('hex');

const categories = ['Academics', 'Hostel', 'Infrastructure', 'Administration', 'Examinations', 'Other'];
const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const departments = ['Academic Dept', 'Hostel Warden', 'Maintenance', 'Admin Office', 'Exam Cell', null];

const firstNames = ['Amit', 'Rahul', 'Priya', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Siddharth', 'Nisha', 'Arjun', 'Meera', 'Karan', 'Pooja', 'Aditya', 'Riya', 'Sameer', 'Tanvi', 'Ravi', 'Neha'];
const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Reddy', 'Rao', 'Das', 'Joshi', 'Mehta', 'Nair', 'Kapoor', 'Yadav', 'Chauhan'];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const complaints = [];

for (let i = 0; i < 30; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const usn = `1US${Math.floor(Math.random() * 90 + 10)}CS${Math.floor(Math.random() * 900 + 100)}`; // e.g., 1US20CS105
    const email = `${usn.toLowerCase()}@college.edu`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const title = `Issue regarding ${category}`;
    const description = `This is a sample description for a complaint regarding ${category}. The student ${name} (USN: ${usn}) is facing issues that need attention.`;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const assignedDepartment = status !== 'Pending' ? departments[Math.floor(Math.random() * (departments.length - 1))] : null;
    const departmentResponse = status === 'Resolved' || status === 'Rejected' ? 'This has been reviewed and addressed.' : null;
    
    // Random date from Jan 1st of the current year to now
    const today = new Date();
    const startYear = new Date(today.getFullYear(), 0, 1);
    const date = randomDate(startYear, today);
    const createdAt = date.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS

    complaints.push({
        id: generateId(),
        name,
        email, // Reusing email to store USN email or just name
        category,
        title,
        description,
        image: '',
        status,
        assignedDepartment,
        departmentResponse,
        createdAt
    });
}

db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO complaints (id, name, email, category, title, description, image, status, assignedDepartment, departmentResponse, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    complaints.forEach(c => {
        stmt.run([c.id, c.name, c.email, c.category, c.title, c.description, c.image, c.status, c.assignedDepartment, c.departmentResponse, c.createdAt]);
    });
    
    stmt.finalize((err) => {
        if (err) {
            console.error('Error inserting dummy data:', err.message);
        } else {
            console.log('Successfully inserted 30 dummy complaints into the database.');
        }
        db.close();
    });
});
