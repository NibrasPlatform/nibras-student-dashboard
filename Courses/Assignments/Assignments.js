document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. SIDEBAR NAVIGATION LOGIC (New Addition) ---
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default jump for this demo (remove this line if integrating real routing)
            e.preventDefault();
            
            // Remove 'active' class from all links
            navLinks.forEach(nav => nav.classList.remove('active'));
            
            // Add 'active' class to the clicked link
            link.classList.add('active');
            
            console.log(`Switched tab to: ${link.textContent.trim()}`);
        });
    });

    // --- 2. TOGGLE THEME LOGIC ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');
    
    // Check initial theme logic
    updateThemeBtn(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            updateThemeBtn('dark');
        } else {
            html.setAttribute('data-theme', 'light');
            updateThemeBtn('light');
        }
    });

    function updateThemeBtn(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeText.textContent = 'Dark Mode';
        }
    }

    // --- 3. BACKEND DATA (Backend Developer: Replace this object) ---
    const assignmentData = {
        stats: {
            completed: 1,
            total: 5,
            pointsEarned: 18,
            pointsTotal: 115,
            progressPercent: 20 // 1/5
        },
        items: [
            {
                id: 1,
                title: "Assignment 1: Fundamentals of HTML & CSS",
                status: "graded",
                statusLabel: "Graded",
                description: "Create a responsive landing page using HTML5 and CSS3",
                points: 20,
                score: 18,
                dueDate: "Dec 20, 2024",
                dueTime: "11:59 PM",
                type: "File Upload",
                action: "View Details"
            },
            {
                id: 2,
                title: "Assignment 2: Coding Challenge - JavaScript Basics",
                status: "submitted",
                statusLabel: "Submitted",
                description: "Solve algorithmic problems using JavaScript",
                points: 25,
                score: null,
                dueDate: "Dec 22, 2024",
                dueTime: "11:59 PM",
                type: "Quiz",
                action: "View Submission"
            },
            {
                id: 3,
                title: "Assignment 3: Quiz - HTML5 & CSS3",
                status: "not_started",
                statusLabel: "Not Started",
                description: "Multiple choice and short answer questions",
                points: 15,
                score: null,
                dueDate: "Dec 25, 2024",
                dueTime: "11:59 PM",
                type: "Quiz",
                action: "Submit"
            },
            {
                id: 4,
                title: "Assignment 4: React Component Development",
                status: "late",
                statusLabel: "Late",
                description: "Build reusable React components",
                points: 30,
                score: null,
                dueDate: "Dec 18, 2024",
                dueTime: "11:59 PM",
                type: "File Upload",
                action: "Submit"
            },
            {
                id: 5,
                title: "Assignment 5: API Integration",
                status: "not_started",
                statusLabel: "Not Started",
                description: "Fetch and display data from a REST API",
                points: 25,
                score: null,
                dueDate: "Dec 28, 2024",
                dueTime: "11:59 PM",
                type: "File Upload",
                action: "Submit"
            }
        ]
    };

    // --- 4. RENDER UI ---
    
    // Render Stats
    const completedCountEl = document.getElementById('completed-count');
    const pointsCountEl = document.getElementById('points-count');
    const progressEl = document.getElementById('overall-progress');

    if (completedCountEl) completedCountEl.textContent = `${assignmentData.stats.completed} of ${assignmentData.stats.total} completed`;
    if (pointsCountEl) pointsCountEl.textContent = `${assignmentData.stats.pointsEarned} / ${assignmentData.stats.pointsTotal} points earned`;
    if (progressEl) progressEl.style.width = `${assignmentData.stats.progressPercent}%`;

    // Render List
    const container = document.getElementById('assignments-container');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Initial Render (All)
    renderAssignments('all');

    // Filter Click Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Render
            renderAssignments(btn.getAttribute('data-filter'));
        });
    });

    function renderAssignments(filter) {
        if (!container) return;
        container.innerHTML = '';
        
        assignmentData.items.forEach(item => {
            // Filter Logic
            if (filter !== 'all') {
                if (filter === 'pending' && (item.status === 'graded' || item.status === 'submitted')) return;
                if (filter === 'submitted' && item.status !== 'submitted') return;
                if (filter === 'graded' && item.status !== 'graded') return;
            }

            // Determine Badge Class & Icon
            let badgeClass = 'badge-default';
            let badgeIcon = 'fa-regular fa-clock'; // default icon
            
            if (item.status === 'graded') {
                badgeClass = 'badge-graded';
                badgeIcon = 'fa-solid fa-check';
            } else if (item.status === 'submitted') {
                badgeClass = 'badge-submitted';
                badgeIcon = 'fa-solid fa-check-double';
            } else if (item.status === 'late') {
                badgeClass = 'badge-late';
                badgeIcon = 'fa-regular fa-clock';
            }

            // Points Display Logic
            let pointsHtml = `<span class="points-label">${item.points} pts</span>`;
            if (item.score !== null) {
                pointsHtml = `
                    <span class="points-label">${item.points} pts</span>
                    <span class="score-earned">${item.score}/${item.points}</span>
                `;
            }

            // Type Icon Logic
            const typeIcon = item.type === 'File Upload' ? 'fa-solid fa-upload' : 'fa-regular fa-file-lines';

            const html = `
                <div class="assignment-card">
                    <div class="card-header">
                        <div class="card-title-group">
                            <h3>${item.title}</h3>
                            <span class="status-badge ${badgeClass}">
                                <i class="${badgeIcon}"></i> ${item.statusLabel}
                            </span>
                        </div>
                        <div class="card-points">
                            ${pointsHtml}
                        </div>
                    </div>
                    
                    <p class="card-desc">${item.description}</p>
                    
                    <div class="card-footer">
                        <div class="meta-info">
                            <div class="meta-item">
                                <i class="fa-regular fa-calendar"></i> Due: ${item.dueDate}
                            </div>
                            <div class="meta-item">
                                <i class="fa-regular fa-clock"></i> ${item.dueTime}
                            </div>
                            <div class="meta-item">
                                <i class="${typeIcon}"></i> ${item.type}
                            </div>
                        </div>
                        <button class="action-btn" onclick="console.log('Action: ${item.action} for ID ${item.id}')">
                            ${item.action}
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
        
        // Empty State
        if (container.innerHTML === '') {
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-secondary);">No assignments found for this filter.</div>`;
        }
    }

});