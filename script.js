const API_URL = 'http://localhost:3000/api/complaints';

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
const submitForm = document.getElementById('submitForm');
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
            imagePreview.src = base64Image;
            imagePreview.classList.remove('hidden');
            dropZone.classList.add('hidden');
        }
    });

    // Drag and Drop Visuals
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
            imagePreview.src = base64Image;
            imagePreview.classList.remove('hidden');
            dropZone.classList.add('hidden');
            // update input files (trick to keep it consistent though not strictly needed for base64 upload)
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;
        }
    });
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
        
        const payload = {
            id: newID,
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            category: document.getElementById('category').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            image: base64Image,
            status: 'Pending'
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                document.getElementById('displayTrackingId').innerText = newID;
                document.getElementById('successState').classList.remove('hidden');
                submitForm.parentElement.classList.add('hidden');
            } else {
                alert("Failed to submit grievance. Make sure backend is running.");
            }
        } catch (error) {
            console.error(error);
            // Fallback for local testing without server
            let local = JSON.parse(localStorage.getItem('complaints') || '[]');
            local.push(payload);
            localStorage.setItem('complaints', JSON.stringify(local));
            
            document.getElementById('displayTrackingId').innerText = newID;
            document.getElementById('successState').classList.remove('hidden');
            submitForm.parentElement.classList.add('hidden');
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
                const response = await fetch(`${API_URL}/${id}`);
                if(response.ok) {
                    const json = await response.json();
                    found = json.data;
                }
            } catch(e) {
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