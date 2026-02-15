document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BACKEND DATA (Mimicking Python Output) ---
    /* 
       Reflects:
       Rank 1: Theory (Similarity = 0.819)
       Why Theory? Math: 0.112, Algorithms: 0.049...
    */
    const recData = [
        {
            rank: 1,
            title: "Theory",
            match: 81.9,
            desc: "Focuses on the mathematical foundations of computer science and algorithm analysis.",
            rankColor: "gold", // custom logic for styling
            // This is the 'explanation' list from python
            contributors: [
                { cap: "Math", score: 0.112 },
                { cap: "Algorithms", score: 0.049 },
                { cap: "Theory", score: 0.034 }
            ]
        },
        {
            rank: 2,
            title: "Artificial Intelligence",
            match: 71.3,
            desc: "Build intelligent systems that learn from data and make predictions.",
            rankColor: "silver",
            contributors: [
                { cap: "AI", score: 0.098 },
                { cap: "Math", score: 0.085 },
                { cap: "Data", score: 0.062 }
            ]
        },
        {
            rank: 3,
            title: "Visual Computing",
            match: 48.7,
            desc: "Computer graphics, computer vision, and image processing.",
            rankColor: "bronze",
            contributors: [
                { cap: "Graphics", score: 0.075 },
                { cap: "Math", score: 0.060 }
            ]
        }
    ];

    // --- 2. RENDER UI ---
    const trackContainer = document.getElementById('track-list-container');
    trackContainer.innerHTML = '';

    recData.forEach(t => {
        // Color Logic
        let rankBg = 'var(--rank-silver)';
        let rankText = 'var(--text-silver)';
        if(t.rankColor === 'gold') { rankBg = 'var(--rank-gold)'; rankText = 'var(--text-gold)'; }
        if(t.rankColor === 'bronze') { rankBg = 'var(--rank-bronze)'; rankText = 'var(--text-bronze)'; }

        // Match Logic
        let matchBg = 'var(--match-green-bg)';
        let matchText = 'var(--match-green-text)';
        if(t.match < 75) { matchBg = 'var(--match-blue-bg)'; matchText = 'var(--match-blue-text)'; }
        if(t.match < 50) { matchBg = 'var(--match-orange-bg)'; matchText = 'var(--match-orange-text)'; }

        // Generate Contributors HTML
        // Note: Score is raw contribution, we can normalize visual bar width relative to highest
        const maxScore = Math.max(...t.contributors.map(c => c.score));
        
        const contribHtml = t.contributors.map(c => {
            const widthPct = (c.score / maxScore) * 100;
            return `
                <div class="contrib-row">
                    <span class="contrib-name">${c.cap}</span>
                    <div class="contrib-bar-container">
                        <div class="contrib-bar" style="width: ${widthPct}%"></div>
                    </div>
                    <span class="contrib-val">${c.score.toFixed(3)}</span>
                </div>
            `;
        }).join('');

        trackContainer.innerHTML += `
            <div class="track-card">
                <div class="track-header">
                    <div class="track-left">
                        <div class="rank-circle" style="background-color:${rankBg}; color:${rankText}">
                            #${t.rank}
                            <span class="rank-label">Rank</span>
                        </div>
                        <div class="track-info">
                            <h2>${t.title}</h2>
                            <p>${t.desc}</p>
                        </div>
                    </div>
                    <div class="match-box">
                        <span class="match-badge" style="background-color:${matchBg}; color:${matchText}">${t.match}% Match</span>
                        <div class="match-bar-track">
                            <div class="match-bar-fill" style="width:${t.match}%; background-color:${matchText}"></div>
                        </div>
                    </div>
                </div>

                <div class="explanation-section">
                    <div class="exp-title">Why this recommendation? (Top Contributors)</div>
                    <div class="contributors-list">
                        ${contribHtml}
                    </div>
                </div>

                <button class="btn-start-track">Explore ${t.title} Track</button>
            </div>
        `;
    });

    // --- 3. THEME TOGGLE & LOGO SWAP ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../Assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = '../Assets/images/logo-light.png';
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
            if(appLogo) appLogo.src = '../Assets/images/logo-dark.png';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
            if(appLogo) appLogo.src = '../Assets/images/logo-light.png';
        }
    });

});