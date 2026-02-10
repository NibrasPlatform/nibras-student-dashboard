document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const analyticsData = {
        stats: [
            { label: "Active Students", value: "2,847", change: "+12.5% from last month", isPos: true, icon: "fa-regular fa-user" },
            { label: "Course Completion", value: "78.3%", change: "+3.2% from last month", isPos: true, icon: "fa-solid fa-book-open" },
            { label: "Contest Participation", value: "1,234", change: "+8.7% from last month", isPos: true, icon: "fa-solid fa-trophy" },
            { label: "Avg. Study Time", value: "4.2h", change: "-0.3h from last month", isPos: false, icon: "fa-regular fa-clock" }
        ],
        community: [
            { label: "Questions Asked", val: "1,234 this week" },
            { label: "Answers Provided", val: "2,456 this week" },
            { label: "Average Response Time", val: "23 minutes" },
            { label: "Community Score", val: "4.7/5.0", isGreen: true }
        ],
        contest: [
            { label: "Active Contests", val: "12" },
            { label: "Total Participants", val: "1,847" },
            { label: "Problems Solved", val: "15,678" },
            { label: "Average Rating", val: "1,456" }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    analyticsData.stats.forEach(s => {
        const changeClass = s.isPos ? 'pos' : 'neg';
        statsContainer.innerHTML += `
            <div class="ana-stat-card">
                <div class="as-label"><i class="${s.icon}"></i> ${s.label}</div>
                <div class="as-val">${s.value}</div>
                <div class="as-change ${changeClass}">${s.change}</div>
            </div>
        `;
    });

    // Community Metrics
    const commContainer = document.getElementById('community-metrics-container');
    commContainer.innerHTML = '';
    analyticsData.community.forEach(m => {
        const valClass = m.isGreen ? 'metric-green' : '';
        commContainer.innerHTML += `
            <div class="metric-row">
                <span class="metric-label">${m.label}</span>
                <span class="metric-val ${valClass}">${m.val}</span>
            </div>
        `;
    });

    // Contest Metrics
    const contestContainer = document.getElementById('contest-metrics-container');
    contestContainer.innerHTML = '';
    analyticsData.contest.forEach(m => {
        contestContainer.innerHTML += `
            <div class="metric-row">
                <span class="metric-label">${m.label}</span>
                <span class="metric-val">${m.val}</span>
            </div>
        `;
    });

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
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });

    // --- 5. TABS LOGIC ---
    const anaTabs = document.querySelectorAll('.ana-tab');
    anaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            anaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});