const API_URL = 'http://localhost:3000/api';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

const getStatusBadge = (status) => {
    switch(status) {
        case 'Pending': return `<span class="px-2 py-1 rounded text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30"><i class="fa-solid fa-clock mr-1"></i>Pending</span>`;
        case 'Assigned': return `<span class="px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30"><i class="fa-solid fa-user-tag mr-1"></i>Assigned</span>`;
        case 'In Progress': return `<span class="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30"><i class="fa-solid fa-spinner fa-spin mr-1"></i>In Progress</span>`;
        case 'Resolved': return `<span class="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30"><i class="fa-solid fa-check-double mr-1"></i>Resolved</span>`;
        default: return `<span class="px-2 py-1 rounded text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">${status}</span>`;
    }
};

const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
};

const checkAuth = (roleRequired) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== roleRequired) {
        alert("Unauthorized access. Please login.");
        window.location.href = '../index.html';
        return null;
    }
    return user;
};

// ==========================================
// EMAIL NOTIFICATION SERVICE (EmailJS)
// ==========================================
// To make this work instantly:
// 1. Go to https://www.emailjs.com/ and sign up for free.
// 2. Add a new Email Service (Gmail)
// 3. Create an Email Template with:
//    Subject: Your Verification Code
//    Body: Your login OTP is: {{otp}}
// 4. Paste your 3 keys below!

window.sendOTPToEmail = async (userEmail, otpCode) => {
    // 🔴 CONFIGURATION: PASTE YOUR EMAILJS KEYS HERE 🔴
    const serviceID = "YOUR_SERVICE_ID_HERE"; 
    const templateID = "YOUR_TEMPLATE_ID_HERE";
    const publicKey = "YOUR_PUBLIC_KEY_HERE";

    if(serviceID === "YOUR_SERVICE_ID_HERE") {
        alert(`[MOCK 2FA SYSTEM] Your verification code is: ${otpCode}`);
        return;
    }

    try {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                service_id: serviceID,
                template_id: templateID,
                user_id: publicKey,
                template_params: {
                    to_email: userEmail,
                    otp: otpCode
                }
            })
        });
        console.log(`Real OTP successfully sent to ${userEmail}!`);
    } catch (error) {
        console.error("Failed to send OTP email", error);
        alert(`Failed to send email. Fallback OTP display: ${otpCode}`);
    }
};

// ==========================================
// AUTHENTICATION LOGIC (MOCK)
// ==========================================
const handleLogin = (formId, role, redirectUrl, requiresOtp = false) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Support both old "email" login and new "Student ID" login
        const emailEl = document.getElementById('email');
        const studentIdEl = document.getElementById('studentId');
        const identifier = studentIdEl ? studentIdEl.value.toUpperCase() : (emailEl ? emailEl.value : 'user');
        
        const passwordInput = form.querySelector('input[type="password"]');
        const password = passwordInput ? passwordInput.value : '';

        const btn = form.querySelector('button[type="submit"]');
        const origText = btn.innerHTML;
        
        // --- HARDCODED ROLE VALIDATION ---
        if (role === 'admin') {
            if (identifier !== 'manyahcmce@gmail.com') {
                alert("Access Denied: Unrecognized Admin Email.");
                return;
            }
            if (password !== '241424') {
                alert("Access Denied: Incorrect Password.");
                return;
            }
        }
        if (role === 'department') {
            const dept = document.getElementById('deptSelect')?.value;
            let expectedEmail = '';
            if (dept === 'Academic') expectedEmail = 'llakshmir895@gmail.com';
            else if (dept === 'Hostel') expectedEmail = 'nishashankarppa2005@gmail.com';
            else if (dept === 'Infrastructure') expectedEmail = 'preranagowda454@gmail.com';
            else if (dept === 'Maintenance') expectedEmail = 'manyahcmce@gmail.com';

            if (identifier !== expectedEmail) {
                alert(`Access Denied: Unrecognized Email for ${dept} Unit.`);
                return;
            }
            if (password !== '241424') {
                alert("Access Denied: Incorrect Password.");
                return;
            }
        }
        // ---------------------------------

        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
        btn.disabled = true;

        if (role === 'student') {
            fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: identifier, password: password })
            })
            .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
            .then(res => {
                if (!res.ok) {
                    alert(res.data.error || "Invalid login credentials");
                    btn.innerHTML = origText;
                    btn.disabled = false;
                } else {
                    localStorage.setItem('user', JSON.stringify({
                        email: identifier, // keep for compat with older systems
                        studentId: res.data.data.studentId,
                        name: res.data.data.name,
                        role: role,
                        department: null
                    }));
                    window.location.href = redirectUrl;
                }
            })
            .catch(err => {
                alert("Network error. Is the server running?");
                btn.innerHTML = origText;
                btn.disabled = false;
            });
            return;
        }

        setTimeout(() => {
            if (requiresOtp) {
                // Generate a 6-digit mock OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                // 60-second expiration timestamp
                const expiry = new Date().getTime() + 60000;
                
                // Save temp auth session to verify later
                const tempAuth = {
                    identifier: identifier,
                    name: identifier.split('@')[0],
                    role: role,
                    department: role === 'department' ? document.getElementById('deptSelect')?.value || 'Maintenance' : null,
                    redirectUrl: redirectUrl,
                    otp: otp,
                    expiry: expiry
                };
                localStorage.setItem('temp_auth', JSON.stringify(tempAuth));
                
                // Send the real email instead of just mocking it!
                window.sendOTPToEmail(identifier, otp);
                
                window.location.href = '../pages/otp-verification.html';
                
            } else {
                localStorage.setItem('user', JSON.stringify({
                    email: role === 'student' ? 'student@university.edu' : identifier,
                    studentId: identifier,
                    name: role === 'student' ? 'Student' : identifier.split('@')[0],
                    role: role,
                    department: role === 'department' ? document.getElementById('deptSelect')?.value || 'Maintenance' : null
                }));
                window.location.href = redirectUrl;
            }
        }, 1000);
    });
};

