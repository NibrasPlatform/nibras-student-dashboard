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
    const routingData = [
        {
            id: 1,
            question: "How to optimize this recursive solution?",
            routedTo: "Dr. Sarah Chen",
            tag: "Algorithms & Optimization",
            matchConfidence: "94% match confidence",
            response: "Responded in 12 minutes"
        },
        {
            id: 2,
            question: "Database design for social media app",
            routedTo: "TA Mike Johnson",
            tag: "Database Systems",
            matchConfidence: "87% match confidence",
            response: "Responded in 25 minutes"
        },
        {
            id: 3,
            question: "React component lifecycle confusion",
            routedTo: "Prof. Alex Kim",
            tag: "Web Development",
            matchConfidence: "91% match confidence",
            response: "Responded in 8 minutes"
        }
    ];

    // --- 3. RENDER UI ---
    const container = document.getElementById('routing-list-container');
    container.innerHTML = '';

    routingData.forEach(item => {
        container.innerHTML += `
            <div class="route-card">
                <div class="route-header">
                    <h4>${item.question}</h4>
                </div>
                <div class="route-meta">
                    <span class="route-pill">Routed to: ${item.routedTo}</span>
                    <span class="route-tag">${item.tag}</span>
                </div>
                <div class="route-stats">
                    <span>${item.matchConfidence}</span>
                    <span>${item.response}</span>
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

    // --- 5. TAB LOGIC ---
    const aiTabs = document.querySelectorAll('.ai-tab');
    aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            aiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

});