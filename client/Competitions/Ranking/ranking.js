document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SIDEBAR LOGIC ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => { 
            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // --- 2. BACKEND DATA ---
    const rankingsData = {
        stats: [
            { label: "Current Rating", value: "1847", icon: "fa-solid fa-trophy", color: "yellow" },
            { label: "Problems Solved", value: "156", icon: "fa-solid fa-bullseye", color: "green" },
            { label: "Contests Joined", value: "24", icon: "fa-solid fa-users", color: "blue" },
            { label: "Division Rank", value: "#12", icon: "fa-solid fa-medal", color: "purple" }
        ],
        rankings: [
            { label: "Global Rank", rank: "#2,847" },
            { label: "Country Rank", rank: "#234" },
            { label: "University Rank", rank: "#12" }
        ],
        progress: {
            current: 1847,
            max: 2000, // Assuming 2000 is next milestone
            percent: "96%",
            personalBest: 1923,
            title: "Specialist"
        }
    };

    // --- 3. RENDER UI ---
    
    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    rankingsData.stats.forEach(stat => {
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

    // Your Rankings List
    const rankContainer = document.getElementById('ranking-list-container');
    rankContainer.innerHTML = '';
    rankingsData.rankings.forEach(item => {
        rankContainer.innerHTML += `
            <div class="rank-row">
                <span>${item.label}</span>
                <span class="rank-value">${item.rank}</span>
            </div>
        `;
    });

    // Rating Progress
    const rateContainer = document.getElementById('rating-content-container');
    rateContainer.innerHTML = `
        <div class="rating-progress-row">
            <span class="rp-label">Current Rating</span>
            <span class="rp-val">${rankingsData.progress.current}</span>
        </div>
        <div class="rating-progress-row">
            <span class="rp-sub">Personal Best: ${rankingsData.progress.personalBest}</span>
            <span class="rp-sub">${rankingsData.progress.percent}</span>
        </div>
        <div class="rating-bar-container">
            <div class="rating-bar-fill" style="width: ${rankingsData.progress.percent}"></div>
        </div>
        
        <div class="rating-big-display">
            <div class="rating-number">${rankingsData.progress.current}</div>
            <span class="rating-sub">Current Rating</span>
            <div class="rating-badge">${rankingsData.progress.title}</div>
        </div>
    `;

    // --- 4. THEME TOGGLE ---
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
    const contentTabs = document.querySelectorAll('.tab-btn');
    contentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            contentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});