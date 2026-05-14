window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
    var commContainer = document.getElementById('community-metrics-container');
    var contestContainer = document.getElementById('contest-metrics-container');

    var services = window.NibrasServices;

    function getUserId() {
        try {
            var raw = localStorage.getItem('user');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return null;
    }

    var user = getUserId();
    if (user && user._id && services && services.backendAnalyticsService) {
        services.backendAnalyticsService.getStudentPerformance(user._id).then(function (res) {
            var data = res && (res.data || res);
            if (!data) return;

            var studentStats = data.studentStats || {};
            var problemProg = data.problemProgress || {};
            var submissionSum = data.submissionSummary || {};
            var coursesSummary = data.coursesGradeSummary || [];

            var enrolledCount = coursesSummary.length;
            var grades = coursesSummary.map(function (c) { return c.weightedGrade || 0; }).filter(function (g) { return g > 0; });
            var avgGrade = grades.length > 0 ? Math.round(grades.reduce(function (a, b) { return a + b; }, 0) / grades.length) : 0;
            var problemsSolved = studentStats.problemsSolved || 0;
            var contestRating = studentStats.contestRating || 0;

            var stats = [
                { label: 'Courses Enrolled', value: String(enrolledCount), change: 'avg grade ' + avgGrade + '%', isPos: true, icon: 'fa-solid fa-book-open' },
                { label: 'Problems Solved', value: String(problemsSolved), change: 'coding progress', isPos: true, icon: 'fa-solid fa-code' },
                { label: 'Contest Rating', value: String(contestRating), change: 'competitive rank', isPos: contestRating > 0, icon: 'fa-solid fa-trophy' },
                { label: 'Submissions', value: String(submissionSum.total || 0), change: (submissionSum.approved || 0) + ' approved', isPos: true, icon: 'fa-regular fa-paper-plane' },
            ];

            statsContainer.innerHTML = '';
            stats.forEach(function (s) {
                var changeClass = s.isPos ? 'pos' : 'neg';
                statsContainer.innerHTML += [
                    '<div class="ana-stat-card">',
                    '<div class="as-label"><i class="' + s.icon + '"></i> ' + s.label + '</div>',
                    '<div class="as-val">' + s.value + '</div>',
                    '<div class="as-change ' + changeClass + '">' + s.change + '</div>',
                    '</div>',
                ].join('');
            });

            var totalProblems = 0;
            Object.keys(problemProg).forEach(function (key) {
                totalProblems += (problemProg[key].solved || 0);
            });

            if (contestContainer) {
                contestContainer.innerHTML = '';
                contestContainer.innerHTML += '<div class="metric-row"><span class="metric-label">Contest Rating</span><span class="metric-val">' + contestRating + '</span></div>';
                contestContainer.innerHTML += '<div class="metric-row"><span class="metric-label">Problems Solved</span><span class="metric-val">' + totalProblems + '</span></div>';
                contestContainer.innerHTML += '<div class="metric-row"><span class="metric-label">Study Streak</span><span class="metric-val">' + (studentStats.studyStreak || 0) + ' days</span></div>';
                var difficultyCounts = { beginner: 0, newbie: 0, intermediate: 0, advanced: 0 };
                Object.keys(problemProg).forEach(function (key) {
                    difficultyCounts[key] = problemProg[key].solved || 0;
                });
                var sorted = Object.keys(difficultyCounts).filter(function (k) { return difficultyCounts[k] > 0; });
                if (sorted.length === 0) {
                    contestContainer.innerHTML += '<div class="metric-row"><span class="metric-label">Hardest Solved</span><span class="metric-val">—</span></div>';
                } else {
                    var hardest = sorted[sorted.length - 1];
                    var labels = { beginner: 'Beginner', newbie: 'Newbie', intermediate: 'Intermediate', advanced: 'Advanced' };
                    contestContainer.innerHTML += '<div class="metric-row"><span class="metric-label">Hardest Solved</span><span class="metric-val" style="color:var(--green);">' + (labels[hardest] || hardest) + '</span></div>';
                }
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load engagement data.</p>';
        });
    }

    if (commContainer) {
        commContainer.innerHTML = '';
        var communityMetrics = [
            { label: 'Questions Asked', val: '—' },
            { label: 'Answers Provided', val: '—' },
            { label: 'Community Score', val: '—', isGreen: false },
        ];
        communityMetrics.forEach(function (m) {
            var valClass = m.isGreen ? 'metric-green' : '';
            commContainer.innerHTML += [
                '<div class="metric-row">',
                '<span class="metric-label">' + m.label + '</span>',
                '<span class="metric-val ' + valClass + '">' + m.val + '</span>',
                '</div>',
            ].join('');
        });
    }

    var themeBtn = document.getElementById('themeBtn');
    var themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    var appLogo = document.getElementById('app-logo');

    var savedTheme = localStorage.getItem('theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
        if (appLogo) appLogo.src = '/Assets/images/logo-dark.png';
    } else {
        if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
        if (appLogo) appLogo.src = '/Assets/images/logo-light.png';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var html = document.documentElement;
            var cur = html.getAttribute('data-theme');
            var next = cur === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if (themeIcon) themeIcon.className = next === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            if (appLogo) appLogo.src = next === 'dark' ? '/Assets/images/logo-dark.png' : '/Assets/images/logo-light.png';
        });
    }

    var anaTabs = document.querySelectorAll('.ana-tab');
    anaTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            anaTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
        });
    });
});
