const API_URL = "https://grievance-backend.onrender.com";
console.log("updated grievance portal UI");
// Utility: Base64 Image Converter
const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

// ==========================================
// SUBMIT COMPLAINT PAGE LOGIC
// ==========================================
const submitForm = document.getElementById('submitForm') || document.getElementById('submitComplaintForm');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const dropZone = document.getElementById('dropZone');
let base64Image = "";

if (imageInput) {
    // Handle File Input Change
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            base64Image = await getBase64(file);
            if(imagePreview) {
                imagePreview.src = base64Image;
                imagePreview.classList.remove('hidden');
            }
            if(dropZone) dropZone.classList.add('hidden');
        }
    });

    // Drag and Drop Visuals
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-indigo-500', 'bg-indigo-500/10');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');
        });
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-indigo-500', 'bg-indigo-500/10');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                base64Image = await getBase64(file);
                if(imagePreview) {
                    imagePreview.src = base64Image;
                    imagePreview.classList.remove('hidden');
                }
                dropZone.classList.add('hidden');
                // update input files (trick to keep it consistent though not strictly needed for base64 upload)
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;
            }
        });
    }
}

// AI Assistant Mock
const aiImproveBtn = document.getElementById('aiImproveBtn');
if (aiImproveBtn) {
    aiImproveBtn.addEventListener('click', () => {
        const descInput = document.getElementById('description');
        const box = document.getElementById('aiSuggestionBox');
        const aiText = document.getElementById('aiSuggestedText');
        
        if (!descInput.value.trim()) {
            aiText.innerText = "Please write a brief description first so I can improve it!";
        } else {
            // Mock AI improvement
            aiText.innerText = `"I would like to report an issue regarding [Category]. Specifically, ${descInput.value.toLowerCase()}. This requires urgent attention to ensure a smooth academic experience. Thank you."`;
        }
        
        box.classList.remove('hidden');
    });

    document.getElementById('applyAiText').addEventListener('click', () => {
        const aiText = document.getElementById('aiSuggestedText').innerText;
        if(aiText !== "Please write a brief description first so I can improve it!") {
            document.getElementById('description').value = aiText.replace(/"/g, '');
        }
        document.getElementById('aiSuggestionBox').classList.add('hidden');
    });
}

// Form Submission
if (submitForm) {
    submitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = submitForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
        submitBtn.disabled = true;

        const newID = 'GRV-' + Math.floor(1000 + Math.random() * 9000);
        
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        const nameEl = document.getElementById('name');
        const emailEl = document.getElementById('email');
        const titleEl = document.getElementById('title');
        const descEl = document.getElementById('description') || document.getElementById('desc');

        const payload = {
            id: newID,
            name: nameEl ? nameEl.value : (userObj.name || "Student"),
            email: emailEl ? emailEl.value : (userObj.email || "student@university.edu"),
            category: document.getElementById('category') ? document.getElementById('category').value : "Other",
            title: titleEl ? titleEl.value : "Grievance Report",
            description: descEl ? descEl.value : "",
            image: base64Image,
            status: 'Pending'
        };

        try {
            // First, try to fetch to the real backend with a very short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 800);

            let res = null;
            try {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
            } catch(e) {
                // Fetch aborted or failed to connect
            }
            clearTimeout(timeoutId);

            // Regardless of backend success, force local storage update so UI is instant and never hangs
            let local = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
            local.push(payload);
            localStorage.setItem('sys_complaints', JSON.stringify(local));

            if(document.getElementById('displayId')) document.getElementById('displayId').innerText = newID;
            if(document.getElementById('idDisplay')) document.getElementById('idDisplay').innerText = newID;
            if(document.getElementById('displayTrackingId')) document.getElementById('displayTrackingId').innerText = newID;
            
            if(document.getElementById('successState')) document.getElementById('successState').classList.remove('hidden');
            if(document.getElementById('successCard')) document.getElementById('successCard').classList.remove('hidden');
            
            if(document.getElementById('formContainer')) {
                document.getElementById('formContainer').classList.add('hidden');
            } else {
                submitForm.classList.add('hidden');
            }

        } catch (error) {
            console.error("Submission error:", error);
            alert("An error occurred during submission.");
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==========================================
// TRACK COMPLAINT PAGE LOGIC
// ==========================================
const trackForm = document.getElementById('trackForm');
if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('trackID').value.toUpperCase().trim();
        const resBox = document.getElementById('statusResult');
        const errBox = document.getElementById('errorState');
        const submitBtn = trackForm.querySelector('button[type="submit"]');

        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        
        try {
            let found = null;
            
            // Try fetching from API
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(`${API_URL}/${id}`, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if(response.ok) {
                    const json = await response.json();
                    found = json.data;
                } else {
                    throw new Error("Server returned error");
                }
            } catch(e) {
                console.warn("Backend unavailable or slow, using local fallback:", e);
                // Fallback to local storage if API fails
                const local = JSON.parse(localStorage.getItem('complaints') || '[]');
                found = local.find(c => c.id === id);
            }

            if (found) {
                errBox.classList.add('hidden');
                resBox.classList.remove('hidden');
                
                document.getElementById('resultID').innerText = found.id;
                document.getElementById('resultTitle').innerText = found.title;
                document.getElementById('resultCategory').innerText = found.category || 'N/A';
                document.getElementById('resultDesc').innerText = found.description || 'No description provided.';
                document.getElementById('resultDate').innerText = found.createdAt ? new Date(found.createdAt).toLocaleString() : new Date().toLocaleString();
                
                // Status Badge
                const badgeContainer = document.getElementById('statusBadgeContainer');
                let badgeClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                if(found.status === 'In Progress') badgeClass = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                if(found.status === 'Resolved') badgeClass = 'bg-green-500/20 text-green-400 border-green-500/30';
                
                badgeContainer.innerHTML = `<span class="px-4 py-2 rounded-lg text-sm font-bold border ${badgeClass}">${found.status}</span>`;

                // Timeline update
                const tProgress = document.getElementById('timelineProgress');
                const tResolved = document.getElementById('timelineResolved');
                
                tProgress.classList.add('opacity-50');
                tResolved.classList.add('opacity-50');
                tProgress.querySelector('span').className = 'absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600';
                tResolved.querySelector('span').className = 'absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600';

                if(found.status === 'In Progress' || found.status === 'Resolved') {
                    tProgress.classList.remove('opacity-50');
                    tProgress.querySelector('span').className = 'absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]';
                }
                if(found.status === 'Resolved') {
                    tResolved.classList.remove('opacity-50');
                    tResolved.querySelector('span').className = 'absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
                    // clear purple shadow from progress
                    tProgress.querySelector('span').className = 'absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-purple-500'; 
                }

                // Image
                const imgContainer = document.getElementById('resultImageContainer');
                if(found.image) {
                    document.getElementById('resultImage').src = found.image;
                    imgContainer.classList.remove('hidden');
                } else {
                    imgContainer.classList.add('hidden');
                }
            } else {
                resBox.classList.add('hidden');
                errBox.classList.remove('hidden');
            }
        } finally {
            submitBtn.innerHTML = `Search`;
        }
    });
}

