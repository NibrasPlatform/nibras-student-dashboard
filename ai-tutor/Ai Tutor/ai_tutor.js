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
    const aiData = {
        quickTopics: [
            { title: "Binary Search", sub: "Algorithms", icon: "fa-solid fa-magnifying-glass", iconColor: "text-primary", bg: "transparent" }, // Using simple styling to match generic
            { title: "Tree Traversal", sub: "Data Structures", icon: "fa-solid fa-network-wired", iconColor: "#16a34a", bg: "#dcfce7" },
            { title: "Dynamic Programming", sub: "Problem Solving", icon: "fa-solid fa-bolt", iconColor: "#ca8a04", bg: "#fef9c3" },
            { title: "Graph Algorithms", sub: "Algorithms", icon: "fa-solid fa-chart-simple", iconColor: "#2563eb", bg: "#dbeafe" },
            { title: "Linked Lists", sub: "Data Structures", icon: "fa-solid fa-link", iconColor: "#4b5563", bg: "#f3f4f6" },
            { title: "Greedy Algorithms", sub: "Problem Solving", icon: "fa-solid fa-bullseye", iconColor: "#dc2626", bg: "#fee2e2" }
        ],
        recent: [
            { title: "How does binary search work?", tag: "Algorithms", conf: "95% confidence", time: "2 hours ago" },
            { title: "Explain time complexity of merge sort", tag: "Data Structures", conf: "88% confidence", time: "1 day ago" },
            { title: "What is dynamic programming?", tag: "Problem Solving", conf: "92% confidence", time: "2 days ago" }
        ],
        stats: [
            { label: "Questions Asked", val: "47", pct: 47, color: "var(--stat-bar-blue)" }, // Simplified pct for bar width relative to 100
            { label: "Avg. Confidence", val: "91%", pct: 91, color: "var(--stat-bar-green)" },
            { label: "Topics Covered", val: "12", pct: 40, color: "var(--stat-bar-purple)" }
        ],
        popular: [
            "Algorithms", "Data Structures", "Complexity Analysis", "Problem Solving", "Code Optimization"
        ]
    };

    // --- 3. RENDER UI ---
    
    // Quick Topics
    const topicContainer = document.getElementById('quick-topics-container');
    topicContainer.innerHTML = '';
    aiData.quickTopics.forEach(t => {
        let style = t.bg === 'transparent' ? '' : `background-color:${t.bg}; color:${t.iconColor};`;
        // Special case for the first icon (Binary Search) in the image looks like standard text color on dark/light
        if(t.title === 'Binary Search') style = `background-color: var(--tag-bg); color: var(--text-primary);`;

        topicContainer.innerHTML += `
            <div class="topic-card">
                <div class="topic-icon" style="${style}">
                    <i class="${t.icon}"></i>
                </div>
                <div class="topic-info">
                    <h4>${t.title}</h4>
                    <span>${t.sub}</span>
                </div>
            </div>
        `;
    });

    // Recent Conversations
    const recentContainer = document.getElementById('recent-ai-container');
    recentContainer.innerHTML = '';
    aiData.recent.forEach(r => {
        recentContainer.innerHTML += `
            <div class="ai-conv-item">
                <h4>${r.title}</h4>
                <div class="ai-meta">
                    <span class="ai-tag tag-red">${r.tag}</span>
                    <span>${r.conf}</span>
                    <span>• <i class="fa-regular fa-clock"></i> ${r.time}</span>
                </div>
            </div>
        `;
    });

    // Stats
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = '';
    aiData.stats.forEach(s => {
        statsContainer.innerHTML += `
            <div class="stat-row">
                <div class="stat-head">
                    <span>${s.label}</span>
                    <span class="stat-val">${s.val}</span>
                </div>
                <div class="stat-track">
                    <div class="stat-fill" style="width: ${s.pct}%; background-color: ${s.color};"></div>
                </div>
            </div>
        `;
    });

    // Popular Topics
    const popContainer = document.getElementById('pop-topics-container');
    popContainer.innerHTML = '';
    aiData.popular.forEach(p => {
        popContainer.innerHTML += `<a href="#" class="pop-link">${p}</a>`;
    });

    // --- 4. THEME TOGGLE & LOGO SWAP ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    const appLogo = document.getElementById('app-logo');

    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun';
        if(appLogo) appLogo.src = '../../assets/images/logo-dark.png';
    } else {
        if(appLogo) appLogo.src = 'logo-light.png';
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

    // --- 5. TAB LOGIC ---
    const aiTabs = document.querySelectorAll('.ai-tab');
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});