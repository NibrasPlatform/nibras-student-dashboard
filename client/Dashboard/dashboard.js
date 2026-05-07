console.log('[DASHBOARD.JS] Script started (direct execution)');

// --- 2. BACKEND DATA ---
const savedGPA = localStorage.getItem('calculatedGPA');
let selectedCourseId = localStorage.getItem('selectedCourseId') || '';
let dashboardData = {};

// Helper to resolve tracking service base URL
function getTrackingBaseUrl() {
    const shared = window.NibrasShared || {};
    return (
        (typeof shared.resolveServiceUrl === 'function' ? shared.resolveServiceUrl('tracking') : null) ||
        window.NibrasApi?.resolveServiceUrl?.('tracking') ||
        window.NibrasApiConfig?.getServiceUrl?.('tracking') ||
        window.NIBRAS_TRACKING_API_URL ||
        window.NIBRAS_API_URL ||
        (/^https?:/i.test(window.location?.origin || '') ? window.location.origin.replace(/\/+$/, '') : '')
    );
}

// Helper to create a requestJson function for tracking service
function createTrackingRequestJson() {
    const shared = window.NibrasShared || {};
    return shared.apiFetch
        ? shared.apiFetch.bind(shared)
        : async (path, options = {}) => {
            const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
            const token = shared?.auth?.getToken?.() ||
              window.NibrasApi?.getToken?.() ||
              null;
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            const baseUrl = getTrackingBaseUrl();
            const response = await fetch(`${baseUrl}${path}`, {
                method: options.method || 'GET',
                headers,
                body: options.body,
            });
            const payload = await response.json();
            if (!response.ok) {
                const error = new Error(payload?.message || `Request failed (${response.status})`);
                error.status = response.status;
                error.payload = payload;
                throw error;
            }
            return payload;
        };
}

// Resolve user name: try API first, fall back to cached user, then hardcoded default
async function resolveUserName() {
    // Check cached/nibras user first
    try {
        const cachedUser = JSON.parse(localStorage.getItem('nibras_user') || localStorage.getItem('user') || 'null');
        if (cachedUser && cachedUser.login) {
            return cachedUser.login; // New API uses 'login' (GitHub username)
        }
    } catch (_) {}

    // Try fetching from new tracking session service
    try {
        const requestJson = createTrackingRequestJson();
        const sessionData = await requestJson('/v1/web/session', { method: 'GET' });
        if (sessionData && sessionData.login) {
            localStorage.setItem('nibras_user', JSON.stringify(sessionData));
            return sessionData.login;
        }
    } catch (err) {
        console.warn('[DASHBOARD.JS] Could not fetch tracking session:', err.message);
    }

    return 'Student';
}

// Load courses for switcher and fetch dashboard data
async function loadCourseSwitcher() {
    try {
        const requestJson = createTrackingRequestJson();
        const courses = await requestJson('/v1/tracking/courses', { method: 'GET' });
        const courseList = Array.isArray(courses) ? courses : [];
        const selector = document.getElementById('course-switcher');
        if (!selector) return;
        // Clear existing options except the first "All Courses"
        selector.innerHTML = '<option value="">All Courses</option>';
        courseList.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id || course._id || '';
            option.textContent = course.title || course.name || 'Untitled Course';
            selector.appendChild(option);
        });
        // Set selected course if matches localStorage
        if (selectedCourseId) {
            selector.value = selectedCourseId;
        }
    } catch (error) {
        console.warn('[DASHBOARD.JS] Failed to load courses for switcher:', error);
    }
}

async function fetchDashboardData(courseId) {
    const requestJson = createTrackingRequestJson();
    let path = '/v1/tracking/dashboard/student';
    if (courseId) {
        path += `?courseId=${encodeURIComponent(courseId)}`;
    }
    return await requestJson(path, { method: 'GET' });
}


// Initialize user session display on page load
function initUserSession() {
    const session = window.NibrasShared?.session;
    if (session && typeof session.updateUserInfoDisplay === 'function') {
        session.updateUserInfoDisplay();
    }
}

