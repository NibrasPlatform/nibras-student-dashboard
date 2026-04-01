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
    const reputationData = {
        current: 1250,
        nextLevel: 2500,
        breakdown: [
            { label: "Academic Performance", score: 458, total: 500, color: "blue", icon: "fa-solid fa-book" },
            { label: "Community Contribution", score: 389, total: 500, color: "green", icon: "fa-solid fa-users" },
            { label: "Challenge Solutions", score: 234, total: 300, color: "purple", icon: "fa-regular fa-lightbulb" },
            { label: "Competition Results", score: 171, total: 300, color: "orange", icon: "fa-solid fa-trophy" }
        ],
        levels: [
            { name: "Novice", range: "0 - 100 points", desc: "Ask questions • Submit assignments", status: "passed", dotColor: "#10b981" },
            { name: "Learner", range: "100 - 500 points", desc: "Vote on answers • Comment on posts", status: "passed", dotColor: "#3b82f6" },
            { name: "Contributor", range: "500 - 1000 points", desc: "Edit community posts • Flag irrelevant content", status: "passed", dotColor: "#9333ea" },
            { name: "Expert", range: "1000 - 2000 points", desc: "Contest • Moderate Discussions • Create Study Groups", status: "passed", dotColor: "#ec4899" }, // Pink
            { name: "Master", range: "2500 - 5000 points", desc: "Edit community posts • Pay irrelevant context", status: "active", isLive: true, dotColor: "#f59e0b" },
            { name: "Legend", range: "5000+ points", desc: "All privileges • Mentor credential", status: "locked", dotColor: "#ef4444" }
        ],
        rules: {
            positive: [
                { action: "Answer accepted by question author", points: "+15" },
                { action: "Assignment completed with 90%", points: "+10" },
                { action: "Help peer with code review", points: "+5" },
                { action: "Question upvoted", points: "+3" },
                { action: "Contest participation", points: "+5" },
                { action: "Contest Top 10 finish", points: "+25" }
            ],
            negative: [
                { action: "Answer downvoted", points: "-2" },
                { action: "Question downvoted", points: "-1" },
                { action: "Late assignment submission", points: "-5" },
                { action: "Inappropriate Content flagged", points: "-10" },
                { action: "Academic Integrity violation", points: "-50" }
            ]
        },
        activity: [
            { points: "+15", title: "Answer accepted in CS 201", type: "ACADEMY", time: "2 hrs ago", isPositive: true },
            { points: "+8", title: "Assignment completed with 95%", type: "ACADEMY", time: "5 hrs ago", isPositive: true },
            { points: "+6", title: "Helped classmate with debugging", type: "COMMUNITY", time: "1 day ago", isPositive: true },
            { points: "+25", title: "Won weekly programming contest", type: "COMPETITION", time: "2 days ago", isPositive: true },
            { points: "-5", title: "Late assignment submission", type: "ACADEMY", time: "3 days ago", isPositive: false },
            { points: "+10", title: "Posted helpful tutorial", type: "COMMUNITY", time: "5 days ago", isPositive: true }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Breakdown
    const bdContainer = document.getElementById('breakdown-container');
    bdContainer.innerHTML = '';
    reputationData.breakdown.forEach(item => {
        let colorVar = `var(--bar-${item.color})`;
        let pct = (item.score / item.total) * 100;
        
        bdContainer.innerHTML += `
            <div class="bd-item">
                <div class="bd-head">
                    <span><i class="${item.icon}" style="color:${colorVar}"></i> ${item.label}</span>
                    <span class="bd-val">${item.score} <span class="bd-sub">/ ${item.total}</span></span>
                </div>
                <div class="bd-track">
                    <div class="bd-fill" style="width:${pct}%; background-color:${colorVar}"></div>
                </div>
            </div>
        `;
    });

    // Levels
    const lvContainer = document.getElementById('levels-container');
    lvContainer.innerHTML = '';
    reputationData.levels.forEach(lvl => {
        const activeClass = lvl.status === 'active' ? 'active' : '';
        const liveBadge = lvl.isLive ? `<span class="live-badge">LIVE</span>` : '';
        
        lvContainer.innerHTML += `
            <div class="lvl-card ${activeClass}">
                <div class="lvl-header">
                    <div class="lvl-title">
                        <div class="status-dot" style="background-color: ${lvl.dotColor}"></div>
                        ${lvl.name} ${liveBadge}
                    </div>
                    <span class="lvl-points">${lvl.range}</span>
                </div>
                <div class="lvl-desc">${lvl.desc}</div>
            </div>
        `;
    });

    // Rules
    const posContainer = document.getElementById('rules-pos-container');
    reputationData.rules.positive.forEach(r => {
        posContainer.innerHTML += `<div class="rule-row"><span>${r.action}</span><span class="rule-pts pos">${r.points}</span></div>`;
    });

    const negContainer = document.getElementById('rules-neg-container');
    reputationData.rules.negative.forEach(r => {
        negContainer.innerHTML += `<div class="rule-row"><span>${r.action}</span><span class="rule-pts neg">${r.points}</span></div>`;
    });

    // Activity Feed
    const actContainer = document.getElementById('activity-container');
    actContainer.innerHTML = '';
    reputationData.activity.forEach(act => {
        const iconClass = act.isPositive ? 'pos' : 'neg';
        const icon = act.isPositive ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down';
        const ptsClass = act.isPositive ? 'pos' : 'neg';
        
        // Tag Color logic
        let tagClass = 'tag-academy';
        if(act.type === 'COMMUNITY') tagClass = 'tag-community';
        if(act.type === 'COMPETITION') tagClass = 'tag-comp';

        actContainer.innerHTML += `
            <div class="act-item">
                <div class="act-icon ${iconClass}"><i class="${icon}"></i></div>
                <div class="act-content">
                    <h4><span class="act-pts ${ptsClass}">${act.points}</span></h4>
                    <span class="act-sub">${act.title}</span>
                    <div class="act-meta">
                        <span class="act-tag ${tagClass}">${act.type}</span>
                        <span>${act.time}</span>
                    </div>
                </div>
            </div>
        `;
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

    // --- 5. TAB LOGIC ---
    const segTabs = document.querySelectorAll('.seg-btn');
    segTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            segTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});
