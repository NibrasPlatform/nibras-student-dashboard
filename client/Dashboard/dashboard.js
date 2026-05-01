console.log('[DASHBOARD.JS] Script started (direct execution)');

// --- 2. BACKEND DATA ---
const savedGPA = localStorage.getItem('calculatedGPA');

// Resolve user name: try API first, fall back to cached user, then hardcoded default
async function resolveUserName() {
    // Check cached user first
    try {
        const cachedUser = JSON.parse(localStorage.getItem('user'));
        if (cachedUser && cachedUser.name) {
            return cachedUser.name.split(' ')[0]; // First name only for welcome message
        }
    } catch (_) {}

    // Try fetching from admin service
    try {
        const token = localStorage.getItem('token');
        if (!token) return 'Student';

        const apiFetch = window.NibrasShared?.apiFetch;
        if (!apiFetch) return 'Student';

        const data = await apiFetch('/auth/me', {
            service: 'admin',
            method: 'GET',
            auth: true,
        });
        const user = data?.user || data;
        if (user && user.name) {
            // Update cached user
            localStorage.setItem('user', JSON.stringify(user));
            return user.name.split(' ')[0];
        }
    } catch (err) {
        console.warn('[DASHBOARD.JS] Could not fetch user profile:', err.message);
    }

    return 'Student';
}

// Initialize user session display on page load
function initUserSession() {
    const session = window.NibrasShared?.session;
    if (session && typeof session.updateUserInfoDisplay === 'function') {
        session.updateUserInfoDisplay();
    }
}

const dashboardData = {
    user: "Student", // Will be updated by resolveUserName()
    stats: [
        { label: "Courses Enrolled", value: "6", icon: "fa-solid fa-book-bookmark", color: "pink" },
        { label: "Problems Solved", value: "142", icon: "fa-solid fa-bullseye", color: "orange" },
        { label: "Contest Rating", value: "1,847", icon: "fa-solid fa-heart", color: "green" },
        { label: "Study Streak", value: "12 days", icon: "fa-regular fa-clock", color: "blue" },
        { 
            label: "Total GPA", 
            value: savedGPA ? `${savedGPA}/4.0` : "Calculate", 
            icon: "fa-solid fa-graduation-cap", 
            color: "purple",
            id: "gpa-box",       
            isClickable: true    
        }
    ],
    // Milestones Data
    milestones: [
        { title: "E-Commerce Platform", completed: 60, status: "On Track", color: "#3b82f6", due: "Jan 15" },
        { title: "Portfolio Website", completed: 85, status: "Reviewing", color: "#10b981", due: "Dec 20" },
        { title: "AI Chatbot", completed: 30, status: "At Risk", color: "#f59e0b", due: "Dec 25" }
    ],
    activities: [
        { title: "Data Structures Assignment 3", sub: "CS 201", tag: "2 days", tagColor: "#2563eb", borderColor: "#f59e0b" },
        { title: "Weekly Programming Contest", sub: "Competitive Programming", tag: "5 hours", tagColor: "#dc2626", borderColor: "#2563eb" },
        { title: "Binary Tree Traversal Question", sub: "CS 201", tag: "answered", tagColor: "#2563eb", borderColor: "#10b981" },
        { title: "Web Development Project", sub: "CS 301", tag: "1 week", tagColor: "#2563eb", borderColor: "#ef4444" }
    ],
    progress: [
        { subject: "Data Structures & Algorithms", percent: 85 },
        { subject: "Database Systems", percent: 72 },
        { subject: "Web Development", percent: 91 },
        { subject: "Competitive Programming", percent: 68 }
    ],
    deadlines: [
        { title: "Algorithm Analysis Quiz", code: "CS 202", date: "Tomorrow, 2:00 PM" },
        { title: "Database Design Project", code: "CS 301", date: "Friday, 11:59 PM" },
        { title: "Monthly Contest", code: "Competitive Programming", date: "Saturday, 10:00 AM" }
    ],
    achievements: [
        { title: "First Steps", icon: "fa-solid fa-medal" },
        { title: "Team Player", icon: "fa-solid fa-medal" },
        { title: "Top Contributor", icon: "fa-solid fa-medal" },
        { title: "Problem Solver", icon: "fa-solid fa-medal" },
        { title: "7-Day Streak", icon: "fa-solid fa-medal" }
    ]
};