// ==========================================
// ADMIN DASHBOARD LOGIC
// ==========================================
const adminList = document.getElementById('adminList');
let complaintsData = [];
let chartInstance = null;

const fetchComplaints = async () => {
    try {
        const response = await fetch(API_URL);
        if(response.ok) {
            const json = await response.json();
            complaintsData = json.data;
        } else {
            throw new Error("API failed");
        }
    } catch(e) {
        // Fallback
        complaintsData = JSON.parse(localStorage.getItem('complaints') || '[]');
    }
    renderAdminTable();
    updateAdminStats();
    renderChart();
};

const getStatusBadge = (status) => {
    if(status === 'Pending') return `<span class="px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Pending</span>`;
    if(status === 'In Progress') return `<span class="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">In Progress</span>`;
    return `<span class="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">Resolved</span>`;
};

const renderAdminTable = () => {
    if (!adminList) return;
    const search = document.getElementById('adminSearch').value.toLowerCase();
    const filter = document.getElementById('adminFilter').value;
    
    document.getElementById('tableLoader').classList.add('hidden');
    adminList.innerHTML = '';

    const filtered = complaintsData.filter(item => {
        const mSearch = (item.name || '').toLowerCase().includes(search) || item.id.toLowerCase().includes(search);
        const mFilter = filter === "All" || item.category === filter;
        return mSearch && mFilter;
    });

    if(filtered.length === 0) {
        adminList.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No grievances found.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        adminList.innerHTML += `
        <tr class="hover:bg-white/5 transition-colors cursor-pointer" onclick="openModal('${item.id}')">
            <td class="p-4 font-mono text-indigo-400 text-sm font-semibold">${item.id}</td>
            <td class="p-4">
                <p class="font-bold text-slate-200 text-sm">${item.name || 'Anonymous'}</p>
                <p class="text-xs text-slate-500 truncate w-48">${item.title}</p>
            </td>
            <td class="p-4 text-sm text-slate-300">${item.category || 'N/A'}</td>
            <td class="p-4">${getStatusBadge(item.status)}</td>
            <td class="p-4 text-right">
                <button class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </td>
        </tr>
        `;
    });
};

const updateAdminStats = () => {
    if(!document.getElementById('statTotal')) return;
    document.getElementById('statTotal').innerText = complaintsData.length;
    document.getElementById('statPending').innerText = complaintsData.filter(c => c.status === 'Pending').length;
    document.getElementById('statProgress').innerText = complaintsData.filter(c => c.status === 'In Progress').length;
    document.getElementById('statResolved').innerText = complaintsData.filter(c => c.status === 'Resolved').length;
};

