document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. THEME TOGGLE ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const themeText = themeBtn.querySelector('span');

    updateThemeBtn(document.documentElement.getAttribute('data-theme'));

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeBtn(newTheme);
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

    // --- 3. BACKEND DATA OBJECT ---
    const projectsData = {
        tabs: [
            { id: 1, title: "E-Commerce Platform Development", type: "Team", weight: "30% of final grade", active: true },
            { id: 2, title: "Advanced Portfolio Website", type: "Individual", weight: "20% of final grade", active: false }
        ],
        details: {
            title: "E-Commerce Platform Development",
            description: "Build a full-stack e-commerce web application with user authentication, product catalog, shopping cart, and payment integration.",
            gradeWeight: "30% of final grade",
            duration: "Nov 1, 2024 → Jan 15, 2025",
            supervisor: "Prof. Jane Smith",
            team: [
                { name: "Sarah Johnson", initials: "SJ", color: "#2563eb" },
                { name: "Michael Chen", initials: "MC", color: "#2563eb" },
                { name: "Emma Davis", initials: "ED", color: "#2563eb" }
            ]
        },
        timeline: [
            { title: "Project Proposal", desc: "Submit detailed project proposal with wireframes and tech stack", date: "Nov 8, 2024", status: "approved", badge: "Approved" },
            { title: "Database Design & API", desc: "Complete database schema and REST API implementation", date: "Nov 22, 2024", status: "approved", badge: "Approved" },
            { title: "Frontend Development", desc: "Implement UI components and integrate with backend", date: "Dec 15, 2024", status: "submitted", badge: "Submitted" },
            { title: "Testing & Deployment", desc: "Complete testing, bug fixes, and deploy to production", date: "Jan 8, 2025", status: "pending", badge: "Pending", hasAction: true },
            { title: "Final Presentation", desc: "Present the completed project with demo and documentation", date: "Jan 15, 2025", status: "pending", badge: "Pending" }
        ],
        stats: {
            completion: 60,
            approved: "2/5",
            daysRemaining: 28
        },
        grading: [
            { item: "Technical Implementation", pct: "40%" },
            { item: "Design & UX", pct: "25%" },
            { item: "Documentation", pct: "20%" },
            { item: "Presentation", pct: "15%" }
        ],
        resources: [
            { name: "Project Guidelines", type: "doc" },
            { name: "Submission Template", type: "doc" },
            { name: "Example Projects", type: "doc" }
        ]
    };

    // --- 4. RENDER UI ---
    renderUI(projectsData);

    function renderUI(data) {
        // A. Tabs
        const tabContainer = document.getElementById('project-tabs-container');
        tabContainer.innerHTML = '';
        data.tabs.forEach(tab => {
            const activeClass = tab.active ? 'active' : '';
            const iconClass = tab.type === 'Team' ? 'fa-solid fa-user-group' : 'fa-solid fa-user';
            
            tabContainer.innerHTML += `
                <div class="proj-tab ${activeClass}">
                    <h4>${tab.title}</h4>
                    <p><i class="${iconClass}"></i> ${tab.type} • ${tab.weight}</p>
                </div>
            `;
        });

        // B. Project Details
        document.getElementById('proj-title').textContent = data.details.title;
        document.getElementById('proj-desc').textContent = data.details.description;
        document.getElementById('proj-weight').textContent = data.details.gradeWeight;
        document.getElementById('proj-duration').textContent = data.details.duration;
        document.getElementById('proj-supervisor').textContent = data.details.supervisor;

        // C. Team
        const teamContainer = document.getElementById('team-container');
        teamContainer.innerHTML = '';
        data.details.team.forEach(member => {
            teamContainer.innerHTML += `
                <div class="team-pill">
                    <div class="team-avatar" style="background-color: ${member.color}">${member.initials}</div>
                    ${member.name}
                </div>
            `;
        });

        // D. Timeline
        const timelineContainer = document.getElementById('timeline-container');
        const completedCount = data.timeline.filter(t => t.status !== 'pending').length;
        document.getElementById('milestones-count').textContent = `${completedCount} of ${data.timeline.length} completed`;
        
        timelineContainer.innerHTML = '';
        data.timeline.forEach(item => {
            let iconHtml, badgeClass;
            
            if(item.status === 'approved') {
                iconHtml = `<div class="timeline-icon icon-approved"><i class="fa-solid fa-check"></i></div>`;
                badgeClass = 'badge-approved';
            } else if(item.status === 'submitted') {
                iconHtml = `<div class="timeline-icon icon-submitted"><i class="fa-solid fa-check"></i></div>`;
                badgeClass = 'badge-submitted';
            } else {
                iconHtml = `<div class="timeline-icon icon-pending"><i class="fa-regular fa-clock"></i></div>`;
                badgeClass = 'badge-pending';
            }

            const actionBtn = item.hasAction ? `<div class="tm-action"><button class="btn-submit">Submit</button></div>` : '';

            timelineContainer.innerHTML += `
                <div class="timeline-item">
                    ${iconHtml}
                    <div class="timeline-content">
                        <div class="tm-header">
                            <span class="tm-title">${item.title}</span>
                            <span class="tm-badge ${badgeClass}">${item.badge}</span>
                        </div>
                        <span class="tm-desc">${item.desc}</span>
                        <span class="tm-date"><i class="fa-regular fa-calendar"></i> ${item.date}</span>
                        ${actionBtn}
                    </div>
                </div>
            `;
        });

        // E. Stats
        document.getElementById('header-progress-txt').textContent = `${data.stats.completion}% Complete`;
        document.getElementById('right-progress-txt').textContent = `${data.stats.completion}%`;
        document.getElementById('right-progress-fill').style.width = `${data.stats.completion}%`;
        document.getElementById('stat-approved').textContent = data.stats.approved;
        document.getElementById('stat-days').textContent = data.stats.daysRemaining;

        // F. Grading
        const gradeContainer = document.getElementById('grading-container');
        gradeContainer.innerHTML = '';
        data.grading.forEach(g => {
            gradeContainer.innerHTML += `
                <div class="grade-row">
                    <span>${g.item}</span>
                    <span style="font-weight:600">${g.pct}</span>
                </div>
            `;
        });

        // G. Resources
        const resContainer = document.getElementById('resources-container');
        resContainer.innerHTML = '';
        data.resources.forEach(r => {
            resContainer.innerHTML += `
                <a href="#" class="resource-link">
                    <i class="fa-regular fa-file-lines"></i> ${r.name}
                </a>
            `;
        });
    }
});