function initDashboard() {
    console.log('[DASHBOARD.JS] Initializing dashboard page');

    // Initialize user session display (avatar, name, role)
    initUserSession();

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. FETCH USER NAME FROM API ---
    resolveUserName().then((name) => {
        dashboardData.user = name;
        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) {
            welcomeMsg.textContent = `Welcome back, ${name}!`;
        }
    }).catch(() => {
        // Silent fail — default name already set
    });

    // --- 3. RENDER UI ---
    renderDashboard(dashboardData);

    function renderDashboard(data) {
        const welcomeMsg = document.getElementById('welcome-msg');
        if (!welcomeMsg) {
            console.error('[DASHBOARD.JS] ERROR: welcome-msg not found!');
            return;
        }
        
        welcomeMsg.textContent = `Welcome back, ${data.user}!`;

        // Render Stats
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = '';
        
        data.stats.forEach(stat => {
            let bgVar, textVar;
            if(stat.color === 'pink') { bgVar = 'var(--stat-icon-bg-pink)'; textVar = 'var(--stat-icon-text-pink)'; }
            if(stat.color === 'orange') { bgVar = 'var(--stat-icon-bg-orange)'; textVar = 'var(--stat-icon-text-orange)'; }
            if(stat.color === 'green') { bgVar = 'var(--stat-icon-bg-green)'; textVar = 'var(--stat-icon-text-green)'; }
            if(stat.color === 'blue') { bgVar = 'var(--stat-icon-bg-blue)'; textVar = 'var(--stat-icon-text-blue)'; }
            if(stat.color === 'purple') { bgVar = 'var(--stat-icon-bg-purple)'; textVar = 'var(--stat-icon-text-purple)'; }

            const pointerClass = stat.isClickable ? 'cursor-pointer' : '';
            const idAttr = stat.id ? `id="${stat.id}"` : '';
            const valueId = stat.id ? `id="${stat.id}-value"` : '';

            statsContainer.innerHTML += `
                <div class="stat-card ${pointerClass}" ${idAttr}>
                    <div class="stat-info">
                        <span>${stat.label}</span>
                        <h2 ${valueId}>${stat.value}</h2>
                    </div>
                    <div class="stat-icon" style="background-color: ${bgVar}; color: ${textVar}">
                        <i class="${stat.icon}"></i>
                    </div>
                </div>
            `;
        });

        console.log('[DASHBOARD.JS] Rendered stats and dashboard');
        initGPAModal();
        renderLists(data);
        renderMilestones(data.milestones);
    }

    function renderLists(data) {
        // Activities
        const actContainer = document.getElementById('activities-container');
        actContainer.innerHTML = '';
        data.activities.forEach(act => {
            actContainer.innerHTML += `<div class="activity-item" style="border-left-color: ${act.borderColor}"><div class="act-info"><h4>${act.title}</h4><span>${act.sub}</span></div><div class="act-badge" style="background-color: ${act.tagColor}">${act.tag}</div></div>`;
        });

        // Progress
        const progContainer = document.getElementById('progress-container');
        progContainer.innerHTML = '';
        data.progress.forEach(prog => {
            progContainer.innerHTML += `<div class="prog-item"><div class="prog-header"><span>${prog.subject}</span><span class="prog-percent">${prog.percent}%</span></div><div class="prog-track"><div class="prog-fill" style="width: ${prog.percent}%"></div></div></div>`;
        });

        // Deadlines
        const deadContainer = document.getElementById('deadlines-container');
        deadContainer.innerHTML = '';
        data.deadlines.forEach(item => {
            deadContainer.innerHTML += `<div class="deadline-item"><i class="fa-solid fa-circle bullet"></i><div class="deadline-details"><h4>${item.title}</h4><span class="course-code">${item.code}</span><span class="due-date">${item.date}</span></div></div>`;
        });

        // Achievements
        const achieveContainer = document.getElementById('achievements-container');
        achieveContainer.innerHTML = '';
        data.achievements.forEach(item => {
            achieveContainer.innerHTML += `<div class="achieve-item"><i class="${item.icon} achieve-icon"></i><span class="achieve-text">${item.title}</span></div>`;
        });
    }

    // Render Milestones
    function renderMilestones(milestones) {
        const container = document.getElementById('milestone-container');
        container.innerHTML = '';
        
        milestones.forEach(ms => {
            let statusClass = 'status-track';
            if(ms.status === 'Reviewing' || ms.completed > 90) statusClass = 'status-completed';
            if(ms.status === 'At Risk') statusClass = 'status-atrisk';

            container.innerHTML += `
                <div class="milestone-item">
                    <div class="ms-header">
                        <span class="ms-title">${ms.title}</span>
                        <span class="ms-percentage">${ms.completed}%</span>
                    </div>
                    <div class="ms-bar-track">
                        <div class="ms-bar-fill" style="width: ${ms.completed}%; background-color: ${ms.color}"></div>
                    </div>
                    <div class="ms-meta">
                        <span class="ms-status ${statusClass}">${ms.status}</span>
                        <span>Due: ${ms.due}</span>
                    </div>
                </div>
            `;
        });
    }

    // --- 4. GPA CALCULATOR LOGIC ---
    function initGPAModal() {
        const gpaBox = document.getElementById('gpa-box');
        const gpaModal = document.getElementById('gpaModal');
        const closeBtn = document.getElementById('closeGpaModal');
        const addCourseBtn = document.getElementById('addCourseBtn');
        const calculateBtn = document.getElementById('calculateGpaBtn');
        const courseInputs = document.getElementById('courseInputs');
        const gpaResult = document.getElementById('gpaResult');
        const gpaResultValue = document.getElementById('gpaResultValue');
        const gpaResultDetails = document.getElementById('gpaResultDetails');

        if (!gpaBox) return;

        gpaBox.addEventListener('click', () => { gpaModal.style.display = 'flex'; });
        closeBtn.addEventListener('click', () => { gpaModal.style.display = 'none'; });
        window.addEventListener('click', (e) => { if (e.target === gpaModal) gpaModal.style.display = 'none'; });

        addCourseBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'course-input-row';
            row.innerHTML = `
                <input type="text" placeholder="Course Name" class="course-name">
                <select class="course-grade">
                    <option value="" disabled selected>Grade</option>
                    <option value="4.0">A</option>
                    <option value="3.7">A-</option>
                    <option value="3.3">B+</option>
                    <option value="3.0">B</option>
                    <option value="2.7">B-</option>
                    <option value="2.3">C+</option>
                    <option value="2.0">C</option>
                    <option value="1.7">C-</option>
                    <option value="1.3">D+</option>
                    <option value="1.0">D</option>
                    <option value="0.0">F</option>
                </select>
                <input type="number" placeholder="Credits" class="course-credits" min="1" max="6">
            `;
            courseInputs.appendChild(row);
        });

        calculateBtn.addEventListener('click', () => {
            const rows = document.querySelectorAll('.course-input-row');
            let totalPoints = 0, totalCredits = 0, count = 0;

            rows.forEach(row => {
                const grade = parseFloat(row.querySelector('.course-grade').value);
                const credits = parseInt(row.querySelector('.course-credits').value);
                if (!isNaN(grade) && !isNaN(credits) && credits > 0) {
                    totalPoints += (grade * credits);
                    totalCredits += credits;
                    count++;
                }
            });

            if (count === 0 || totalCredits === 0) { alert("Please enter valid data."); return; }
            
            const finalGPA = (totalPoints / totalCredits).toFixed(2);
            gpaResultValue.textContent = finalGPA;
            gpaResultDetails.innerHTML = `<span>${count} Courses</span> <span>${totalCredits} Credits</span>`;
            gpaResult.style.display = 'block';
            document.getElementById('gpa-box-value').textContent = `${finalGPA}/4.0`;
            localStorage.setItem('calculatedGPA', finalGPA);
        });
    }

    // --- 5. THEME TOGGLE ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn?.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '../assets/images/logo-light.png';
    }

    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';

            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            if (newTheme === 'dark') {
                if(themeIcon) themeIcon.className = 'fa-regular fa-sun';
                if(appLogo) appLogo.src = '../assets/images/logo-dark.png';
            } else {
                if(themeIcon) themeIcon.className = 'fa-regular fa-moon';
                if(appLogo) appLogo.src = '../assets/images/logo-light.png';
            }
        });
    }

    console.log('[DASHBOARD.JS] Initialization complete');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}
