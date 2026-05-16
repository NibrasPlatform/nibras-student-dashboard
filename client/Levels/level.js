window.NibrasReact.run(function () {
    console.log('[LEVEL.JS] Script started (via NibrasReact)');

    var progress = { level1: 0, level2: 0, level3: 0, level4: 0 };

    try {
        var saved = localStorage.getItem('levelProgress');
        if (saved) progress = JSON.parse(saved);
    } catch (_) {}

    var overallProgress = 0;

    function isLevelUnlocked(levelId, overallPct) {
        if (levelId === 1) return true;
        if (levelId === 2) return overallPct >= 25;
        if (levelId === 3) return overallPct >= 50;
        if (levelId === 4) return overallPct >= 75;
        return false;
    }

    var pathData = [
        {
            id: 1, title: "Beginner Level",
            desc: "Start your journey into computer science with fundamental concepts and programming basics.",
            topics: ["Introduction to Programming", "Variables and Data Types", "Control Structures", "Basic Algorithms", "Problem Solving Fundamentals"],
            page: "../Courses/courses.html"
        },
        {
            id: 2, title: "Intermediate Level",
            desc: "Build upon your foundation with data structures, advanced programming concepts, and algorithm design.",
            topics: ["Data Structures (Arrays, Lists, Stacks)", "Object-Oriented Programming", "Algorithm Complexity (Big O)", "Recursion and Sorting", "File Handling and IO"],
            page: "../Courses/intermediateCourses.html"
        },
        {
            id: 3, title: "Advanced Level",
            desc: "Master advanced topics including system design, databases, networks, and software engineering principles.",
            topics: ["Advanced Data Structures (Trees, Graphs)", "Database Management Systems", "Computer Networking Basics", "Operating Systems Concepts", "Software Design Patterns"],
            page: "../Recommendation System/recommendation.html"
        },
        {
            id: 4, title: "Expert Level",
            desc: "Reach mastery with artificial intelligence, machine learning, distributed systems, and cutting-edge technologies.",
            topics: ["Artificial Intelligence Basics", "Distributed Systems", "Cloud Computing Architectures", "Advanced Algorithms Design", "Cyber Security Fundamentals"]
        }
    ];

    function renderLevels() {
        var container = document.getElementById('levels-container');
        if (!container) { console.error('[LEVEL.JS] levels-container not found!'); return; }
        container.innerHTML = '';

        pathData.forEach(function (level) {
            var unlocked = isLevelUnlocked(level.id, overallProgress);
            var isLocked = !unlocked;
            var cardClass = isLocked ? 'locked' : '';
            var icon = isLocked ? 'fa-solid fa-lock' : 'fa-solid fa-book-open';

            var buttonHtml = '';
            if (unlocked && level.page) {
                buttonHtml = '<a href="javascript:;" onclick="window.selectLevel(' + level.id + ', \'' + level.page + '\')" class="btn-level-action btn-start">' + (level.id === 4 ? 'Coming Soon' : 'Start Learning') + '</a>';
            } else if (unlocked) {
                buttonHtml = '<button class="btn-level-action btn-start">Start Learning</button>';
            }
            if (isLocked) {
                buttonHtml = [
                    '<button class="btn-locked" onclick="window.showLockModal(' + level.id + ')">',
                    '<div class="lock-overlay"><i class="fa-solid fa-lock"></i>',
                    '<span>Reach ' + (level.id === 2 ? '25' : level.id === 3 ? '50' : '75') + '% overall progress to unlock</span></div>',
                    '</button>',
                ].join('');
            }

            var detailsHtml = '';
            if (unlocked) {
                var topicsLi = level.topics.map(function (t) { return '<li>' + t + '</li>'; }).join('');
                detailsHtml = [
                    '<button class="btn-toggle-details" onclick="window.toggleDetails(' + level.id + ', this)">',
                    'See Level Details <i class="fa-solid fa-chevron-down"></i></button>',
                    '<div class="lvl-details" id="details-' + level.id + '">',
                    '<h4 class="topics-title">What you\'ll learn</h4>',
                    '<ul class="topics-list">' + topicsLi + '</ul></div>',
                ].join('');
            }

            container.innerHTML += [
                '<div class="level-card ' + cardClass + '">',
                '<div class="lvl-card-header">',
                '<div class="lvl-icon-box"><i class="' + icon + '"></i></div>',
                '<div class="lvl-info"><h2>' + level.title + '</h2><p>' + level.desc + '</p></div>',
                '</div>',
                '<div class="lvl-actions">' + detailsHtml + buttonHtml + '</div>',
                '</div>',
            ].join('');
        });
    }

    function updateOverallProgressBar() {
        var completed = 0;
        [1, 2, 3, 4].forEach(function (id) {
            if (isLevelUnlocked(id, overallProgress)) completed++;
        });
        var pct = (completed / 4) * 100;
        var opSpan = document.querySelector('.op-header span');
        var opFill = document.querySelector('.op-fill');
        if (opSpan) opSpan.textContent = completed + ' of 4 levels' + (overallProgress > 0 ? ' (' + overallProgress + '% course progress)' : '');
        if (opFill) opFill.style.width = pct + '%';
    }

    window.showLockModal = function (levelId) {
        alert('\uD83D\uDD12 Level Locked\n\nReach ' + (levelId === 2 ? '25' : levelId === 3 ? '50' : '75') + '% overall course progress to unlock this level.\n\nCurrent Progress: ' + overallProgress + '%');
    };

    window.selectLevel = function (levelId, page) {
        var levelNames = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
        var levelName = levelNames[levelId] || 'Beginner';

        try {
            var u = JSON.parse(localStorage.getItem('user'));
            if (u) { u.selectedLevel = levelName; localStorage.setItem('user', JSON.stringify(u)); }
        } catch (_) {}

        function navigate() { window.location.href = page; }

        var s = window.NibrasServices;
        if (s && s.coursesService && s.coursesService.updateLevel) {
            s.coursesService.updateLevel(levelName).then(navigate).catch(navigate);
        } else {
            navigate();
        }
    };

    window.toggleDetails = function (id, btn) {
        var detailsDiv = document.getElementById('details-' + id);
        if (!detailsDiv) return;
        if (detailsDiv.classList.contains('open')) {
            detailsDiv.classList.remove('open');
            btn.innerHTML = 'See Level Details <i class="fa-solid fa-chevron-down"></i>';
        } else {
            detailsDiv.classList.add('open');
            btn.innerHTML = 'Hide Details <i class="fa-solid fa-chevron-up"></i>';
        }
    };

    var services = window.NibrasServices;

    if (services && services.coursesService && services.coursesService.getGlobalProgress) {
        services.coursesService.getGlobalProgress().then(function (res) {
            var data = res && (res.data || res);
            var pct = data && (data.overallPercentage || data.percentage || data.progress || 0);
            overallProgress = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Math.round(Number(pct)))) : 0;
        }).catch(function () {
            overallProgress = 0;
        }).finally(function () {
            renderLevels();
            updateOverallProgressBar();
        });
    } else {
        overallProgress = 0;
        renderLevels();
        updateOverallProgressBar();
    }

    var themeBtn = document.getElementById('themeBtn');
    var themeIcon = themeBtn ? themeBtn.querySelector('i') : null;

    if (themeIcon) {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            themeIcon.className = 'fa-regular fa-sun';
        } else {
            themeIcon.className = 'fa-regular fa-moon';
        }
        themeBtn.addEventListener('click', function () {
            var html = document.documentElement;
            var cur = html.getAttribute('data-theme');
            if (cur === 'light') {
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

    var manualBtn = document.querySelector('.btn-manual');
    if (manualBtn) {
        manualBtn.addEventListener('click', function () {
            window.location.href = '../Courses/courses.html';
        });
    }

    console.log('[LEVEL.JS] Initialization complete, overallProgress:', overallProgress);
});
