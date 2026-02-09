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
    const leaderboardData = {
        currentUser: {
            rank: 6,
            name: "Ziad Alaa",
            initials: "ZA",
            role: "student",
            points: 1250,
            change: 890,
            changeType: "pos" // pos or neg
        },
        list: [
            { rank: 1, name: "Alice Johnson", initials: "AJ", role: "student", meta: "24 achievements • 45 day streak", points: 2847, change: 1250, changeType: "pos" },
            { rank: 2, name: "Michael Chen", initials: "MC", role: "student", meta: "22 achievements • 32 day streak", points: 2456, change: 1180, changeType: "pos" },
            { rank: 3, name: "Sarah Wilson", initials: "SW", role: "student", meta: "20 achievements • 28 day streak", points: 2234, change: 1120, changeType: "pos" },
            { rank: 4, name: "David Kumar", initials: "DK", role: "student", meta: "19 achievements • 15 day streak", points: 2166, change: -1080, changeType: "neg" },
            { rank: 5, name: "Emily Rodriguez", initials: "ER", role: "student", meta: "18 achievements • 27 day streak", points: 1867, change: 1045, changeType: "pos" },
            { rank: 6, name: "Ziad Alaa", initials: "ZA", role: "student", meta: "16 achievements • 22 day streak", points: 1250, change: -890, changeType: "neg" },
            { rank: 7, name: "Lisa Hong", initials: "LH", role: "student", meta: "14 achievements • 18 day streak", points: 1180, change: 846, changeType: "pos" },
            { rank: 8, name: "Robert Brown", initials: "RB", role: "student", meta: "13 achievements • 9 day streak", points: 1134, change: 823, changeType: "pos" }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Render Current User Card
    const user = leaderboardData.currentUser;
    const userContainer = document.getElementById('user-rank-container');
    
    const uChangeClass = user.changeType === 'pos' ? 'pos' : 'neg';
    const uChangeIcon = user.changeType === 'pos' ? '^' : 'v'; 
    // Image uses simple ^ numbers, let's use arrows or simple text
    const uChangeText = user.changeType === 'pos' ? `^${user.change}` : `v${Math.abs(user.change)}`;

    userContainer.innerHTML = `
        <div class="ur-left">
            <div class="ur-avatar">${user.initials}</div>
            <div class="ur-rank">#${user.rank}</div>
            <div class="ur-info">
                <h3>${user.name} <span class="ur-badge">${user.role}</span></h3>
            </div>
        </div>
        <div class="ur-right">
            <div class="ur-points">${user.points} <span class="change-val ${uChangeClass}">${uChangeText}</span></div>
            <span class="ur-sub">reputation points</span>
        </div>
    `;

    // Render List
    const listContainer = document.getElementById('leaderboard-container');
    listContainer.innerHTML = '';

    leaderboardData.list.forEach(item => {
        // Rank Icon Logic
        let rankHtml = `<div class="rank-box">#${item.rank}</div>`;
        if (item.rank === 1) rankHtml = `<div class="rank-box"><i class="fa-solid fa-crown rank-icon gold"></i></div>`;
        if (item.rank === 2) rankHtml = `<div class="rank-box"><i class="fa-solid fa-shield rank-icon silver"></i></div>`;
        if (item.rank === 3) rankHtml = `<div class="rank-box"><i class="fa-solid fa-gem rank-icon bronze"></i></div>`;

        // Change Logic
        const cClass = item.changeType === 'pos' ? 'pos' : 'neg';
        const cText = item.changeType === 'pos' ? `^${item.change}` : `v${Math.abs(item.change)}`;

        // Highlight Current User in List
        const isMe = item.name === user.name ? 'style="border: 2px solid var(--accent-blue);"' : '';

        listContainer.innerHTML += `
            <div class="lb-row" ${isMe}>
                <div class="lb-left">
                    ${rankHtml}
                    <div class="lb-avatar">${item.initials}</div>
                    <div class="lb-user-info">
                        <h4>${item.name} <span class="ur-badge" style="font-size:0.7rem">${item.role}</span></h4>
                        <span class="lb-meta">${item.meta}</span>
                    </div>
                </div>
                <div class="lb-right">
                    <div class="lb-points">${item.points} <span class="lb-change ${cClass}">${cText}</span></div>
                    <span class="lb-meta">reputation points</span>
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
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../../assets/images/logo-light.png';
        }
    });

    // --- 5. TABS LOGIC ---
    const segTabs = document.querySelectorAll('.seg-btn');
    segTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            segTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    const pills = document.querySelectorAll('.pill-btn');
    pills.forEach(p => {
        p.addEventListener('click', () => {
            pills.forEach(btn => btn.classList.remove('active'));
            p.classList.add('active');
        });
    });

});