// ==========================================
// STUDENT LOGIC
// ==========================================
// 1. Submit Complaint
const submitForm = document.getElementById('submitComplaintForm');
if (submitForm) {
    const user = checkAuth('student');
    
    // Image Upload Preview
    let base64Image = "";
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                base64Image = await getBase64(file);
                document.getElementById('imagePreview').src = base64Image;
                document.getElementById('imagePreview').classList.remove('hidden');
            }
        });
    }

    submitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = submitForm.querySelector('button[type="submit"]');
        const orig = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
        btn.disabled = true;

        const newID = 'GRV-' + Math.floor(1000 + Math.random() * 9000);
        const payload = {
            id: newID,
            studentEmail: user.email,
            studentName: user.name,
            title: document.getElementById('title').value,
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            image: base64Image,
            status: 'Pending',
            assignedDepartment: null,
            createdAt: new Date().toISOString()
        };

        try {
            // Fallback to local array since our backend might not be perfectly seeded for this schema yet natively
            let local = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
            local.push(payload);
            localStorage.setItem('sys_complaints', JSON.stringify(local));

            document.getElementById('formContainer').classList.add('hidden');
            document.getElementById('successState').classList.remove('hidden');
            document.getElementById('displayId').innerText = newID;
        } catch(err) {
            console.error(err);
        } finally {
            btn.innerHTML = orig;
            btn.disabled = false;
        }
    });
}

// 2. Student Dashboard List
if (document.getElementById('studentDashboardList')) {
    const user = checkAuth('student');
    if(user) {
        document.getElementById('studentNameDisplay').innerText = user.name;
    
        const renderStudentList = () => {
            const list = document.getElementById('studentDashboardList');
            const inboxContainer = document.querySelector('.glass-card p.text-orange-400').parentElement.parentElement;
            
            // Handle both older mock data (studentEmail) and newer root-script data (email)
            const allData = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
            const data = allData.filter(c => c.email === user.email || c.studentEmail === user.email || c.email === 'student@university.edu');
            
            list.innerHTML = '';
            let newNotificationsHTML = '';
            
            if(data.length === 0) {
                list.innerHTML = `<p class="text-slate-500 text-sm">No complaints filed yet.</p>`;
                return;
            }
    
            data.reverse().forEach(c => {
                list.innerHTML += `
                <div class="glass-panel p-4 rounded-xl flex flex-col hover:bg-white/5 transition-colors cursor-pointer mb-3" onclick="window.location.href='track-complaint.html?id=${c.id}'">
                    <div class="flex items-center justify-between">
                        <h4 class="font-bold text-slate-200">${c.title || 'Untitled Grievance'}</h4>
                        <div>${getStatusBadge(c.status)}</div>
                    </div>
                    <p class="text-xs text-slate-500 font-mono mt-2">${c.id} • ${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                </div>`;
                
                if(c.status === 'Resolved' || c.status === 'In Progress') {
                    newNotificationsHTML += `
                    <div class="p-4 bg-white/5 border border-white/10 rounded-xl text-sm mt-3">
                        <p class="text-xs text-indigo-400 font-bold mb-1">UPDATE ON ${c.id}</p>
                        <p class="text-slate-300">Your grievance status has been updated to <span class="text-white font-bold">${c.status}</span>.</p>
                        ${c.departmentResponse ? `<p class="mt-2 text-xs text-slate-400 italic bg-black/20 p-2 rounded">"${c.departmentResponse}"</p>` : ''}
                    </div>`;
                }
            });
            
            if(newNotificationsHTML) {
                inboxContainer.innerHTML += newNotificationsHTML;
            }
        };
        renderStudentList();
    }
}

