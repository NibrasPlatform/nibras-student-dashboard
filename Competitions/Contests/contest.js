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

    // --- 2. THEME TOGGLE & LOGO SWAP ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    // Init Theme State
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

    // --- 3. TABS LOGIC (NEW ADDITION) ---
    const contentTabs = document.querySelectorAll('.tab-btn');
    
    contentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 1. Remove 'active' class from all tabs
            contentTabs.forEach(t => t.classList.remove('active'));
            
            // 2. Add 'active' class to the clicked tab (turns it blue via CSS)
            tab.classList.add('active');
            
            // Optional: You can add logic here to filter the content based on the tab text
            console.log(`Switched to: ${tab.textContent}`);
        });
    });

    // --- 4. BACKEND DATA ---
    const compData = {
        stats: [
            { label: "Current Rating", value: "1847", icon: "fa-solid fa-trophy", color: "yellow" },
            { label: "Problems Solved", value: "156", icon: "fa-solid fa-bullseye", color: "green" },
            { label: "Contests Joined", value: "24", icon: "fa-solid fa-users", color: "blue" },
            { label: "Division Rank", value: "#12", icon: "fa-solid fa-medal", color: "purple" }
        ],
        liveContests: [
            { 
                id: 1, 
                title: "Weekly Programming Contest #45", 
                desc: "Algorithmic problem solving with dynamic programming focus",
                participants: 234, 
                problems: 6, 
                timeLeft: "02:03:45 left",
                badges: [ { text: "LIVE", class: "bg-green" }, { text: "POPULAR", class: "bg-blue" } ]
            },
            { 
                id: 2, 
                title: "Beginner Contest #12", 
                desc: "Perfect for students new to competitive programming",
                participants: 156, 
                problems: 5, 
                timeLeft: "00:48:12 left",
                badges: [ { text: "LIVE", class: "bg-green" }, { text: "EASY", class: "bg-green" } ]
            }
        ],
        upcomingContests: [
            {
                id: 3,
                title: "Monthly Challenge - March 2024",
                desc: "Advanced algorithms and data structures",
                badge: { text: "HARD", class: "bg-red" },
                participants: 0,
                problems: 480,
                duration: "480 min",
                startTime: "3/20/2024 at 8:00:00 PM",
                status: "registered",
                regCount: 89
            },
            {
                id: 4,
                title: "Team Contest #5",
                desc: "Collaborative problem solving in teams of 3",
                badge: { text: "POPULAR", class: "bg-blue" },
                participants: 0,
                problems: 8,
                duration: "180 min",
                startTime: "3/25/2024 at 6:00:00 PM",
                status: "open",
                regCount: 45
            },
            {
                id: 5,
                title: "ICPC Practice Round",
                desc: "Prepare for the International Collegiate Programming Contest",
                badge: { text: "HARD", class: "bg-red" },
                participants: 0,
                problems: 300,
                duration: "300 min",
                startTime: "3/25/2024 at 2:00:00 PM",
                status: "open",
                regCount: 67
            }
        ]
    };

    // --- 5. RENDER UI ---
    renderUI(compData);

    function renderUI(data) {
        
        // Stats
        const statsContainer = document.getElementById('stats-container');
        statsContainer.innerHTML = '';
        data.stats.forEach(stat => {
            let bgVar, textVar;
            if(stat.color === 'yellow') { bgVar = 'var(--stat-yellow-bg)'; textVar = 'var(--stat-yellow-text)'; }
            if(stat.color === 'green') { bgVar = 'var(--stat-green-bg)'; textVar = 'var(--stat-green-text)'; }
            if(stat.color === 'blue') { bgVar = 'var(--stat-blue-bg)'; textVar = 'var(--stat-blue-text)'; }
            if(stat.color === 'purple') { bgVar = 'var(--stat-purple-bg)'; textVar = 'var(--stat-purple-text)'; }

            statsContainer.innerHTML += `
                <div class="stat-card">
                    <div class="stat-info">
                        <span>${stat.label}</span>
                        <h2>${stat.value}</h2>
                    </div>
                    <div class="stat-icon" style="background-color: ${bgVar}; color: ${textVar}">
                        <i class="${stat.icon}"></i>
                    </div>
                </div>
            `;
        });

        // Live Contests
        const liveContainer = document.getElementById('live-container');
        liveContainer.innerHTML = '';
        data.liveContests.forEach(con => {
            const badgesHtml = con.badges.map(b => `<span class="badge ${b.class}">${b.text}</span>`).join('');
            
            liveContainer.innerHTML += `
                <div class="contest-card">
                    <div class="cc-header">
                        <div>
                            <h4>${con.title}</h4>
                            <p>${con.desc}</p>
                        </div>
                        <div class="cc-badges">${badgesHtml}</div>
                    </div>
                    <div class="cc-meta">
                        <span><i class="fa-regular fa-user"></i> ${con.participants} participants</span>
                        <span><i class="fa-regular fa-file-lines"></i> ${con.problems} problems</span>
                        <span><i class="fa-regular fa-clock"></i> ${con.timeLeft}</span>
                    </div>
                    <button class="btn-continue">Continue</button>
                </div>
            `;
        });

        // Upcoming Contests
        const upcomingContainer = document.getElementById('upcoming-container');
        upcomingContainer.innerHTML = '';
        data.upcomingContests.forEach(con => {
            const badgeHtml = con.badge ? `<span class="badge ${con.badge.class}">${con.badge.text}</span>` : '';
            
            upcomingContainer.innerHTML += `
                <div class="upcoming-card">
                    <div class="uc-top">
                        <div class="uc-info">
                            <h4>${con.title} ${badgeHtml}</h4>
                            <p class="uc-desc">${con.desc}</p>
                            <div class="uc-meta-row">
                                <span><i class="fa-regular fa-user"></i> ${con.participants} participants</span>
                                <span><i class="fa-regular fa-file-lines"></i> ${con.problems} problems</span>
                                <span><i class="fa-regular fa-clock"></i> ${con.duration}</span>
                            </div>
                        </div>
                        <div style="text-align:right">
                            <div class="uc-time">${con.startTime}</div>
                            <div class="uc-status"><i class="fa-regular fa-circle-check"></i> ${con.regCount} registered</div>
                        </div>
                    </div>
                    ${con.status === 'registered' ? '<div style="margin-bottom:10px;"><span class="badge bg-green">Registered</span></div>' : ''}
                    <button class="btn-register-full">Register</button>
                </div>
            `;
        });
    }

});