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
    const recData = [
        {
            id: 1,
            title: "Master Dynamic Programming",
            desc: "Based on your recent struggles with DP problems",
            priority: "High", // High, Medium, Low
            time: "2 weeks",
            resources: "12 resources",
            icon: "fa-regular fa-lightbulb"
        },
        {
            id: 2,
            title: "Graph Algorithms Deep Dive",
            desc: "Next logical step after mastering trees",
            priority: "Medium",
            time: "3 weeks",
            resources: "18 resources",
            icon: "fa-regular fa-lightbulb"
        },
        {
            id: 3,
            title: "System Design Fundamentals",
            desc: "Prepare for technical interviews",
            priority: "Low",
            time: "4 weeks",
            resources: "25 resources",
            icon: "fa-regular fa-lightbulb"
        }
    ];

    // --- 3. RENDER UI ---
    const recContainer = document.getElementById('rec-list-container');
    recContainer.innerHTML = '';

    recData.forEach(item => {
        // Badge Logic
        let badgeClass = 'badge-low';
        let badgeText = item.priority + ' Priority';
        
        if(item.priority === 'High') badgeClass = 'badge-high';
        if(item.priority === 'Medium') badgeClass = 'badge-medium';

        recContainer.innerHTML += `
            <div class="rec-item">
                <div class="rec-left">
                    <div class="rec-icon-box">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="rec-content">
                        <h4>${item.title}</h4>
                        <span class="rec-desc">${item.desc}</span>
                        <div class="rec-meta">
                            <span class="rec-badge ${badgeClass}">${badgeText}</span>
                            <span><i class="fa-regular fa-clock"></i> ${item.time}</span>
                            <span><i class="fa-solid fa-book-open"></i> ${item.resources}</span>
                        </div>
                    </div>
                </div>
                <button class="btn-start-learning">Start Learning</button>
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