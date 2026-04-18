// Don't wait for NibrasReact - run immediately
console.log('[LEVEL.JS] Script started (direct execution)');

// --- 1. PROGRESS TRACKING ---
function getLevelProgress() {
    const saved = localStorage.getItem('levelProgress');
    return saved ? JSON.parse(saved) : { level1: 100, level2: 0, level3: 0, level4: 0 };
}

function isLevelUnlocked(levelId, progress) {
    // Levels 1, 3, and 4 are always unlocked for exploration
    // Level 2 unlocks when Level 1 >= 80%
    if (levelId === 1 || levelId === 3 || levelId === 4) return true;
    if (levelId === 2) {
        const level1Progress = progress.level1;
        return level1Progress >= 80;
    }
    return false;
}

// --- 2. BACKEND DATA ---
const progress = getLevelProgress();
console.log('[LEVEL.JS] Progress loaded:', progress);

const pathData = [
    {
        id: 1,
        title: "Beginner Level",
        desc: "Start your journey into computer science with fundamental concepts and programming basics.",
        status: isLevelUnlocked(1, progress) ? "unlocked" : "locked",
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
        status: isLevelUnlocked(2, progress) ? "unlocked" : "locked",
        btnText: "Start Learning",
        topics: [
            "Data Structures (Arrays, Lists, Stacks)",
            "Object-Oriented Programming",
            "Algorithm Complexity (Big O)",
            "Recursion and Sorting",
            "File Handling and IO"
        ],
        page: "../Courses/intermediateCourses.html"
    },
    {
        id: 3,
        title: "Advanced Level",
        desc: "Master advanced topics including system design, databases, networks, and software engineering principles.",
        status: isLevelUnlocked(3, progress) ? "unlocked" : "locked",
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
        status: isLevelUnlocked(4, progress) ? "unlocked" : "locked",
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

// --- 3. RENDER UI ---
function renderLevels() {
    const container = document.getElementById('levels-container');
    if (!container) {
        console.error('[LEVEL.JS] ERROR: levels-container not found!');
        return;
    }
    
    console.log('[LEVEL.JS] Found container, rendering', pathData.length, 'levels');
    container.innerHTML = '';

    pathData.forEach(level => {
        console.log(`[LEVEL.JS] Rendering level ${level.id}: ${level.title}, status: ${level.status}`);
        
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
                <button class="btn-locked" onclick="window.showLockModal(${level.id})">
                    <div class="lock-overlay">
                        <i class="fa-solid fa-lock"></i>
                        <span>Complete Level ${level.id - 1} with 80% to unlock</span>
                    </div>
                </button>
            `;
        }

        // Details Logic
        let detailsHtml = '';
        if (!isLocked) {
            const topicsLi = level.topics.map(t => `<li>${t}</li>`).join('');
            detailsHtml = `
                <button class="btn-toggle-details" onclick="window.toggleDetails(${level.id}, this)">
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
    
    console.log('[LEVEL.JS] Rendering complete');
}

// --- 4. MODAL HANDLER ---
window.showLockModal = function(levelId) {
    const prevLevel = levelId - 1;
    const progress = getLevelProgress();
    const prevProgress = progress[`level${prevLevel}`];
    
    alert(`🔒 Level Locked\n\nComplete Level ${prevLevel} with at least 80% progress to unlock this level.\n\nCurrent Level ${prevLevel} Progress: ${prevProgress}%`);
};

// --- 5. TOGGLE DETAILS FUNCTION ---
window.toggleDetails = function(id, btn) {
    const detailsDiv = document.getElementById(`details-${id}`);
    if (!detailsDiv) return;
    
    if (detailsDiv.classList.contains('open')) {
        detailsDiv.classList.remove('open');
        btn.innerHTML = `See Level Details <i class="fa-solid fa-chevron-down"></i>`;
    } else {
        detailsDiv.classList.add('open');
        btn.innerHTML = `Hide Details <i class="fa-solid fa-chevron-up"></i>`;
    }
};

// --- 6. INITIALIZE ON DOM READY ---
function initLevel() {
    console.log('[LEVEL.JS] Initialization starting');
    
    // Render levels
    renderLevels();
    
    // Theme toggle
    const themeBtn = document.getElementById('themeBtn');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    
    if (themeIcon) {
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
    }

    // Overall progress update
    function updateOverallProgress() {
        const progress = getLevelProgress();
        const levels = [
            { progress: progress.level1 >= 80 },
            { progress: progress.level2 >= 80 },
            { progress: progress.level3 >= 80 },
            { progress: progress.level4 >= 80 }
        ];
        
        const completedLevels = levels.filter(l => l.progress).length;
        const progressPercent = (completedLevels / 4) * 100;
        
        const opSpan = document.querySelector('.op-header span');
        const opFill = document.querySelector('.op-fill');
        
        if (opSpan) opSpan.textContent = `${completedLevels} of 4 levels completed`;
        if (opFill) opFill.style.width = `${progressPercent}%`;
    }

    updateOverallProgress();

    // Manual selection
    const manualBtn = document.querySelector('.btn-manual');
    if (manualBtn) {
        manualBtn.addEventListener('click', () => {
            window.location.href = '../Courses/courses.html';
        });
    }
    
    console.log('[LEVEL.JS] Initialization complete');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLevel);
} else {
    initLevel();
}
