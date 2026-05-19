const API_BASE = window.location.origin;

// ==========================================
// STUDENT PROFILE LOOKUP SUBSYSTEM ENGINE
// ==========================================
async function fetchStudentProfile() {
    const regNo = document.getElementById('studentRegNoInput').value.trim();
    const feedback = document.getElementById('searchFeedback');
    const profileArea = document.getElementById('studentProfileArea');
    
    feedback.innerText = "";
    if(!regNo) { feedback.innerText = "Please input structural Registration key."; return; }

    try {
        const response = await fetch(`${API_BASE}/student/${regNo}`);
        if(!response.ok) {
            feedback.innerText = "No student matches identified criteria within system schema registry.";
            profileArea.classList.add('d-none');
            return;
        }
        
        const data = await response.json();
        renderStudentDashboard(data);
    } catch (err) {
        feedback.innerText = "Critical operational pipeline network drop.";
    }
}

function renderStudentDashboard(data) {
    document.getElementById('studentProfileArea').classList.remove('d-none');
    
    // Binding Base Metrics Profile Fields
    document.getElementById('lblStudentName').innerText = data.student.name;
    document.getElementById('lblRegNo').innerText = data.student.reg_no;
    document.getElementById('lblBranch').innerText = data.student.branch;
    document.getElementById('lblSemester').innerText = data.student.semester;

    // Build Out Academic Marks Table Component Records Data Lines Elements
    const marksBody = document.getElementById('tblMarksBody');
    marksBody.innerHTML = "";
    if(data.marks.length === 0) {
        marksBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No published examination ledgers found.</td></tr>`;
    } else {
        data.marks.forEach(item => {
            marksBody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${item.subject}</td>
                    <td>${item.internal_marks} / 40</td>
                    <td>${item.external_marks} / 60</td>
                    <td class="fw-bold text-primary">${item.total_marks} / 100</td>
                </tr>
            `;
        });
    }

    // Build Out Analytics Progression Bar Metric Framework Structures Components View
    const attnContainer = document.getElementById('attendanceBarsContainer');
    attnContainer.innerHTML = "";
    if(data.attendance.length === 0) {
        attnContainer.innerHTML = `<p class="text-muted small">No verified attendance checkpoints tracking log arrays registered.</p>`;
    } else {
        data.attendance.forEach(item => {
            const pct = parseFloat(item.attendance_percentage);
            const variant = pct < 75 ? 'bg-danger' : 'bg-success';
            attnContainer.innerHTML += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between text-muted small mb-1">
                        <span class="fw-medium">${item.subject}</span>
                        <span class="fw-bold">${pct}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar ${variant}" role="progressbar" style="width: ${pct}%" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            `;
        });
    }

    // Build Syllabus Progress Delivery Metrics Dynamic Grid View Output Panel
    const sylContainer = document.getElementById('syllabusGridContainer');
    sylContainer.innerHTML = "";
    data.syllabus.forEach(item => {
        const pct = parseFloat(item.completed_percentage || 0);
        sylContainer.innerHTML += `
            <div class="col-md-4 mb-3">
                <div class="p-3 border rounded-3 bg-light">
                    <h6 class="fw-bold mb-1 text-truncate">${item.subject}</h6>
                    <p class="text-muted small mb-2">Faculty: ${item.teacher_name || 'Unassigned'}</p>
                    <div class="d-flex justify-content-between text-muted extra-small mb-1" style="font-size:0.8rem;">
                        <span>Units Completed: ${item.completed_units}/${item.total_units}</span>
                        <span class="fw-bold">${pct}%</span>
                    </div>
                    <div class="progress" style="height:6px;">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    });

    // Populate Student Target Profile Level Bulletins Broadcast Board
    fetchStudentNotices();
}

async function fetchStudentNotices() {
    try {
        const res = await fetch(`${API_BASE}/notices`);
        const notices = await res.json();
        const container = document.getElementById('studentNoticeContainer');
        container.innerHTML = "";
        if(notices.length === 0) {
            container.innerHTML = `<p class="text-muted p-2">No emergency bulletins active currently.</p>`;
        }
        notices.forEach(item => {
            container.innerHTML += `
                <div class="list-group-item py-3 px-0 border-bottom">
                    <div class="d-flex w-100 justify-content-between align-items-center">
                        <h6 class="fw-bold text-dark mb-1">${item.title}</h6>
                        <small class="text-muted">${new Date(item.date).toLocaleDateString()}</small>
                    </div>
                    <p class="text-muted small mb-0 mt-1">${item.description}</p>
                </div>
            `;
        });
    } catch(err){}
}

function generateReportCardPDF() {
    const element = document.getElementById('printableTranscriptArea');
    const options = {
        margin:       0.5,
        filename:     `Academic_Transcript_${document.getElementById('lblRegNo').innerText}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
}

// ==========================================
// TEACHER CONSOLE ROUTINES & ACTIONS
// ==========================================
function switchTab(target) {
    if(target === 'upload') {
        document.getElementById('uploadView').classList.remove('d-none');
        document.getElementById('noticesView').classList.add('d-none');
    } else {
        document.getElementById('uploadView').classList.add('d-none');
        document.getElementById('noticesView').classList.remove('d-none');
    }
}

// Form Interceptor Attachment Logic Setup
setupExcelFormInterceptor('formUploadMarks', '/upload-marks');
setupExcelFormInterceptor('formUploadAttendance', '/upload-attendance');
setupExcelFormInterceptor('formUploadSyllabus', '/upload-syllabus');

function setupExcelFormInterceptor(formId, targetUrl) {
    const el = document.getElementById(formId);
    if(!el) return;
    el.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(el);
        try {
            const res = await fetch(`${API_BASE}${targetUrl}`, { method: 'POST', body: formData });
            const data = await res.json();
            if(res.ok) { alert(data.message); el.reset(); } 
            else { alert(data.error || "File structural ingestion execution error."); }
        } catch(err) { alert("Network payload submission pipeline failure."); }
    });
}

