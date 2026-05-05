# Student Database Setup Guide

## Changes Made

This update adds permanent database storage for student details using SQLite. Here's what has been implemented:

### 1. **Database Schema** ([database.js](database.js))
- Added a new `students` table with the following fields:
  - `id` - Unique student record ID
  - `name` - Full name of the student
  - `studentId` - Student ID (UNIQUE constraint)
  - `password` - Student password (stored as-is, consider hashing in production)
  - `email` - Student email address
  - `phone` - Student phone number
  - `department` - Department name
  - `semester` - Current semester
  - `createdAt` - Registration timestamp
  - `lastLogin` - Last login timestamp

### 2. **Server APIs** ([server.js](server.js))

#### Student Registration
**Endpoint:** `POST /api/students/register`
```json
{
  "name": "John Doe",
  "studentId": "4MC23CS073",
  "password": "securePassword123",
  "email": "john@university.edu",
  "phone": "+91 XXXXXXXXXX",
  "department": "Computer Science",
  "semester": "6"
}
```
**Response:**
```json
{
  "message": "registration_success",
  "data": {
    "id": "STU-1234567890",
    "studentId": "4MC23CS073",
    "name": "John Doe"
  }
}
```

#### Student Login
**Endpoint:** `POST /api/students/login`
```json
{
  "studentId": "4MC23CS073",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "message": "login_success",
  "data": {
    "id": "STU-1234567890",
    "name": "John Doe",
    "studentId": "4MC23CS073",
    "email": "john@university.edu",
    "phone": "+91 XXXXXXXXXX",
    "department": "Computer Science",
    "semester": "6",
    "role": "student"
  }
}
```

#### Get Student Profile
**Endpoint:** `GET /api/students/:id`

#### Update Student Profile
**Endpoint:** `PATCH /api/students/:id`

### 3. **Frontend Updates**

#### Student Registration Page ([pages/student-register.html](pages/student-register.html))
- Added email and phone fields to the registration form
- Updated form submission to call the registration API
- Data is now saved to the database permanently

#### Student Login Page ([pages/student-login.html](pages/student-login.html))
- Updated to authenticate against the database
- Stores user data in localStorage after successful login
- Validates credentials using database

## How to Use

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Start the Server
```powershell
npm start
```
The server will run on `http://localhost:3000`

### Step 3: Register a Student
1. Navigate to the student registration page
2. Fill in the form with student details
3. Click "Register Now"
4. Data will be saved to the database permanently

### Step 4: Login
1. Go to the student login page
2. Enter your Student ID and Password
3. Access the student dashboard with your profile data

## Database File
- Location: `grievances.db` (created in the project root)
- This SQLite database file stores all student and complaint data permanently
- Back up this file regularly to prevent data loss

## Features Implemented
✅ Permanent student data storage
✅ Student registration with validation
✅ Student login with database authentication
✅ Last login tracking
✅ Student profile management
✅ Unique Student ID constraint (prevents duplicate registrations)

## Security Notes
⚠️ **Important for Production:**
- Currently passwords are stored in plain text - implement proper hashing using bcryptjs
- Add HTTPS/SSL for secure data transmission
- Implement rate limiting for login attempts
- Add input validation and sanitization
- Use environment variables for API URLs

## Testing
To test the system:
1. Register a new student with Student ID "4MC23CS073"
2. Try logging in with the same credentials
3. Check if data persists after closing and reopening the browser
4. Verify that duplicate Student IDs are rejected

## Troubleshooting

### Server not responding
- Ensure Node.js is installed
- Check if port 3000 is not in use
- Read server console for error messages

### Registration fails
- Check that Student ID follows the correct format: `4MC23CS###`
- Ensure the server is running
- Check browser console for detailed error messages

### Login fails
- Verify Student ID and password are correct
- Check if student account exists in the database
- Ensure server is running on port 3000

