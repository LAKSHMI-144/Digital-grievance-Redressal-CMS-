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

const generateId = () => 'GRV-' + Math.floor(1000 + Math.random() * 9000);

const scenarios = [
    { title: 'WiFi not working in hostel', category: 'Non-Academic', dept: 'Hostel', priority: 'High', description: 'The WiFi router on the 3rd floor is completely dead. Unable to do assignments.' },
    { title: 'Classroom projector issue', category: 'Academic', dept: 'CSE', priority: 'Medium', description: 'The projector in room 302 has a distorted color display.' },
    { title: 'Lab systems not functioning', category: 'Academic', dept: 'ISE', priority: 'High', description: 'Multiple systems in lab 4 wont turn on. Keyboard is also missing in system 12.' },
    { title: 'Water leakage in washroom', category: 'Non-Academic', dept: 'Maintenance', priority: 'High', description: 'Continuous water leakage from the tap in the ground floor boys washroom.' },
    { title: 'Bus timing issue', category: 'Non-Academic', dept: 'Others', priority: 'Low', description: 'The bus on route 4 leaves 10 minutes early causing students to miss it.' },
    { title: 'Library books unavailable', category: 'Academic', dept: 'AIML', priority: 'Medium', description: 'Required machine learning textbooks are out of stock in the library.' },
    { title: 'Attendance portal issue', category: 'Academic', dept: 'CSE', priority: 'High', description: 'The portal shows absent for the class even though biometric was scanned.' },
    { title: 'Canteen hygiene complaint', category: 'Non-Academic', dept: 'Others', priority: 'High', description: 'Found insects buzzing near the food serving counter.' },
    { title: 'Network issue in lab', category: 'Academic', dept: 'ENML', priority: 'Medium', description: 'No internet access on the machines in the hardware lab.' },
    { title: 'Hostel electricity problem', category: 'Non-Academic', dept: 'Hostel', priority: 'High', description: 'Frequent power cuts in the girls hostel block B and backup generator is not starting.' },
    { title: 'Broken chairs in classroom', category: 'Non-Academic', dept: 'Maintenance', priority: 'Low', description: 'Three chairs in room 205 have broken backrests and are unsafe to sit on.' },
    { title: 'Parking spot flooded', category: 'Non-Academic', dept: 'Infrastructure', priority: 'Medium', description: 'The student parking area has water stagnation due to blocked drains.' }
];

const firstNames = ['Amit', 'Rahul', 'Priya', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Kavya', 'Siddharth', 'Nisha'];
const lastNames = ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Reddy', 'Rao', 'Das', 'Joshi'];
const statuses = ['Pending', 'In Progress', 'Resolved'];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const complaints = [];

for (let i = 1; i <= 30; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const usnNum = i.toString().padStart(3, '0');
    const usn = `4MC23CS${usnNum}`;
    const email = `${usn.toLowerCase()}@college.edu`;
    
    // Pick a random realistic scenario
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const assignedDepartment = status !== 'Pending' ? scenario.dept : null;
    const departmentResponse = status === 'Resolved' ? 'The issue has been verified and resolved by the respective personnel.' : null;
    
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    const createdAt = randomDate(startMonth, today).toISOString().replace('T', ' ').substring(0, 19);

    complaints.push({
        id: generateId(),
        name,
        email,
        studentId: usn,
        category: scenario.category,
        department: scenario.dept,
        priority: scenario.priority,
        title: scenario.title,
        description: scenario.description,
        image: '',
        status,
        assignedDepartment,
        departmentResponse,
        createdAt
    });
}

db.serialize(() => {
    // 1. Delete existing data to start clean
    db.run(`DELETE FROM complaints`, (err) => {
        if(err) console.error("Error clearing table:", err);
    });

    // 2. Insert 30 realistic Dummy constraints
    const stmt = db.prepare(`
        INSERT INTO complaints (id, name, email, studentId, category, department, priority, title, description, image, status, assignedDepartment, departmentResponse, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    complaints.forEach(c => {
        stmt.run([c.id, c.name, c.email, c.studentId, c.category, c.department, c.priority, c.title, c.description, c.image, c.status, c.assignedDepartment, c.departmentResponse, c.createdAt]);
    });
    
    stmt.finalize((err) => {
        if (err) {
            console.error('Error inserting dummy data:', err.message);
        } else {
            console.log('Successfully cleared database and inserted 30 realistic dummy complaints!');
        }
        db.close();
    });
});
