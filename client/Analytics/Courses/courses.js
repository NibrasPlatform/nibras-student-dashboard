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
        courses: [
            { title: "Data Structures & Algorithms", enrolled: 892, completion: "78%", grade: "82%", satisfaction: "4.6/5.0" },
            { title: "Web Development", enrolled: 743, completion: "85%", grade: "87%", satisfaction: "4.8/5.0" },
            { title: "Machine Learning", enrolled: 567, completion: "72%", grade: "79%", satisfaction: "4.4/5.0" },
            { title: "Database Systems", enrolled: 445, completion: "81%", grade: "84%", satisfaction: "4.5/5.0" }
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

    // Course List
    const courseContainer = document.getElementById('courses-container');
    courseContainer.innerHTML = '';
    analyticsData.courses.forEach(c => {
        courseContainer.innerHTML += `
            <div class="cm-item">
                <div class="cm-header">
                    <span class="cm-title">${c.title}</span>
                    <span class="cm-badge">${c.enrolled} enrolled</span>
                </div>
                <div class="cm-stats-row">
                    <div class="cm-stat">
                        <span class="cm-label">Completion Rate</span>
                        <span class="cm-val">${c.completion}</span>
                    </div>
                    <div class="cm-stat">
                        <span class="cm-label">Average Grade</span>
                        <span class="cm-val">${c.grade}</span>
                    </div>
                    <div class="cm-stat">
                        <span class="cm-label">Satisfaction</span>
                        <span class="cm-val">${c.satisfaction}</span>
                    </div>
                </div>
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
