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
        enrollment: [
            { name: "Data Structures & Algorithms", count: 892, pct: 95, color: "var(--bar-orange)" },
            { name: "Web Development", count: 743, pct: 80, color: "var(--bar-orange)" },
            { name: "Machine Learning", count: 567, pct: 60, color: "var(--bar-orange)" },
            { name: "Database Systems", count: 445, pct: 45, color: "var(--bar-orange)" },
            { name: "Computer Networks", count: 200, pct: 20, color: "var(--bar-orange)" } // Image uses same orange/red theme
        ],
        summary: [
            { 
                text: "50 students earned \"Algorithm Master\" badge", 
                time: "2 hours ago", 
                dotColor: "#facc15", 
                badgeText: "High engagement", 
                badgeColor: "#991b1b" 
            },
            { 
                text: "Weekly Programming Contest completed", 
                time: "1 day ago", 
                dotColor: "#3b82f6", 
                badgeText: "234 participants", 
                badgeColor: "#991b1b" 
            },
            { 
                text: "New Machine Learning module released", 
                time: "3 days ago", 
                dotColor: "#10b981", 
                badgeText: "89% completion rate", 
                badgeColor: "#991b1b" 
            },
            { 
                text: "Platform reached 3000 active users", 
                time: "1 week ago", 
                dotColor: "#a855f7", 
                badgeText: "15% growth", 
                badgeColor: "#991b1b" 
            }
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

    // Enrollment
    const enContainer = document.getElementById('enrollment-container');
    enContainer.innerHTML = '';
    analyticsData.enrollment.forEach(en => {
        enContainer.innerHTML += `
            <div class="en-item">
                <div class="en-head">
                    <span>${en.name}</span>
                    <span class="en-count">${en.count} students</span>
                </div>
                <div class="en-track">
                    <div class="en-fill" style="width:${en.pct}%; background-color:${en.color}"></div>
                </div>
            </div>
        `;
    });

    // Activity Summary
    const sumContainer = document.getElementById('summary-container');
    sumContainer.innerHTML = '';
    analyticsData.summary.forEach(sum => {
        sumContainer.innerHTML += `
            <div class="sum-item">
                <div class="sum-left">
                    <div class="sum-dot" style="background-color: ${sum.dotColor}"></div>
                    <div class="sum-info">
                        <h4>${sum.text}</h4>
                        <span class="sum-time">${sum.time}</span>
                    </div>
                </div>
                <span class="sum-badge" style="background-color: ${sum.badgeColor}">${sum.badgeText}</span>
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