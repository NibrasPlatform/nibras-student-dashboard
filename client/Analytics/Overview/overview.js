window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
    var enContainer = document.getElementById('enrollment-container');
    var sumContainer = document.getElementById('summary-container');

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
            var coursesSummary = data.coursesGradeSummary || [];
            var activities = data.recentActivities || [];
            var submissionSum = data.submissionSummary || {};
            var problemProg = data.problemProgress || {};

            var enrolledCount = coursesSummary.length;
            var completedCourses = coursesSummary.filter(function (c) { return c.status === 'completed'; }).length;
            var grades = coursesSummary.map(function (c) { return c.weightedGrade || 0; }).filter(function (g) { return g > 0; });
            var avgGrade = grades.length > 0 ? Math.round(grades.reduce(function (a, b) { return a + b; }, 0) / grades.length) : 0;

            var studentName = studentStats.name || (user && user.name) || 'Student';

            var stats = [
                { label: 'Courses Enrolled', value: String(enrolledCount), change: completedCourses + ' completed', isPos: true, icon: 'fa-solid fa-book-open' },
                { label: 'Average Grade', value: avgGrade + '%', change: 'across ' + grades.length + ' courses', isPos: true, icon: 'fa-solid fa-graduation-cap' },
                { label: 'Reputation', value: String(studentStats.reputation || 0), change: studentStats.studyStreak ? studentStats.studyStreak + ' day streak' : '', isPos: true, icon: 'fa-solid fa-star' },
                { label: 'Approved Subs', value: String(submissionSum.approved || 0), change: (submissionSum.pending || 0) + ' pending', isPos: true, icon: 'fa-regular fa-circle-check' },
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

            enContainer.innerHTML = '';
            if (coursesSummary.length === 0) {
                enContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No courses enrolled yet.</p>';
            } else {
                coursesSummary.forEach(function (c) {
                    var pct = c.percentage || 0;
                    var title = c.title || c.courseCode || 'Course';
                    enContainer.innerHTML += [
                        '<div class="en-item">',
                        '<div class="en-head"><span>' + escapeHtml(title) + '</span><span class="en-count">' + pct + '%</span></div>',
                        '<div class="en-track"><div class="en-fill" style="width:' + pct + '%;background-color:var(--bar-orange)"></div></div>',
                        '</div>',
                    ].join('');
                });
            }

            sumContainer.innerHTML = '';
            if (activities.length === 0) {
                sumContainer.innerHTML = '<p style="color:var(--text-secondary);padding:1rem;">No recent activity.</p>';
            } else {
                activities.slice(0, 10).forEach(function (a) {
                    var colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
                    var dotColor = colors[Math.floor(Math.random() * colors.length)];
                    var timeAgo = a.createdAt ? timeSince(new Date(a.createdAt)) : '';
                    sumContainer.innerHTML += [
                        '<div class="sum-item">',
                        '<div class="sum-left">',
                        '<div class="sum-dot" style="background-color:' + dotColor + '"></div>',
                        '<div class="sum-info">',
                        '<h4>' + escapeHtml(a.title || a.type || 'Activity') + '</h4>',
                        '<span class="sum-time">' + timeAgo + '</span>',
                        '</div>',
                        '</div>',
                        '<span class="sum-badge" style="background-color:#991b1b">' + escapeHtml(a.statusTag || '') + '</span>',
                        '</div>',
                    ].join('');
                });
            }
        }).catch(function () {
            statsContainer.innerHTML = '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">Failed to load analytics data.</p>';
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(String(str)));
        return d.innerHTML;
    }

    function timeSince(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        var intervals = [
            [31536000, 'year'], [2592000, 'month'], [604800, 'week'],
            [86400, 'day'], [3600, 'hour'], [60, 'minute']
        ];
        for (var i = 0; i < intervals.length; i++) {
            var val = Math.floor(seconds / intervals[i][0]);
            if (val >= 1) return val + ' ' + intervals[i][1] + (val > 1 ? 's' : '') + ' ago';
        }
        return 'just now';
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
