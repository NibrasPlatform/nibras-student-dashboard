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
    const analyticsData = {
        stats: [
            { label: "Active Students", value: "2,847", change: "+12.5% from last month", isPos: true, icon: "fa-regular fa-user" },
            { label: "Course Completion", value: "78.3%", change: "+3.2% from last month", isPos: true, icon: "fa-solid fa-book-open" },
            { label: "Contest Participation", value: "1,234", change: "+8.7% from last month", isPos: true, icon: "fa-solid fa-trophy" },
            { label: "Avg. Study Time", value: "4.2h", change: "-0.3h from last month", isPos: false, icon: "fa-regular fa-clock" }
        ],
        performance: [
            { label: "A (90-100%)", count: 456, pct: 25, color: "var(--grade-a)" }, // Bar width visual approximation
            { label: "B (80-89%)", count: 892, pct: 50, color: "var(--grade-b)" },
            { label: "C (70-79%)", count: 1023, pct: 65, color: "var(--grade-c)" },
            { label: "D (60-69%)", count: 334, pct: 20, color: "var(--grade-d)" },
            { label: "F (0-59%)", count: 142, pct: 10, color: "var(--grade-f)" }
        ],
        atRisk: [
            { name: "Alex Johnson", course: "Data Structures", time: "5 days ago", risk: "High Risk", color: "bg-high" },
            { name: "Sarah Chen", course: "Algorithms", time: "3 days ago", risk: "Medium Risk", color: "bg-med" },
            { name: "Mike Wilson", course: "Web Development", time: "1 week ago", risk: "High Risk", color: "bg-high" },
            { name: "Emma Davis", course: "Machine Learning", time: "2 days ago", risk: "Medium Risk", color: "bg-med" }
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

    // Performance Distribution
    const perfContainer = document.getElementById('performance-container');
    perfContainer.innerHTML = '';
    analyticsData.performance.forEach(p => {
        perfContainer.innerHTML += `
            <div class="perf-item">
                <div class="perf-head">
                    <span>${p.label}</span>
                    <span class="perf-count">${p.count} students</span>
                </div>
                <div class="perf-track">
                    <div class="perf-fill" style="width:${p.pct}%; background-color:${p.color}"></div>
                </div>
            </div>
        `;
    });

    // At-Risk Students
    const riskContainer = document.getElementById('risk-container');
    riskContainer.innerHTML = '';
    analyticsData.atRisk.forEach(r => {
        riskContainer.innerHTML += `
            <div class="risk-card-item">
                <div class="risk-info">
                    <h4>${r.name}</h4>
                    <span class="risk-sub">${r.course}</span>
                    <span class="risk-time">${r.time}</span>
                </div>
                <span class="risk-badge ${r.color}">${r.risk}</span>
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

    // --- 5. TABS LOGIC ---
    const anaTabs = document.querySelectorAll('.ana-tab');
    anaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            anaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});
