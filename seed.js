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
    // CSE Department Issues
    { title: 'Attendance portal bug - not recording marks', category: 'CSE', priority: 'High', description: 'The attendance portal shows absent for the class even though biometric was scanned. Multiple students from CSE batch have reported the same issue.' },
    { title: 'Lab systems not functioning properly', category: 'CSE', priority: 'High', description: 'Multiple workstations in CSE lab 2 won\'t boot up. System 8, 12 and 15 have been down for 3 days.' },
    { title: 'WiFi connectivity issues in CSE block', category: 'CSE', priority: 'Medium', description: 'Intermittent WiFi disconnections in CSE corridor affecting online assignment submissions.' },
    { title: 'Classroom projector display problem', category: 'CSE', priority: 'Medium', description: 'The projector in CSE classroom 302 has distorted color and flickering display affecting lecture visibility.' },
    
    // ISE Department Issues
    { title: 'Database lab equipment malfunction', category: 'ISE', priority: 'High', description: 'Database servers in ISE lab are not responding. Cannot access databases for practical assignments.' },
    { title: 'Lab report evaluation delay', category: 'ISE', priority: 'Medium', description: 'Lab reports for Information Systems course submitted 2 weeks ago are still not evaluated.' },
    { title: 'Classroom AC not working', category: 'ISE', priority: 'Medium', description: 'Air conditioning system in ISE classroom 105 is broken, making it unbearable during afternoon classes.' },
    { title: 'Missing practical session schedule', category: 'ISE', priority: 'Low', description: 'Updated practical session schedule for ISE hasn\'t been posted on the portal yet.' },
    
    // AIML Department Issues
    { title: 'Machine learning library installation failure', category: 'AIML', priority: 'High', description: 'Required ML libraries (TensorFlow, PyTorch) won\'t install on lab systems due to permission restrictions.' },
    { title: 'GPU server down for training', category: 'AIML', priority: 'High', description: 'The GPU server used for neural network training has been offline for 5 days.' },
    { title: 'Missing course materials and datasets', category: 'AIML', priority: 'Medium', description: 'Professor hasn\'t uploaded course materials and datasets for AI & ML specialization yet.' },
    { title: 'Library AI books out of stock', category: 'AIML', priority: 'Low', description: 'Required AI and ML textbooks are out of stock in the library. No copies available.' },
    
    // Hostel Issues
    { title: 'WiFi not working in hostel', category: 'Hostel', priority: 'High', description: 'The WiFi router on the 3rd floor is completely dead. Unable to do assignments and online classes.' },
    { title: 'Electricity problem - frequent power cuts', category: 'Hostel', priority: 'High', description: 'Frequent power cuts in girls hostel block B. Backup generator is not starting automatically.' },
    { title: 'Water leakage in hostel rooms', category: 'Hostel', priority: 'High', description: 'Continuous water leakage from the AC duct damaging furniture and clothes in affected rooms.' },
    { title: 'Hostel canteen hygiene issue', category: 'Hostel', priority: 'High', description: 'Found insects in food being served at hostel canteen. Inadequate cleaning and hygiene measures.' },
    { title: 'Broken furniture in hostel', category: 'Hostel', priority: 'Low', description: 'Beds and chairs in multiple hostel rooms have broken frames and hinges.' },
    
    // Infrastructure Issues
    { title: 'Campus parking flooded', category: 'Infrastructure', priority: 'High', description: 'Student parking area has water stagnation due to blocked drains during monsoon season.' },
    { title: 'Broken streetlights on campus', category: 'Infrastructure', priority: 'Medium', description: 'Multiple streetlights on the main campus road are not functioning, creating safety concerns at night.' },
    { title: 'Library building washroom maintenance', category: 'Infrastructure', priority: 'High', description: 'Washroom in library ground floor has broken taps and non-functional flush systems.' },
    { title: 'Class building elevator broken', category: 'Infrastructure', priority: 'Medium', description: 'Elevator in academic block 3 is stuck on 2nd floor. Students with mobility issues cannot access upper floors.' },
    
    // Maintenance Issues
    { title: 'Water leakage in washroom', category: 'Maintenance', priority: 'High', description: 'Continuous water leakage from the tap in the ground floor boys washroom causing flooding.' },
    { title: 'Broken chairs in classroom', category: 'Maintenance', priority: 'Medium', description: 'Three chairs in room 205 have broken backrests and are unsafe to sit on.' },
    { title: 'Damaged campus pathways', category: 'Maintenance', priority: 'Medium', description: 'Multiple potholes and cracks in campus walkways creating slip and trip hazards.' },
    { title: 'Roof leakage during rain', category: 'Maintenance', priority: 'High', description: 'Classroom 401 has severe roof leakage during monsoon, affecting classes and damaging property.' },
    
    // Admin Block Issues
    { title: 'Certificate generation delay', category: 'AdminBlock', priority: 'Medium', description: 'Certificate requests submitted 3 months ago are still pending processing by admin office.' },
    { title: 'Document attestation procedure unclear', category: 'AdminBlock', priority: 'Low', description: 'The document attestation and certification procedure is not clearly communicated on the portal.' },
    { title: 'Admission letter not received', category: 'AdminBlock', priority: 'High', description: 'Admission letter for new batch has not been issued even after completing the registration process.' },
    { title: 'Fee payment portal error', category: 'AdminBlock', priority: 'High', description: 'Fee payment portal shows error during transaction. Student fees cannot be submitted online.' },
    
    // Other Issues
    { title: 'Bus timing inconsistency', category: 'Other', priority: 'Low', description: 'The campus shuttle bus on route 4 leaves 10 minutes early causing students to miss it.' },
    { title: 'General complaint about campus facilities', category: 'Other', priority: 'Low', description: 'Overall concerns about campus infrastructure and facilities maintenance.' }
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
    
    const assignedDepartment = status !== 'Pending' ? scenario.category : null;
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
        department: scenario.category,
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