// ==========================================
// ADMIN LOGIC
// ==========================================
if(document.getElementById('adminDashboardList')) {
    checkAuth('admin');

    window.assignedDataId = null;

    const renderAdminList = () => {
        const list = document.getElementById('adminDashboardList');
        const filter = document.getElementById('adminFilter').value;
        const data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
        
        // Stats update
        document.getElementById('statTotal').innerText = data.length;
        document.getElementById('statUnassigned').innerText = data.filter(c => !c.assignedDepartment).length;
        document.getElementById('statResolved').innerText = data.filter(c => c.status === 'Resolved').length;

        list.innerHTML = '';
        const filtered = data.filter(c => filter === 'All' || c.category === filter);

        if(filtered.length === 0) {
            list.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No grievances found.</td></tr>`;
            return;
        }

        filtered.reverse().forEach(c => {
            list.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5 transition-colors">
                <td class="p-4 font-mono text-indigo-400 text-sm">${c.id}</td>
                <td class="p-4"><p class="font-bold text-slate-200 text-sm">${c.studentName}</p></td>
                <td class="p-4 text-sm text-slate-300 w-48 truncate">${c.title}</td>
                <td class="p-4 text-sm">${c.category}</td>
                <td class="p-4">${getStatusBadge(c.status)}</td>
                <td class="p-4 text-right">
                    <button onclick="openAdminModal('${c.id}')" class="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold transition-colors">
                        View / Assign
                    </button>
                </td>
            </tr>`;
        });
    };

    window.openAdminModal = (id) => {
        const data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
        const c = data.find(x => x.id === id);
        if(!c) return;
        
        window.assignedDataId = id;
        document.getElementById('modalId').innerText = c.id;
        document.getElementById('modalTitle').innerText = c.title;
        document.getElementById('modalDesc').innerText = c.description;
        document.getElementById('modalStatusBadge').innerHTML = getStatusBadge(c.status);
        document.getElementById('modalDeptSelect').value = c.assignedDepartment || '';
        
        document.getElementById('adminModal').classList.remove('hidden');
    };

    window.closeAdminModal = () => document.getElementById('adminModal').classList.add('hidden');

    document.getElementById('modalAssignBtn').addEventListener('click', () => {
        const dept = document.getElementById('modalDeptSelect').value;
        if(!dept) return alert("Select a department!");
        
        let data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
        let index = data.findIndex(x => x.id === window.assignedDataId);
        if(index > -1) {
            data[index].assignedDepartment = dept;
            if(data[index].status === 'Pending') data[index].status = 'Assigned';
            localStorage.setItem('sys_complaints', JSON.stringify(data));
        }
        closeAdminModal();
        renderAdminList();
    });

    document.getElementById('adminFilter').addEventListener('change', renderAdminList);
    renderAdminList();
}

// ==========================================
// DEPARTMENT LOGIC
// ==========================================
if(document.getElementById('deptDashboardList')) {
    const user = checkAuth('department');
    document.getElementById('deptNameDisplay').innerText = `${user.department} Department`;

    window.deptDataId = null;

    const renderDeptList = () => {
        const list = document.getElementById('deptDashboardList');
        const data = JSON.parse(localStorage.getItem('sys_complaints') || '[]').filter(c => c.assignedDepartment === user.department);
        
        document.getElementById('statAssigned').innerText = data.length;
        document.getElementById('statProgress').innerText = data.filter(c => c.status === 'In Progress').length;
        document.getElementById('statResolved').innerText = data.filter(c => c.status === 'Resolved').length;

        list.innerHTML = '';
        if(data.length === 0) {
            list.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">No assigned grievances for your department.</td></tr>`;
            return;
        }

        data.reverse().forEach(c => {
            list.innerHTML += `
            <tr class="hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer" onclick="openDeptModal('${c.id}')">
                <td class="p-4 font-mono text-indigo-400 text-sm">${c.id}</td>
                <td class="p-4"><p class="font-bold text-slate-200 text-sm">${c.title}</p></td>
                <td class="p-4 text-sm text-slate-300">${new Date(c.createdAt).toLocaleDateString()}</td>
                <td class="p-4">${getStatusBadge(c.status)}</td>
                <td class="p-4 text-right">
                    <i class="fa-solid fa-chevron-right text-slate-500"></i>
                </td>
            </tr>`;
        });
    };

    window.openDeptModal = (id) => {
        const data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
        const c = data.find(x => x.id === id);
        if(!c) return;
        
        window.deptDataId = id;
        document.getElementById('modalId').innerText = c.id;
        document.getElementById('modalTitle').innerText = c.title;
        document.getElementById('modalDesc').innerText = c.description;
        document.getElementById('modalStudent').innerText = `${c.studentName} (${c.studentEmail})`;
        document.getElementById('modalStatusSelect').value = c.status;
        
        document.getElementById('deptModal').classList.remove('hidden');
    };

    window.closeDeptModal = () => document.getElementById('deptModal').classList.add('hidden');

    document.getElementById('modalUpdateBtn').addEventListener('click', () => {
        const status = document.getElementById('modalStatusSelect').value;
        const note = document.getElementById('modalResponse').value;
        
        let data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
        let index = data.findIndex(x => x.id === window.deptDataId);
        if(index > -1) {
            data[index].status = status;
            if(note.trim()) {
                data[index].departmentResponse = note;
            }
            localStorage.setItem('sys_complaints', JSON.stringify(data));
            alert(`Status updated and Student notified: ${status}`);
        }
        closeDeptModal();
        renderDeptList();
    });

    renderDeptList();
}