const teacherNoticeForm = document.getElementById('formTeacherNotice');
if(teacherNoticeForm) {
    teacherNoticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('txtNoticeTitle').value;
        const description = document.getElementById('txtNoticeDesc').value;
        
        const res = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title, description })
        });
        if(res.ok) { alert("Class Notice Broadcasted Successfully!"); teacherNoticeForm.reset(); }
    });
}

// ==========================================
// HOD CONTROLLER MANAGEMENT SUITE
// ==========================================
let syllabusChartInstance = null;
function switchHodTab(target) {
    const views = ['hodAnalyticsView', 'hodTeachersView', 'hodNoticesView'];
    views.forEach(v => document.getElementById(v).classList.add('d-none'));
    
    if(target === 'analytics') {
        document.getElementById('hodAnalyticsView').classList.remove('d-none');
        initHodAnalytics();
    } else if(target === 'teachers') {
        document.getElementById('hodTeachersView').classList.remove('d-none');
        loadHodTeachersRegistry();
    } else {
        document.getElementById('hodNoticesView').classList.remove('d-none');
    }
}

async function initHodAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-analytics`);
        const data = await res.json();
        
        document.getElementById('metricTotalStudents').innerText = data.totalStudents;
        document.getElementById('metricTotalTeachers').innerText = data.totalTeachers;
        document.getElementById('metricAvgAttendance').innerText = `${data.avgAttendance}%`;

        // Render Analytics Visuals via ChartJs Data Layers Hook Insertion Points
        const ctx = document.getElementById('chartSyllabusProgress').getContext('2d');
        if(syllabusChartInstance) syllabusChartInstance.destroy();

        const subjects = data.syllabusMetrics.map(d => d.subject);
        const completionRates = data.syllabusMetrics.map(d => d.completed_percentage);

        syllabusChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Syllabus Delivery Completion (%)',
                    data: completionRates,
                    backgroundColor: 'rgba(37, 99, 235, 0.75)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { min: 0, max: 100 } }
            }
        });
    } catch(err){}
}

async function loadHodTeachersRegistry() {
    try {
        const res = await fetch(`${API_BASE}/teachers`);
        const data = await res.json();
        const body = document.getElementById('tblHodTeachersBody');
        body.innerHTML = "";
        data.forEach(t => {
            body.innerHTML += `
                <tr>
                    <td>${t.id}</td>
                    <td class="fw-semibold">${t.teacher_name}</td>
                    <td><span class="badge bg-secondary p-2">${t.subject}</span></td>
                    <td><button class="btn btn-sm btn-danger" onclick="deleteTeacherRecord(${t.id})">Remove Asset</button></td>
                </tr>
            `;
        });
    } catch(err){}
}

async function deleteTeacherRecord(id) {
    if(!confirm("Are you sure you want to delete this faculty member?")) return;
    const res = await fetch(`${API_BASE}/teachers/${id}`, { method: 'DELETE' });
    if(res.ok) { loadHodTeachersRegistry(); }
}

const hodFormTeacher = document.getElementById('formAddTeacher');
if(hodFormTeacher) {
    hodFormTeacher.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newTeacherName').value.trim();
        const subject = document.getElementById('newTeacherSubject').value.trim();
        
        const res = await fetch(`${API_BASE}/teachers`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ teacher_name: name, subject })
        });
        if(res.ok) { hodFormTeacher.reset(); loadHodTeachersRegistry(); } 
        else { alert("Failed to add teacher resource. Subject conflicts may exist."); }
    });
}

const hodNoticeForm = document.getElementById('formHodNotice');
if(hodNoticeForm) {
    hodNoticeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('txtHodNoticeTitle').value;
        const description = document.getElementById('txtHodNoticeDesc').value;
        
        const res = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title, description })
        });
        if(res.ok) { alert("Administrative Directive Dispatched!"); hodNoticeForm.reset(); }
    });
}

// Bootstrapping Dashboard Analytics If Current Context Window Node is HOD Dashboard Framework
if(document.getElementById('hodAnalyticsView')) { initHodAnalytics(); }