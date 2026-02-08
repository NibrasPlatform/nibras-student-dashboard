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
    const practiceData = {
        stats: [
            { label: "Current Rating", value: "1847", icon: "fa-solid fa-trophy", color: "yellow" },
            { label: "Problems Solved", value: "156", icon: "fa-solid fa-bullseye", color: "green" },
            { label: "Contests Joined", value: "24", icon: "fa-solid fa-users", color: "blue" },
            { label: "Division Rank", value: "#12", icon: "fa-solid fa-medal", color: "purple" }
        ],
        problems: [
            {
                id: 1,
                title: "Two Sum",
                difficulty: "Easy",
                tags: ["Array", "Hash Table"],
                acceptance: "65%",
                attempts: 3,
                status: "solved", // solved = check, unsolved = x
                action: "Review"
            },
            {
                id: 2,
                title: "Binary Tree Inorder Traversal",
                difficulty: "Medium",
                tags: ["Tree", "Recursion", "Stack"],
                acceptance: "52%",
                attempts: 1,
                status: "unsolved",
                action: "Solve"
            },
            {
                id: 3,
                title: "Longest Substring Without Repeating Characters",
                difficulty: "Medium",
                tags: ["String", "Sliding Window"],
                acceptance: "47%",
                attempts: 5,
                status: "solved",
                action: "Review"
            },
            {
                id: 4,
                title: "Merge Intervals",
                difficulty: "Medium",
                tags: ["Array", "Sorting"],
                acceptance: "43%",
                attempts: 2,
                status: "unsolved",
                action: "Solve"
            },
            {
                id: 5,
                title: "Word Ladder",
                difficulty: "Hard",
                tags: ["BFS", "Graph"],
                acceptance: "38%",
                attempts: 0,
                status: "unsolved",
                action: "Solve"
            }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    practiceData.stats.forEach(stat => {
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

    // Render Problems (Initial: All)
    renderProblems('All');

    // --- 4. FILTER LOGIC ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active
            btn.classList.add('active');
            // Render
            renderProblems(btn.dataset.filter);
        });
    });

    function renderProblems(filterType) {
        const listContainer = document.getElementById('problem-list-container');
        listContainer.innerHTML = '';

        const filtered = practiceData.problems.filter(p => {
            if (filterType === 'All') return true;
            return p.difficulty === filterType;
        });

        if(filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; color:var(--text-secondary); padding:2rem;">No problems found for ${filterType}</div>`;
            return;
        }

        filtered.forEach(prob => {
            // Status Icon Logic
            const statusIconClass = prob.status === 'solved' 
                ? 'fa-circle-check status-solved' 
                : 'fa-circle-xmark status-unsolved';
            
            const statusIcon = `<i class="fa-regular ${statusIconClass}"></i>`;

            // Tag Generation
            let diffClass = '';
            if(prob.difficulty === 'Easy') diffClass = 'tag-easy';
            if(prob.difficulty === 'Medium') diffClass = 'tag-medium';
            if(prob.difficulty === 'Hard') diffClass = 'tag-hard';

            let tagsHtml = `<span class="prob-tag ${diffClass}">${prob.difficulty}</span>`;
            prob.tags.forEach(tag => {
                tagsHtml += `<span class="prob-tag">${tag}</span>`;
            });

            // Button Style
            const btnClass = prob.action === 'Review' ? 'btn-review' : 'btn-solve';

            const html = `
                <div class="problem-card">
                    <div class="prob-left">
                        <div class="status-icon">${statusIcon}</div>
                        <div class="prob-content">
                            <h4>${prob.title}</h4>
                            <div class="prob-tags">${tagsHtml}</div>
                            <div class="prob-meta">Acceptance: ${prob.acceptance} &nbsp; Your attempts: ${prob.attempts}</div>
                        </div>
                    </div>
                    <button class="action-btn ${btnClass}">${prob.action}</button>
                </div>
            `;
            listContainer.innerHTML += html;
        });
    }

    // --- 5. THEME TOGGLE & LOGO ---
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

    // --- 6. SEARCH LOGIC (Visual) ---
    const searchInput = document.getElementById('problem-search');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.problem-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            if(title.includes(term)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // --- 7. MAIN TABS LOGIC ---
    const mainTabs = document.querySelectorAll('.tab-btn');
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mainTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});