(async () => {
    try {
        const userName = await resolveUserName();
        const shared = window.NibrasShared || {};
        const trackingApiBase =
            (typeof shared.resolveServiceUrl === 'function' ? shared.resolveServiceUrl('tracking') : null) ||
            window.NibrasApi?.resolveServiceUrl?.('tracking') ||
            window.NibrasApiConfig?.getServiceUrl?.('tracking') ||
            window.NIBRAS_TRACKING_API_URL ||
            window.NIBRAS_API_URL ||
            (/^https?:/i.test(window.location?.origin || '') ? window.location.origin.replace(/\/+$/, '') : '');

        const requestJson = shared.apiFetch
            ? shared.apiFetch.bind(shared)
            : async (path, options = {}) => {
                const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
                const token = shared?.auth?.getToken?.() ||
                  window.NibrasApi?.getToken?.() ||
                  null;
                if (token) {
                  headers.Authorization = `Bearer ${token}`;
                }
                const response = await fetch(`${trackingApiBase}${path}`, {
                  method: options.method || 'GET',
                  headers,
                  body: options.body,
                });
                const payload = await response.json();
                if (!response.ok) {
                  const error = new Error(payload?.message || `Request failed (${response.status})`);
                  error.status = response.status;
                  error.payload = payload;
                  throw error;
                }
                return payload;
            };
        // Load courses for switcher
        await loadCourseSwitcher();
        // Determine courseId
        const courseId = selectedCourseId;
        let path = '/v1/tracking/dashboard/student';
        if (courseId) {
            path += `?courseId=${encodeURIComponent(courseId)}`;
        }
        const dashboardPayload = await requestJson(path, { method: 'GET' });

        // Process the dashboardPayload to build dashboardData
        let courseCount = 0;
        let totalMilestones = 0;
        let approvedMilestones = 0;

        const projects = dashboardPayload.projects || [];

        courseCount = projects.length;

        projects.forEach(project => {
            const stats = project.stats || {};
            totalMilestones += stats.total || 0;
            approvedMilestones += stats.approved || 0;
        });

        const statsArray = [
            { label: "Courses Enrolled", value: courseCount, icon: "fa-solid fa-book-bookmark", color: "pink" },
            { label: "Milestones Completed", value: approvedMilestones, icon: "fa-solid fa-bullseye", color: "orange" },
            { label: "Total Milestones", value: totalMilestones, icon: "fa-solid fa-heart", color: "green" },
            { label: "Study Streak", value: "12 days", icon: "fa-regular fa-clock", color: "blue" },
            {
                label: "Total GPA",
                value: savedGPA ? `${savedGPA}/4.0` : "Calculate",
                icon: "fa-solid fa-graduation-cap",
                color: "purple",
                id: "gpa-box",
                isClickable: true
            }
        ];

        // Flatten milestones from all projects and take first 3
        const allMilestones = [];
        projects.forEach(project => {
            (project.milestones || []).forEach(milestone => {
                allMilestones.push(milestone);
            });
        });

        const dashboardMilestones = allMilestones.slice(0, 3).map(milestone => {
            let statusLabel = milestone.status || 'pending';
            let statusColor = '#6b7280'; // default gray
            let completedPercent = 0;

            switch (statusLabel) {
                case 'approved':
                case 'complete':
                    statusLabel = 'Complete';
                    statusColor = '#10b981'; // green
                    completedPercent = 100;
                    break;
                case 'in_review':
                    statusLabel = 'In Review';
                    statusColor = '#10b981'; // green
                    completedPercent = 0;
                    break;
                case 'needs_changes':
                    statusLabel = 'Needs Changes';
                    statusColor = '#f97316'; // orange-red
                    completedPercent = 0;
                    break;
                case 'pending':
                default:
                    statusLabel = 'Pending';
                    statusColor = '#6b7280'; // gray
                    completedPercent = 0;
                    break;
            }

            return {
                title: milestone.title || 'Milestone',
                completed: completedPercent,
                status: statusLabel,
                color: statusColor,
                due: milestone.dueLabel || 'TBD'
            };
        });

        const dashboardData = {
            user: userName,
            stats: statsArray,
            milestones: dashboardMilestones,
            activities: [],
            progress: [],
            deadlines: [],
            achievements: []
        };

        renderDashboard(dashboardData);
    } catch (error) {
        console.warn('[DASHBOARD.JS] Failed to fetch dashboard data, using hardcoded data:', error);
        // Fallback to hardcoded dashboardData
        const userName = await resolveUserName();
        dashboardData.user = userName;
        renderDashboard(dashboardData);
    }
})();

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