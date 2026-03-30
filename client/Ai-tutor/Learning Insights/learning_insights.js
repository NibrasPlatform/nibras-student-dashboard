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
    const insightsData = {
        analytics: [
            { label: "Problem Solving Speed", icon: "fa-solid fa-arrow-trend-up", val: "+15% this week" },
            { label: "Concept Retention", icon: "fa-solid fa-brain", val: "87%" },
            { label: "Difficulty Progression", icon: "fa-solid fa-chart-simple", val: "Medium → Hard" },
            { label: "Study Consistency", icon: "fa-regular fa-calendar", val: "6 days/week" }
        ],
        strengths: [
            { label: "Arrays & Strings", val: "92%", pct: 92, color: "var(--str-green)" },
            { label: "Dynamic Programming", val: "45%", pct: 45, color: "var(--str-red)" },
            { label: "Graph Algorithms", val: "78%", pct: 78, color: "var(--str-orange)" }
        ]
    };

    // --- 3. RENDER UI ---
    
    // Analytics
    const anaContainer = document.getElementById('analytics-container');
    anaContainer.innerHTML = '';
    insightsData.analytics.forEach(item => {
        anaContainer.innerHTML += `
            <div class="analytic-item">
                <div class="an-label"><i class="${item.icon}"></i> ${item.label}</div>
                <div class="an-val">${item.val}</div>
            </div>
        `;
    });

    // Strength & Weakness
    const strContainer = document.getElementById('strength-container');
    strContainer.innerHTML = '';
    insightsData.strengths.forEach(item => {
        strContainer.innerHTML += `
            <div class="str-item">
                <div class="str-header">
                    <span>${item.label}</span>
                    <span>${item.val}</span>
                </div>
                <div class="str-bar-track">
                    <div class="str-bar-fill" style="width: ${item.pct}%; background-color: ${item.color};"></div>
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

    // --- 5. TAB LOGIC ---
    const aiTabs = document.querySelectorAll('.ai-tab');
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});