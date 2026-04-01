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
    const historyData = {
        stats: [
            { label: "Current Rating", value: "1847", icon: "fa-solid fa-trophy", color: "yellow" },
            { label: "Problems Solved", value: "156", icon: "fa-solid fa-bullseye", color: "green" },
            { label: "Contests Joined", value: "24", icon: "fa-solid fa-users", color: "blue" },
            { label: "Division Rank", value: "#12", icon: "fa-solid fa-medal", color: "purple" }
        ],
        contests: [
            {
                title: "Weekly Programming Contest #44",
                rank: "#23 / 198",
                rating: 1847,
                change: "+23",
                problems: [
                    { name: "Array Rotation", status: "success", attempts: 2, time: "15 min" },
                    { name: "Binary Tree Path", status: "success", attempts: 1, time: "32 min" },
                    { name: "Graph Traversal", status: "fail", attempts: 3, time: "45 min" },
                    { name: "Dynamic Programming", status: "success", attempts: 4, time: "78 min" }
                ]
            },
            {
                title: "Beginner Contest #11",
                rank: "#8 / 145",
                rating: 1824,
                change: "+45",
                problems: [
                    { name: "Simple Math", status: "success", attempts: 1, time: "8 min" },
                    { name: "String Manipulation", status: "success", attempts: 1, time: "22 min" },
                    { name: "Basic Sorting", status: "success", attempts: 2, time: "35 min" }
                ]
            }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    historyData.stats.forEach(stat => {
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

    // History List
    const historyContainer = document.getElementById('history-list-container');
    historyContainer.innerHTML = '';

    historyData.contests.forEach(contest => {
        let problemsHtml = '';
        
        contest.problems.forEach(prob => {
            const isSuccess = prob.status === 'success';
            const boxClass = isSuccess ? 'success' : 'fail';
            const icon = isSuccess ? 'fa-circle-check' : 'fa-circle-xmark';
            
            problemsHtml += `
                <div class="prob-box ${boxClass}">
                    <div class="box-header"><i class="fa-regular ${icon}"></i> ${prob.name}</div>
                    <div class="box-meta">
                        <span>Attempts: ${prob.attempts}</span>
                        <span>Time: ${prob.time}</span>
                    </div>
                </div>
            `;
        });

        const html = `
            <div class="history-card">
                <div class="hc-header">
                    <div class="hc-title"><h4>${contest.title}</h4></div>
                    <div class="hc-rank">
                        <div>Rank ${contest.rank}</div>
                        <div>Rating: ${contest.rating} <span class="rating-change">(${contest.change})</span></div>
                    </div>
                </div>
                <div class="prob-grid">
                    ${problemsHtml}
                </div>
            </div>
        `;
        historyContainer.innerHTML += html;
    });

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