const renderChart = () => {
    const ctx = document.getElementById('complaintChart');
    if(!ctx) return;

    const counts = [
        complaintsData.filter(c => c.status === 'Pending').length,
        complaintsData.filter(c => c.status === 'In Progress').length,
        complaintsData.filter(c => c.status === 'Resolved').length
    ];

    if(chartInstance) chartInstance.destroy();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Resolved'],
            datasets: [{
                data: counts,
                backgroundColor: ['#f97316', '#a855f7', '#22c55e'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
            }
        }
    });
};

// Admin Filters
if(document.getElementById('adminSearch')) {
    document.getElementById('adminSearch').addEventListener('input', renderAdminTable);
    document.getElementById('adminFilter').addEventListener('change', renderAdminTable);
    fetchComplaints(); // Initial load
}

// Modal Logic
let currentModalId = null;

window.openModal = (id) => {
    const found = complaintsData.find(c => c.id === id);
    if(!found) return;
    
    currentModalId = id;
    document.getElementById('modalId').innerText = found.id;
    document.getElementById('modalName').innerText = found.name || 'Anonymous';
    document.getElementById('modalTitle').innerText = found.title;
    document.getElementById('modalCategory').innerText = found.category || 'N/A';
    document.getElementById('modalDesc').innerText = found.description || 'No description provided';
    document.getElementById('modalStatusBadge').innerHTML = getStatusBadge(found.status);
    document.getElementById('modalStatusSelect').value = found.status;
    
    if(found.image) {
        document.getElementById('modalImage').src = found.image;
        document.getElementById('modalImageLink').href = found.image;
        document.getElementById('modalImageContainer').classList.remove('hidden');
    } else {
        document.getElementById('modalImageContainer').classList.add('hidden');
    }

    document.getElementById('detailModal').classList.remove('hidden');
};

window.closeModal = () => {
    document.getElementById('detailModal').classList.add('hidden');
    currentModalId = null;
};

