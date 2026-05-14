window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
    var perfContainer = document.getElementById('performance-container');
    var badgesContainer = document.getElementById('badges-container');

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
            var badges = data.badges || [];
            var submissionSum = data.submissionSummary || {};

            var problemsSolved = studentStats.problemsSolved || 0;
            var totalProblems = 0;
            var difficultyLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
            var difficultyColors = { beginner: 'var(--grade-a)', intermediate: 'var(--grade-c)', advanced: 'var(--grade-f)' };

            Object.keys(problemProg).forEach(function (key) {
                totalProblems += (problemProg[key].total || 0);
            });

            var stats = [
                { label: 'Problems Solved', value: String(problemsSolved), change: totalProblems > 0 ? Math.round((problemsSolved / totalProblems) * 100) + '% of all' : '', isPos: true, icon: 'fa-solid fa-code' },
                { label: 'Sub Approved', value: String(submissionSum.approved || 0), change: (submissionSum.pending || 0) + ' pending', isPos: true, icon: 'fa-regular fa-circle-check' },
                { label: 'Reputation', value: String(studentStats.reputation || 0), change: 'total points', isPos: true, icon: 'fa-solid fa-star' },
                { label: 'Study Streak', value: (studentStats.studyStreak || 0) + 'd', change: 'current streak', isPos: true, icon: 'fa-solid fa-fire' },
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

            perfContainer.innerHTML = '';
            var hasProblems = Object.keys(problemProg).length > 0;
            if (!hasProblems) {
                perfContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No problem data available.</p>';
            } else {
                Object.keys(problemProg).forEach(function (key) {
                    var p = problemProg[key];
                    var label = difficultyLabels[key] || key;
                    var color = difficultyColors[key] || 'var(--grade-c)';
                    var pct = p.percentage || 0;
                    var solved = p.solved || 0;
                    var total = p.total || 0;

                    perfContainer.innerHTML += [
                        '<div class="perf-item">',
                        '<div class="perf-head">',
                        '<span>' + escapeHtml(label) + '</span>',
                        '<span class="perf-count">' + solved + ' / ' + total + '</span>',
                        '</div>',
                        '<div class="perf-track">',
                        '<div class="perf-fill" style="width:' + pct + '%;background-color:' + color + '"></div>',
                        '</div>',
                        '</div>',
                    ].join('');
                });
            }

            if (badgesContainer) {
                badgesContainer.innerHTML = '';
                if (badges.length === 0) {
                    badgesContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No badges earned yet. Complete achievements to earn badges!</p>';
                } else {
                    badges.forEach(function (b) {
                        var icon = b.badgeIcon || 'fa-solid fa-medal';
                        badgesContainer.innerHTML += [
                            '<div class="risk-card-item" style="display:flex;align-items:center;gap:0.75rem;">',
                            '<i class="' + icon + '" style="font-size:1.5rem;color:var(--accent-blue);width:2rem;text-align:center;"></i>',
                            '<div class="risk-info" style="flex:1;">',
                            '<h4>' + escapeHtml(b.name || 'Badge') + '</h4>',
                            '<span class="risk-sub">' + escapeHtml(b.description || '') + '</span>',
                            '<span class="risk-time">' + (b.dateAwarded ? new Date(b.dateAwarded).toLocaleDateString() : '') + '</span>',
                            '</div>',
                            '<span class="risk-badge bg-high" style="background-color:var(--accent-blue);">' + (b.points || 0) + ' pts</span>',
                            '</div>',
                        ].join('');
                    });
                }
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load performance data.</p>';
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
        return d.innerHTML;
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
