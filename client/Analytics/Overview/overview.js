window.NibrasReact.run(function () {

    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            navLinks.forEach(function (n) { n.classList.remove('active'); });
            link.classList.add('active');
        });
    });

    var statsContainer = document.getElementById('stats-container');
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

            var enrolledCount = coursesSummary.length;
            var completedCourses = coursesSummary.filter(function (c) { return c.status === 'completed'; }).length;
            var grades = coursesSummary.map(function (c) { return c.weightedGrade || 0; }).filter(function (g) { return g > 0; });
            var avgGrade = grades.length > 0 ? Math.round(grades.reduce(function (a, b) { return a + b; }, 0) / grades.length) : 0;

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

            renderEnrollmentChart(coursesSummary);

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

        services.backendAnalyticsService.getStudentProgress(user._id).then(function (res) {
            var progressData = res && (res.data || res);
            renderProgressChart(progressData);
        }).catch(function () {
            renderProgressChart(null);
        });
    }

    function renderEnrollmentChart(coursesSummary) {
        var canvas = document.getElementById('enrollmentChart');
        if (!canvas || typeof Chart === 'undefined') return;

        if (!coursesSummary || coursesSummary.length === 0) {
            canvas.style.display = 'none';
            return;
        }

        var labels = coursesSummary.map(function (c) { return c.title || c.courseCode || 'Course'; });
        var gradeData = coursesSummary.map(function (c) { return c.weightedGrade || 0; });
        var bgColors = gradeData.map(function (g) {
            if (g >= 90) return '#10b981';
            if (g >= 75) return '#3b82f6';
            if (g >= 60) return '#eab308';
            if (g >= 45) return '#f97316';
            return '#ef4444';
        });

        new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Grade (%)',
                    data: gradeData,
                    backgroundColor: bgColors,
                    borderColor: bgColors,
                    borderWidth: 1,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
                }
            }
        });
    }

    function renderProgressChart(progressData) {
        var canvas = document.getElementById('progressTrendChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var hasData = progressData && progressData.progress && progressData.progress.length > 0;

        if (!hasData) {
            var wrapper = canvas.parentElement;
            wrapper.innerHTML = '<div class="chart-empty"><i class="fa-solid fa-chart-line"></i><span>Progress data will appear once the backend aggregates your learning history</span></div>';
            return;
        }

        var points = progressData.progress;
        var labels = points.map(function (p) { return p.period || p.label || ''; });
        var gradeData = points.map(function (p) { return p.grade || 0; });
        var completionData = points.map(function (p) { return p.completion || p.completionRate || 0; });

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Grade',
                        data: gradeData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6',
                    },
                    {
                        label: 'Completion',
                        data: completionData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } }
                },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'Inter' } } },
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
                }
            }
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