const modalUpdateBtn = document.getElementById('modalUpdateBtn');
if(modalUpdateBtn) {
    modalUpdateBtn.addEventListener('click', async () => {
        if(!currentModalId) return;
        const newStatus = document.getElementById('modalStatusSelect').value;
        const btnText = modalUpdateBtn.innerText;
        modalUpdateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
        
        try {
            const response = await fetch(`${API_URL}/${currentModalId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if(response.ok) {
                // success
            } else {
                throw new Error("Update failed");
            }
        } catch(e) {
            // Local fallback
            let local = JSON.parse(localStorage.getItem('complaints') || '[]');
            let i = local.findIndex(c => c.id === currentModalId);
            if(i !== -1) {
                local[i].status = newStatus;
                localStorage.setItem('complaints', JSON.stringify(local));
            }
        } finally {
            modalUpdateBtn.innerHTML = btnText;
            closeModal();
            fetchComplaints(); // refresh data
        }
    });
}

// ==========================================
// DEPARTMENT DASHBOARD LOGIC
// ==========================================
const deptDashboardList = document.getElementById('deptDashboardList');
let deptDataId = null;

const renderDeptList = () => {
    if(!deptDashboardList) return;
    
    // Fallback to checkAuth user details, or default to a generic "Department" role if missing
    const user = JSON.parse(localStorage.getItem('user')) || { department: 'Maintenance' };
    const deptNameDisplay = document.getElementById('deptNameDisplay');
    if(deptNameDisplay) deptNameDisplay.innerText = `${user.department} Unit`;

    const data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
    // Filter by the department's assigned tickets (for mockup purposes we'll show all if unassigned isn't fully set)
    const assignedData = data.filter(c => c.assignedDepartment === user.department || c.category === user.department);
    
    // Stats
    if(document.getElementById('statAssigned')) document.getElementById('statAssigned').innerText = assignedData.length;
    if(document.getElementById('statProgress')) document.getElementById('statProgress').innerText = assignedData.filter(c => c.status === 'In Progress').length;
    if(document.getElementById('statResolved')) document.getElementById('statResolved').innerText = assignedData.filter(c => c.status === 'Resolved').length;

    deptDashboardList.innerHTML = '';
    if(assignedData.length === 0) {
        deptDashboardList.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-slate-500">No active assignments for your unit.</td></tr>`;
        return;
    }

    assignedData.reverse().forEach(c => {
        deptDashboardList.innerHTML += `
        <tr class="hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer" onclick="openDeptModal('${c.id}')">
            <td class="p-4 font-mono text-indigo-400 text-sm">${c.id}</td>
            <td class="p-4"><p class="font-bold text-slate-200 text-sm">${c.title}</p></td>
            <td class="p-4 text-sm text-slate-300">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
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
    
    deptDataId = id;
    if(document.getElementById('modalId')) document.getElementById('modalId').innerText = c.id;
    if(document.getElementById('modalTitle')) document.getElementById('modalTitle').innerText = c.title || 'Untitled Grievance';
    if(document.getElementById('modalDesc')) document.getElementById('modalDesc').innerText = c.description || 'No description provided';
    
    // Fallback for older tickets that didn't save name/email
    const safeName = c.name || c.studentName || 'Anonymous Student';
    const safeEmail = c.email || c.studentEmail || 'No Email Provided';
    if(document.getElementById('modalStudent')) document.getElementById('modalStudent').innerText = `${safeName} (${safeEmail})`;
    
    if(document.getElementById('modalStatusSelect')) document.getElementById('modalStatusSelect').value = c.status || 'Pending';
    
    if(document.getElementById('deptModal')) document.getElementById('deptModal').classList.remove('hidden');
};

window.closeDeptModal = () => {
    if(document.getElementById('deptModal')) document.getElementById('deptModal').classList.add('hidden');
    deptDataId = null;
};

const deptModalUpdateBtn = document.getElementById('modalUpdateBtn');
if(deptModalUpdateBtn && document.getElementById('deptModal')) {
    deptModalUpdateBtn.addEventListener('click', () => {
        const newStatus = document.getElementById('modalStatusSelect').value;
        const note = document.getElementById('modalResponse') ? document.getElementById('modalResponse').value : '';
        
        const btnText = deptModalUpdateBtn.innerHTML;
        deptModalUpdateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;
        
        setTimeout(() => {
            let data = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
            let index = data.findIndex(x => x.id === deptDataId);
            if(index > -1) {
                data[index].status = newStatus;
                if(note.trim()) {
                    data[index].departmentResponse = note;
                }
                localStorage.setItem('sys_complaints', JSON.stringify(data));
                
                alert(`Ticket status updated to ${newStatus}!\nThe student has been automatically notified.`);
            }
            deptModalUpdateBtn.innerHTML = btnText;
            closeDeptModal();
            renderDeptList();
        }, 600);
    });
}

// Initialize Department Dashboard if on the page
if(document.getElementById('deptDashboardList')) {
    renderDeptList();
}

// ==========================================
// STUDENT DASHBOARD LOGIC
// ==========================================
const studentDashboardList = document.getElementById('studentDashboardList');

const renderStudentDashboard = () => {
    if(!studentDashboardList) return;
    
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const nameDisplay = document.getElementById('studentNameDisplay');
    if(nameDisplay) nameDisplay.innerText = user.name || "Student";
    
    const allData = JSON.parse(localStorage.getItem('sys_complaints') || '[]');
    // Filter strictly by student name/email if user data exists, else show all mock data as demo
    const myData = user.email ? allData.filter(c => c.email === user.email || c.email === 'student@university.edu') : allData;

    studentDashboardList.innerHTML = '';
    
    // Also grab the Inbox container
    const inboxContainer = document.querySelector('.glass-card p.text-orange-400').parentElement.parentElement;
    let newNotificationsHTML = '';

    if(myData.length === 0) {
        studentDashboardList.innerHTML = `<p class="p-6 text-slate-500 text-sm">No complaints filed yet.</p>`;
    } else {
        myData.reverse().forEach(c => {
            // Draw history item
            studentDashboardList.innerHTML += `
            <div class="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onclick="window.location.href='track-complaint.html?id=${c.id}'">
                <div class="flex justify-between items-start mb-2">
                    <p class="font-bold text-slate-200 text-sm">${c.title || 'Untitled Grievance'}</p>
                    ${getStatusBadge(c.status)}
                </div>
                <div class="flex justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-white/5">
                    <span class="font-mono text-indigo-400 font-bold">${c.id}</span>
                    <span>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                </div>
            </div>`;

            // If it has a response or is resolved, generate an inbox notification
            if(c.status === 'Resolved' || c.status === 'In Progress') {
                newNotificationsHTML += `
                <div class="p-4 bg-white/5 border border-white/10 rounded-xl text-sm mt-3">
                    <p class="text-xs text-indigo-400 font-bold mb-1">UPDATE ON ${c.id}</p>
                    <p class="text-slate-300">Your grievance status has been updated to <span class="text-white font-bold">${c.status}</span>.</p>
                    ${c.departmentResponse ? `<p class="mt-2 text-xs text-slate-400 italic bg-black/20 p-2 rounded">"${c.departmentResponse}"</p>` : ''}
                </div>`;
            }
        });
    }

    // Append notifications to inbox if there are any
    if(newNotificationsHTML) {
        inboxContainer.innerHTML += newNotificationsHTML;
    }
};

if(document.getElementById('studentDashboardList')) {
    renderStudentDashboard();
}
