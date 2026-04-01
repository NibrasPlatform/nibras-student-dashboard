window.NibrasReact.run(() => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => { 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const achievementsData = {
        stats: [
            { icon: "fa-solid fa-trophy", color: "#d97706", val: "3", label: "Achievements" }, // Gold
            { icon: "fa-solid fa-star", color: "#eab308", val: "300", label: "Total Points" }, // Yellow
            { icon: "fa-solid fa-chart-line", color: "#dc2626", val: "1250", label: "Reputation" }, // Red
            { icon: "fa-solid fa-bullseye", color: "#dc2626", val: "38%", label: "Completion" } // Red
        ],
        recent: [
            { 
                id: 1, title: "First Steps", desc: "Complete your first assignment", 
                status: "complete", points: 50, icon: "fa-regular fa-circle-check", iconColor: "green"
            },
            { 
                id: 2, title: "Problem Solver", desc: "Solve 10 coding problems", 
                status: "current", points: 100, progress: 70, icon: "fa-solid fa-bullseye", iconColor: "blue"
            },
            { 
                id: 3, title: "Team Player", desc: "Help 5 classmates with their questions", 
                status: "current", points: 150, progress: 40, icon: "fa-solid fa-people-group", iconColor: "purple"
            }
        ],
        all: [
            { 
                title: "First Steps", desc: "Complete your first assignment", 
                status: "complete", points: 50, icon: "fa-regular fa-circle-check"
            },
            { 
                title: "Problem Solver", desc: "Solve 10 coding problems", 
                status: "current", points: 100, progress: 70, icon: "fa-solid fa-bullseye"
            },
            { 
                title: "Team Player", desc: "Help 5 classmates with their questions", 
                status: "current", points: 150, progress: 40, icon: "fa-solid fa-people-group"
            },
            { 
                title: "Speed Demon", desc: "Complete 10 problems in 30 minutes", 
                status: "locked", points: 70, icon: "fa-solid fa-bolt"
            },
            { 
                title: "Knowledge Seeker", desc: "Complete 5 courses with 80%+ grade", 
                status: "locked", points: 200, icon: "fa-solid fa-graduation-cap"
            },
            { 
                title: "Mentor", desc: "Provide 50 helpful answers in Community", 
                status: "locked", points: 120, icon: "fa-solid fa-brain"
            },
            { 
                title: "Consistency King", desc: "Maintain a 30-day learning streak", 
                status: "locked", points: 90, icon: "fa-solid fa-chart-line"
            }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    achievementsData.stats.forEach(stat => {
        statsContainer.innerHTML += `
            <div class="a-stat-card">
                <div class="a-stat-icon" style="color: ${stat.color}"><i class="${stat.icon}"></i></div>
                <div class="a-stat-val">${stat.val}</div>
                <div class="a-stat-label">${stat.label}</div>
            </div>
        `;
    });

    // Recent List
    const recentContainer = document.getElementById('recent-container');
    recentContainer.innerHTML = '';
    achievementsData.recent.forEach(item => {
        renderAchievementCard(item, recentContainer);
    });

    // All Grid
    const allContainer = document.getElementById('all-container');
    allContainer.innerHTML = '';
    achievementsData.all.forEach(item => {
        renderAchievementCard(item, allContainer);
    });

    function renderAchievementCard(item, container) {
        let statusHtml = '';
        let iconColor = 'var(--text-primary)';
        
        if (item.status === 'complete') {
            statusHtml = `<span class="ach-status status-complete">complete</span>`;
            iconColor = 'var(--green)';
        } else if (item.status === 'current') {
            statusHtml = `<span class="ach-status" style="color:var(--text-primary)">current</span>`;
            iconColor = 'var(--accent-blue)';
            if(item.iconColor === 'purple') iconColor = '#9333ea';
        } else {
            statusHtml = `<span class="ach-status status-locked">locked</span>`;
            iconColor = 'var(--text-primary)'; // Locked icon color
        }

        let progressHtml = '';
        if (item.progress !== undefined) {
            progressHtml = `
                <div class="ach-progress-wrap">
                    <span style="font-size:0.75rem; color:var(--text-secondary)">Progress: ${item.progress}%</span>
                    <div class="ach-p-track"><div class="ach-p-fill" style="width: ${item.progress}%"></div></div>
                </div>
            `;
        }

        const html = `
            <div class="achieve-card">
                <div class="ach-icon-box">
                    <i class="${item.icon}" style="color: ${iconColor};"></i>
                </div>
                <div class="ach-content">
                    <div class="ach-title">${item.title}</div>
                    <div class="ach-desc">${item.desc}</div>
                    <div class="ach-meta">
                        ${statusHtml}
                        <span>Points: ${item.points}</span>
                        ${progressHtml}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    }

    // --- 4. THEME TOGGLE & LOGO SWAP ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });

    // --- 5. TAB LOGIC ---
    const segTabs = document.querySelectorAll('.seg-btn');
    segTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            segTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});
