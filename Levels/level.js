document.addEventListener('DOMContentLoaded', () => {

    // --- 1. BACKEND DATA ---
    const pathData = [
        {
            id: 1,
            title: "Beginner Level",
            desc: "Start your journey into computer science with fundamental concepts and programming basics.",
            status: "unlocked", // unlocked or locked
            btnText: "Start Learning",
            topics: [
                "Introduction to Programming",
                "Variables and Data Types",
                "Control Structures",
                "Basic Algorithms",
                "Problem Solving Fundamentals"
            ],
            page : "../Courses/courses.html"
        },
        {
            id: 2,
            title: "Intermediate Level",
            desc: "Build upon your foundation with data structures, advanced programming concepts, and algorithm design.",
            status: "unlocked",
            btnText: "Start Learning",
            topics: [
                "Data Structures (Arrays, Lists, Stacks)",
                "Object-Oriented Programming",
                "Algorithm Complexity (Big O)",
                "Recursion and Sorting",
                "File Handling and IO"
            ]
        },
        {
            id: 3,
            title: "Advanced Level",
            desc: "Master advanced topics including system design, databases, networks, and software engineering principles.",
            status: "unlocked",
            btnText: "Start Learning",
            topics: [
                "Advanced Data Structures (Trees, Graphs)",
                "Database Management Systems",
                "Computer Networking Basics",
                "Operating Systems Concepts",
                "Software Design Patterns"
            ],
            page: "../Recommendation System/recommendation.html"
        },
        {
            id: 4,
            title: "Expert Level",
            desc: "Reach mastery with artificial intelligence, machine learning, distributed systems, and cutting-edge technologies.",
            status: "locked",
            btnText: "Locked",
            topics: [
                "Artificial Intelligence Basics",
                "Distributed Systems",
                "Cloud Computing Architectures",
                "Advanced Algorithms Design",
                "Cyber Security Fundamentals"
            ]
        }
    ];

    // --- 2. RENDER UI ---
    const container = document.getElementById('levels-container');
    container.innerHTML = '';

    pathData.forEach(level => {
        const isLocked = level.status === 'locked';
        const cardClass = isLocked ? 'locked' : '';
        const icon = isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-book-open';
        
        // Button Logic
        let buttonHtml = '';

        if (!isLocked && level.page) {
            buttonHtml = `
                <a href="${level.page}" class="btn-level-action btn-start">
                    ${level.btnText}
                </a>
            `;
        } else if (!isLocked) {
            buttonHtml = `
                <button class="btn-level-action btn-start">
                    ${level.btnText}
                </button>
            `;
}

        if(isLocked) {
            buttonHtml = `
                <div class="lock-overlay">
                    <i class="fa-solid fa-lock"></i>
                    <span>Complete previous level to unlock</span>
                </div>
            `;
        }

        // Details Logic
        let detailsHtml = '';
        if (!isLocked) {
            const topicsLi = level.topics.map(t => `<li>${t}</li>`).join('');
            detailsHtml = `
                <button class="btn-toggle-details" onclick="toggleDetails(${level.id}, this)">
                    See Level Details <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="lvl-details" id="details-${level.id}">
                    <h4 class="topics-title">What you'll learn</h4>
                    <ul class="topics-list">
                        ${topicsLi}
                    </ul>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="level-card ${cardClass}">
                <div class="lvl-card-header">
                    <div class="lvl-icon-box">
                        <i class="${icon}"></i>
                    </div>
                    <div class="lvl-info">
                        <h2>${level.title}</h2>
                        <p>${level.desc}</p>
                    </div>
                </div>

                <div class="lvl-actions">
                    ${detailsHtml}
                    ${buttonHtml}
                </div>
            </div>
        `;
    });

    // --- 3. TOGGLE DETAILS FUNCTION ---
    window.toggleDetails = function(id, btn) {
        const detailsDiv = document.getElementById(`details-${id}`);
        const icon = btn.querySelector('i');
        
        if (detailsDiv.classList.contains('open')) {
            detailsDiv.classList.remove('open');
            btn.innerHTML = `See Level Details <i class="fa-solid fa-chevron-down"></i>`;
        } else {
            detailsDiv.classList.add('open');
            btn.innerHTML = `Hide Details <i class="fa-solid fa-chevron-up"></i>`;
        }
    };

    // --- 4. THEME TOGGLE ---
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn.querySelector('i');
    
    // Initial Check
    if(document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.className = 'fa-regular fa-sun'; 
    } else {
        themeIcon.className = 'fa-regular fa-moon'; 
    }

    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        
        if (current === 'light') {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-regular fa-sun';
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-regular fa-moon';
        }
    });

});